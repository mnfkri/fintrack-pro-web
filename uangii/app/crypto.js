// AES-256-GCM + PBKDF2-SHA256 vault encryption using Web Crypto API
(() => {
  'use strict';

  const ITERATIONS = 100000;
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  function toBase64(bytes) {
    let bin = '';
    const arr = new Uint8Array(bytes);
    for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
    return btoa(bin);
  }

  function fromBase64(str) {
    const bin = atob(str);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  }

  async function deriveKey(passphrase, salt) {
    const baseKey = await crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async function encryptVault(payloadObj, passphrase) {
    if (!passphrase || passphrase.length < 4) {
      throw new Error('Sandi brankas minimal 4 karakter.');
    }
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passphrase, salt);
    const plaintext = enc.encode(JSON.stringify(payloadObj));
    const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
    return {
      format: 'uangii-vault-v1',
      alg: 'AES-256-GCM',
      kdf: 'PBKDF2-SHA256',
      iterations: ITERATIONS,
      salt: toBase64(salt),
      iv: toBase64(iv),
      ciphertext: toBase64(cipherBuf),
      updatedAt: new Date().toISOString()
    };
  }

  async function decryptVault(envelope, passphrase) {
    if (!envelope || envelope.format !== 'uangii-vault-v1' || !envelope.ciphertext) {
      throw new Error('Format file brankas tidak dikenali.');
    }
    const salt = fromBase64(envelope.salt);
    const iv = fromBase64(envelope.iv);
    const cipher = fromBase64(envelope.ciphertext);
    const key = await deriveKey(passphrase, salt);
    try {
      const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
      return JSON.parse(dec.decode(plainBuf));
    } catch (_) {
      throw new Error('Sandi brankas salah atau data rusak.');
    }
  }

  window.UangiiCrypto = { encryptVault, decryptVault };
})();
