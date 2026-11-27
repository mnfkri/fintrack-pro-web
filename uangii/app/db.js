// Offline-first IndexedDB storage for Uangii Web (Stage 1)
(() => {
  'use strict';

  const DB_NAME = 'uangii_web_v1';
  const DB_VERSION = 1;
  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('wallets')) {
          db.createObjectStore('wallets', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('transactions')) {
          const store = db.createObjectStore('transactions', { keyPath: 'id' });
          store.createIndex('date', 'date', { unique: false });
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function txStore(storeName, mode, fn) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const result = fn(store);
      tx.oncomplete = () => resolve(result?._val !== undefined ? result._val : result?.result);
      tx.onerror = () => reject(tx.error);
    });
  }

  async function getAll(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function getMeta(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('meta', 'readonly');
      const req = tx.objectStore('meta').get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => reject(req.error);
    });
  }

  async function setMeta(key, value) {
    await txStore('meta', 'readwrite', (s) => s.put({ key, value }));
  }

  async function seedIfEmpty() {
    const initialized = await getMeta('initialized');
    if (initialized) return;
    const wallets = await getAll('wallets');
    if (!wallets.length) {
      const db = await openDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction('wallets', 'readwrite');
        const store = tx.objectStore('wallets');
        (window.UANGII_WEB_CONFIG.defaultWallets || []).forEach((w) => store.put(w));
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    }
    await setMeta('initialized', true);
  }

  async function putWallet(wallet) {
    await txStore('wallets', 'readwrite', (s) => s.put(wallet));
    await setMeta('lastModified', new Date().toISOString());
  }

  async function deleteWallet(id) {
    await txStore('wallets', 'readwrite', (s) => s.delete(id));
    await setMeta('lastModified', new Date().toISOString());
  }

  async function putTransaction(item) {
    await txStore('transactions', 'readwrite', (s) => s.put(item));
    await setMeta('lastModified', new Date().toISOString());
  }

  async function deleteTransaction(id) {
    await txStore('transactions', 'readwrite', (s) => s.delete(id));
    await setMeta('lastModified', new Date().toISOString());
  }

  async function exportSnapshot() {
    const [wallets, transactions, lastModified] = await Promise.all([
      getAll('wallets'),
      getAll('transactions'),
      getMeta('lastModified')
    ]);
    return {
      schemaVersion: window.UANGII_WEB_CONFIG.schemaVersion,
      exportedAt: new Date().toISOString(),
      lastModified: lastModified || new Date().toISOString(),
      wallets,
      transactions
    };
  }

  async function importSnapshot(snapshot) {
    if (!snapshot || !Array.isArray(snapshot.wallets) || !Array.isArray(snapshot.transactions)) {
      throw new Error('Isi snapshot tidak valid.');
    }
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(['wallets', 'transactions', 'meta'], 'readwrite');
      const wStore = tx.objectStore('wallets');
      const tStore = tx.objectStore('transactions');
      const mStore = tx.objectStore('meta');
      wStore.clear();
      tStore.clear();
      snapshot.wallets.forEach((w) => wStore.put(w));
      snapshot.transactions.forEach((t) => tStore.put(t));
      mStore.put({ key: 'initialized', value: true });
      mStore.put({ key: 'lastModified', value: snapshot.lastModified || new Date().toISOString() });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  function computeWalletBalances(wallets, transactions) {
    const map = new Map();
    wallets.forEach((w) => map.set(w.id, Number(w.initialBalance) || 0));
    transactions.forEach((t) => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') {
        map.set(t.walletId, (map.get(t.walletId) || 0) + amt);
      } else if (t.type === 'expense') {
        map.set(t.walletId, (map.get(t.walletId) || 0) - amt);
      } else if (t.type === 'transfer') {
        map.set(t.walletId, (map.get(t.walletId) || 0) - amt);
        if (t.toWalletId) {
          map.set(t.toWalletId, (map.get(t.toWalletId) || 0) + amt);
        }
      }
    });
    return map;
  }

  window.UangiiDB = {
    seedIfEmpty,
    getWallets: () => getAll('wallets'),
    getTransactions: () => getAll('transactions'),
    getMeta,
    setMeta,
    putWallet,
    deleteWallet,
    putTransaction,
    deleteTransaction,
    exportSnapshot,
    importSnapshot,
    computeWalletBalances
  };
})();
