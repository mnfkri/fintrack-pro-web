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

  function normalizeDate(val) {
    if (!val) return new Date().toISOString().slice(0, 10);
    if (typeof val === 'number') {
      const ms = val < 1e12 ? val * 1000 : val;
      return new Date(ms).toISOString().slice(0, 10);
    }
    const s = String(val);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
  }

  function normalizeType(val) {
    const u = String(val || 'expense').toLowerCase();
    if (u.includes('in') || u === 'pemasukan') return 'income';
    if (u.includes('trans')) return 'transfer';
    return 'expense';
  }

  function normalizeSnapshot(raw) {
    if (!raw || typeof raw !== 'object') throw new Error('Isi cadangan tidak valid.');
    const rawWallets = Array.isArray(raw.wallets) ? raw.wallets : Array.isArray(raw.accounts) ? raw.accounts : [];
    const rawTxs = Array.isArray(raw.transactions) ? raw.transactions : [];
    const catMap = new Map();
    if (Array.isArray(raw.categories)) {
      raw.categories.forEach((c) => {
        if (c && c.id !== undefined) catMap.set(String(c.id), c.name || c.title || 'Lainnya');
      });
    }

    const wallets = rawWallets.map((w, idx) => ({
      id: String(w.id ?? ('w-' + idx)),
      name: String(w.name || w.title || `Dompet ${idx + 1}`),
      type: String(w.type || w.walletType || 'cash').toLowerCase(),
      initialBalance: Number(w.initialBalance ?? w.openingBalance ?? w.balance ?? 0) || 0,
      currency: String(w.currency || 'IDR'),
      color: typeof w.color === 'string' && w.color.startsWith('#') ? w.color : '#30D158'
    }));

    const fallbackWalletId = wallets[0]?.id || 'w-cash';
    const transactions = rawTxs.map((t, idx) => {
      const catId = t.categoryId !== undefined ? String(t.categoryId) : null;
      const category = t.category || t.categoryName || (catId && catMap.get(catId)) || 'Lainnya';
      return {
        id: String(t.id ?? ('tx-' + idx)),
        type: normalizeType(t.type || t.transactionType),
        amount: Math.abs(Number(t.amount ?? t.nominal ?? 0)) || 0,
        category: String(category),
        description: String(t.description || t.note || t.title || t.merchant || category),
        walletId: String(t.walletId ?? t.accountId ?? fallbackWalletId),
        toWalletId: t.toWalletId != null ? String(t.toWalletId) : (t.destinationWalletId != null ? String(t.destinationWalletId) : null),
        date: normalizeDate(t.date ?? t.timestamp ?? t.createdAt),
        createdAt: typeof t.createdAt === 'string' ? t.createdAt : new Date(Number(t.createdAt || t.timestamp || Date.now())).toISOString()
      };
    });

    return {
      wallets: wallets.length ? wallets : (window.UANGII_WEB_CONFIG.defaultWallets || []),
      transactions,
      lastModified: raw.lastModified || raw.exportedAt || new Date().toISOString()
    };
  }

  async function importSnapshot(rawSnapshot) {
    const snapshot = normalizeSnapshot(rawSnapshot);
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
      mStore.put({ key: 'lastModified', value: snapshot.lastModified });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    return { walletsCount: snapshot.wallets.length, transactionsCount: snapshot.transactions.length };
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

  async function wipeAllData() {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(['wallets', 'transactions', 'meta'], 'readwrite');
      tx.objectStore('wallets').clear();
      tx.objectStore('transactions').clear();
      tx.objectStore('meta').clear();
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
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
    wipeAllData,
    computeWalletBalances
  };
})();
