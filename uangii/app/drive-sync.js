// Stage 1 Google Drive AppData Sync Adapter (GIS OAuth2 + Drive API v3)
// Designed with a clean adapter interface so Stage 2 Firebase Live Sync can plug in cleanly.
(() => {
  'use strict';

  const SCOPE = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file';
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
        reject(new Error('Google OAuth Client ID belum dikonfigurasi.'));
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
    const q = encodeURIComponent(`name='${name}' and trashed=false`);
    const res = await driveFetch(
      `https://www.googleapis.com/drive/v3/files?spaces=drive,appDataFolder&q=${q}&orderBy=modifiedTime desc&fields=files(id,name,modifiedTime,spaces)`
    );
    const data = await res.json();
    return (data.files && data.files[0]) || null;
  }

  async function pushEncryptedSnapshot(passphrase) {
    const snapshot = await window.UangiiDB.exportSnapshot();
    const encryptedPayload = await window.UangiiCrypto.encryptVault(snapshot, passphrase);
    const bodyText = typeof encryptedPayload === 'string' ? encryptedPayload : JSON.stringify(encryptedPayload);
    const existing = await findVaultFile();
    const name = window.UANGII_WEB_CONFIG.driveFileName;

    if (existing) {
      await driveFetch(
        `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(existing.id)}?uploadType=media`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: bodyText
        }
      );
    } else {
      const boundary = 'uangii_boundary_' + Date.now();
      const metadata = JSON.stringify({ name, mimeType: 'application/json', parents: ['appDataFolder'] });
      const multipart =
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
        `--${boundary}\r\nContent-Type: application/json\r\n\r\n${bodyText}\r\n` +
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
    const q = encodeURIComponent(`trashed=false and (name='fintrack_backup.json' or name contains 'uangii' or name contains 'fintrack')`);
    const res = await driveFetch(
      `https://www.googleapis.com/drive/v3/files?spaces=drive,appDataFolder&q=${q}&orderBy=modifiedTime desc&fields=files(id,name,modifiedTime,size,spaces)`
    );
    const data = await res.json();
    let files = data.files || [];
    if (!files.length) {
      // Fallback: list all files inside appDataFolder regardless of name
      const fallbackRes = await driveFetch(
        `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${encodeURIComponent('trashed=false')}&orderBy=modifiedTime desc&fields=files(id,name,modifiedTime,size,spaces)`
      );
      const fallbackData = await fallbackRes.json();
      files = fallbackData.files || [];
    }
    return files;
  }

  async function pullEncryptedSnapshot(passphrase, fileId = null) {
    let targetId = fileId;
    if (!targetId) {
      const existing = await findVaultFile();
      if (!existing) {
        throw new Error('Belum ada file fintrack_backup.json di Google Drive akun ini.');
      }
      targetId = existing.id;
    }
    const res = await driveFetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(targetId)}?alt=media`
    );
    const rawText = await res.text();
    const snapshot = await window.UangiiCrypto.decryptVault(rawText, passphrase);
    const imported = await window.UangiiDB.importSnapshot(snapshot);
    const now = new Date().toISOString();
    await window.UangiiDB.setMeta('lastDriveSync', now);
    await window.UangiiDB.setMeta('onboarded', true);
    return {
      syncedAt: now,
      count: imported.transactionsCount,
      wallets: imported.walletsCount
    };
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
