// Stage 1 Google Drive AppData Sync Adapter (GIS OAuth2 + Drive API v3)
// Designed with a clean adapter interface so Stage 2 Firebase Live Sync can plug in cleanly.
(() => {
  'use strict';

  const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
  let accessToken = null;
  let tokenExpiresAt = 0;

  function getClientId() {
    return ((window.UANGII_WEB_CONFIG && window.UANGII_WEB_CONFIG.googleClientId) || '').trim();
  }

  function isConnected() {
    return Boolean(accessToken && Date.now() < tokenExpiresAt - 15000);
  }

  function connect() {
    return new Promise((resolve, reject) => {
      const clientId = getClientId();
      if (!clientId) {
        reject(new Error('Google OAuth Client ID belum diisi. Isi dulu di kolom Konfigurasi Drive.'));
        return;
      }
      if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
        reject(new Error('Google Identity Services belum termuat. Periksa koneksi internet lalu coba lagi.'));
        return;
      }
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPE,
        callback: (resp) => {
          if (resp.error) {
            reject(new Error('Login Google dibatalkan atau gagal: ' + resp.error));
            return;
          }
          accessToken = resp.access_token;
          tokenExpiresAt = Date.now() + Number(resp.expires_in || 3600) * 1000;
          resolve({ connected: true });
        }
      });
      client.requestAccessToken({ prompt: accessToken ? '' : 'consent' });
    });
  }

  function disconnect() {
    if (accessToken && window.google?.accounts?.oauth2) {
      try { window.google.accounts.oauth2.revoke(accessToken); } catch (_) {}
    }
    accessToken = null;
    tokenExpiresAt = 0;
  }

  async function driveFetch(url, options = {}) {
    if (!isConnected()) throw new Error('Belum terhubung ke Google Drive. Klik "Hubungkan Google Drive" dulu.');
    const headers = Object.assign({ Authorization: 'Bearer ' + accessToken }, options.headers || {});
    const res = await fetch(url, Object.assign({}, options, { headers }));
    if (!res.ok) {
      const msg = await res.text().catch(() => res.statusText);
      throw new Error(`Google Drive API error (${res.status}): ${msg.slice(0, 160)}`);
    }
    return res;
  }

  async function findVaultFile() {
    const name = window.UANGII_WEB_CONFIG.driveFileName;
    const q = encodeURIComponent(`name='${name}' and 'appDataFolder' in parents and trashed=false`);
    const res = await driveFetch(
      `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,name,modifiedTime)`
    );
    const data = await res.json();
    return (data.files && data.files[0]) || null;
  }

  async function pushEncryptedSnapshot(passphrase) {
    const snapshot = await window.UangiiDB.exportSnapshot();
    const envelope = await window.UangiiCrypto.encryptVault(snapshot, passphrase);
    const bodyJson = JSON.stringify(envelope);
    const existing = await findVaultFile();
    const name = window.UANGII_WEB_CONFIG.driveFileName;

    if (existing) {
      await driveFetch(
        `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=media`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: bodyJson
        }
      );
    } else {
      const boundary = 'uangii_boundary_' + Date.now();
      const metadata = JSON.stringify({ name, parents: ['appDataFolder'] });
      const multipart =
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
        `--${boundary}\r\nContent-Type: application/json\r\n\r\n${bodyJson}\r\n` +
        `--${boundary}--`;
      await driveFetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
          body: multipart
        }
      );
    }
    const now = new Date().toISOString();
    await window.UangiiDB.setMeta('lastDriveSync', now);
    return { syncedAt: now, count: snapshot.transactions.length };
  }

  async function listVaultFiles() {
    const q = encodeURIComponent(`'appDataFolder' in parents and trashed=false`);
    const res = await driveFetch(
      `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&orderBy=modifiedTime desc&fields=files(id,name,modifiedTime,size)`
    );
    const data = await res.json();
    return data.files || [];
  }

  async function pullEncryptedSnapshot(passphrase, fileId = null) {
    let targetId = fileId;
    if (!targetId) {
      const existing = await findVaultFile();
      if (!existing) {
        throw new Error('Belum ada brankas cadangan Uangii di Google Drive akun ini.');
      }
      targetId = existing.id;
    }
    const res = await driveFetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(targetId)}?alt=media`
    );
    const envelope = await res.json();
    const snapshot = await window.UangiiCrypto.decryptVault(envelope, passphrase);
    await window.UangiiDB.importSnapshot(snapshot);
    const now = new Date().toISOString();
    await window.UangiiDB.setMeta('lastDriveSync', now);
    await window.UangiiDB.setMeta('onboarded', true);
    return { syncedAt: now, count: snapshot.transactions.length, wallets: snapshot.wallets.length };
  }

  window.UangiiDriveSync = {
    getClientId,
    isConnected,
    connect,
    disconnect,
    listVaultFiles,
    pushEncryptedSnapshot,
    pullEncryptedSnapshot
  };
})();
