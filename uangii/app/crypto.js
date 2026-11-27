// Android-compatible FINTRACK_ENC_V2 / V1 (AES-256-GCM + PBKDF2-SHA256) using Web Crypto API
// Matches EncryptedBackupManager.kt in Uangii Android.
(() => {
  'use strict';

  const V2_PREFIX = 'FINTRACK_ENC_V2:';
  const V1_PREFIX = 'FINTRACK_ENC_V1:';
  const V2_DEFAULT_ITERATIONS = 210000;
  const V1_ITERATIONS = 10000;
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  function toBase64(bytes) {
    let bin = '';
    const arr = new Uint8Array(bytes);
    const chunk = 0x8000;
    for (let i = 0; i < arr.length; i += chunk) {
      bin += String.fromCharCode.apply(null, arr.subarray(i, i + chunk));
    }
    return btoa(bin);
  }

  function fromBase64(str) {
    const clean = String(str || '').replace(/\s+/g, '');
    const bin = atob(clean);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  }

  async function deriveKey(passphrase, salt, iterations) {
    const baseKey = await crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Encrypts into Android FINTRACK_ENC_V2 string format:
  // "FINTRACK_ENC_V2:" + Base64([4-byte BE iterations][16-byte salt][12-byte iv][ciphertext+16-byte tag])
  async function encryptVault(payloadObj, passphrase) {
    if (!passphrase || passphrase.length < 4) {
      throw new Error('Masukkan sandi cadangan (minimal 4 karakter).');
    }
    const iterations = V2_DEFAULT_ITERATIONS;
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passphrase, salt, iterations);
    const aad = enc.encode(V2_PREFIX + iterations);
    const plaintext = enc.encode(JSON.stringify(payloadObj));
    const cipherBuf = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, additionalData: aad, tagLength: 128 },
      key,
      plaintext
    );
    const cipherBytes = new Uint8Array(cipherBuf);
    const out = new Uint8Array(4 + 16 + 12 + cipherBytes.length);
    const view = new DataView(out.buffer);
    view.setUint32(0, iterations, false); // Big-Endian
    out.set(salt, 4);
    out.set(iv, 20);
    out.set(cipherBytes, 32);
    return V2_PREFIX + toBase64(out);
  }

  // Decrypts FINTRACK_ENC_V2, FINTRACK_ENC_V1, plain JSON, or legacy web envelope
  async function decryptVault(rawData, passphrase) {
    const rawStr = typeof rawData === 'string' ? rawData.trim() : JSON.stringify(rawData);

    // 1. Android Modern V2: "FINTRACK_ENC_V2:" + Base64(...)
    if (rawStr.startsWith(V2_PREFIX)) {
      if (!passphrase) throw new Error('Masukkan sandi cadangan terlebih dahulu.');
      const bytes = fromBase64(rawStr.slice(V2_PREFIX.length));
      if (bytes.length < 4 + 16 + 12 + 16) {
        throw new Error('Data cadangan V2 tidak lengkap atau rusak.');
      }
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const iterations = view.getUint32(0, false);
      if (iterations < 100000 || iterations > 1000000) {
        throw new Error(`Jumlah iterasi KDF tidak valid (${iterations}).`);
      }
      const salt = bytes.subarray(4, 20);
      const iv = bytes.subarray(20, 32);
      const cipher = bytes.subarray(32);
      const aad = enc.encode(V2_PREFIX + iterations);
      const key = await deriveKey(passphrase, salt, iterations);
      try {
        const plainBuf = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv, additionalData: aad, tagLength: 128 },
          key,
          cipher
        );
        return JSON.parse(dec.decode(plainBuf));
      } catch (_) {
        throw new Error('Sandi cadangan salah atau file rusak.');
      }
    }

    // 2. Android Legacy V1: "FINTRACK_ENC_V1:" + Base64([16-byte salt][12-byte iv][ciphertext+tag])
    if (rawStr.startsWith(V1_PREFIX)) {
      if (!passphrase) throw new Error('Masukkan sandi cadangan terlebih dahulu.');
      const bytes = fromBase64(rawStr.slice(V1_PREFIX.length));
      if (bytes.length < 16 + 12 + 16) {
        throw new Error('Data cadangan V1 tidak lengkap atau rusak.');
      }
      const salt = bytes.subarray(0, 16);
      const iv = bytes.subarray(16, 28);
      const cipher = bytes.subarray(28);
      const key = await deriveKey(passphrase, salt, V1_ITERATIONS);
      try {
        const plainBuf = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv, tagLength: 128 },
          key,
          cipher
        );
        return JSON.parse(dec.decode(plainBuf));
      } catch (_) {
        throw new Error('Sandi cadangan V1 salah atau file memakai kunci internal lama.');
      }
    }

    // 3. JSON string (either legacy uangii-vault-v1 envelope or unencrypted JSON backup)
    let parsed;
    try {
      parsed = typeof rawData === 'string' ? JSON.parse(rawStr) : rawData;
    } catch (_) {
      throw new Error('Format file cadangan tidak dikenali.');
    }

    if (parsed && parsed.format === 'uangii-vault-v1' && parsed.ciphertext) {
      if (!passphrase) throw new Error('Masukkan sandi brankas terlebih dahulu.');
      const salt = fromBase64(parsed.salt);
      const iv = fromBase64(parsed.iv);
      const cipher = fromBase64(parsed.ciphertext);
      const iters = Number(parsed.iterations) >= 100000 ? Number(parsed.iterations) : 100000;
      const key = await deriveKey(passphrase, salt, iters);
      try {
        const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
        return JSON.parse(dec.decode(plainBuf));
      } catch (_) {
        throw new Error('Sandi brankas salah atau data rusak.');
      }
    }

    // Plain JSON backup object
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }

    throw new Error('Format file cadangan tidak dikenali.');
  }

  window.UangiiCrypto = { encryptVault, decryptVault };
})();
