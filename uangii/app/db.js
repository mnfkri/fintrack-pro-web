// Offline-first IndexedDB storage for Uangii Web
// 100% lossless round-trip compatible with Android Uangii backup JSON (version 4 / mergeProtocol 1)
(() => {
  'use strict';

  const DB_NAME = 'uangii_web_v1';
  const DB_VERSION = 1;
  let dbPromise = null;

  const DEFAULT_ANDROID_CATEGORIES = [
    { id: 1, remoteId: 'cat_food', name: 'Makan & Minum', type: 'EXPENSE', colorHex: '#F97316', iconName: 'restaurant', isDefault: true },
    { id: 2, remoteId: 'cat_transport', name: 'Transportasi', type: 'EXPENSE', colorHex: '#3B82F6', iconName: 'directions_car', isDefault: true },
    { id: 3, remoteId: 'cat_bills', name: 'Tagihan & Utilitas', type: 'EXPENSE', colorHex: '#EAB308', iconName: 'receipt_long', isDefault: true },
    { id: 4, remoteId: 'cat_shopping', name: 'Belanja Bulanan', type: 'EXPENSE', colorHex: '#EC4899', iconName: 'shopping_bag', isDefault: true },
    { id: 5, remoteId: 'cat_lifestyle', name: 'Hiburan & Gaya Hidup', type: 'EXPENSE', colorHex: '#8B5CF6', iconName: 'movie', isDefault: true },
    { id: 6, remoteId: 'cat_health', name: 'Kesehatan', type: 'EXPENSE', colorHex: '#EF4444', iconName: 'medical_services', isDefault: true },
    { id: 7, remoteId: 'cat_salary', name: 'Gaji', type: 'INCOME', colorHex: '#10B981', iconName: 'payments', isDefault: true },
    { id: 8, remoteId: 'cat_bonus', name: 'Bonus & Freelance', type: 'INCOME', colorHex: '#06B6D4', iconName: 'work', isDefault: true },
    { id: 9, remoteId: 'cat_invest', name: 'Investasi & Dividen', type: 'INCOME', colorHex: '#84CC16', iconName: 'trending_up', isDefault: true }
  ];

  const EXTRA_TABLES = [
    'tombstones',
    'categories',
    'subcategories',
    'familyArchives',
    'budgets',
    'recurringPayments',
    'debts',
    'debtPayments',
    'savingsGoals',
    'savingsDeposits',
    'investmentPortfolios',
    'investmentTransactions',
    'fioLearnedAssociations'
  ];

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

  function dateToEpochMs(dateStr, fallbackMs) {
    if (fallbackMs && normalizeDate(fallbackMs) === dateStr) return fallbackMs;
    const d = new Date(dateStr + 'T12:00:00');
    return Number.isNaN(d.getTime()) ? Date.now() : d.getTime();
  }

  function normalizeType(val) {
    const u = String(val || 'expense').toLowerCase();
    if (u.includes('in') || u === 'pemasukan') return 'income';
    if (u.includes('trans')) return 'transfer';
    return 'expense';
  }

  function toAndroidWalletType(type) {
    const t = String(type || 'cash').toLowerCase();
    if (t === 'bank') return 'BANK';
    if (t === 'ewallet' || t === 'e_wallet') return 'E_WALLET';
    if (t === 'rdn' || t === 'investment') return 'RDN';
    return 'CASH';
  }

  function toWebWalletType(type) {
    const t = String(type || 'CASH').toUpperCase();
    if (t === 'BANK') return 'bank';
    if (t === 'E_WALLET' || t === 'EWALLET') return 'ewallet';
    if (t === 'RDN' || t === 'INVESTMENT') return 'rdn';
    return 'cash';
  }

  function normalizeSnapshot(raw) {
    if (!raw || typeof raw !== 'object') throw new Error('Isi cadangan tidak valid.');
    const rawWallets = Array.isArray(raw.wallets) ? raw.wallets : Array.isArray(raw.accounts) ? raw.accounts : [];
    const rawTxs = Array.isArray(raw.transactions) ? raw.transactions : [];
    const rawCats = Array.isArray(raw.categories) && raw.categories.length ? raw.categories : DEFAULT_ANDROID_CATEGORIES;
    const catMap = new Map();
    rawCats.forEach((c) => {
      if (c && c.id !== undefined) catMap.set(String(c.id), c.name || c.title || 'Lainnya');
    });

    const wallets = rawWallets.map((w, idx) => ({
      id: String(w.id ?? ('w-' + idx)),
      name: String(w.name || w.title || `Dompet ${idx + 1}`),
      type: toWebWalletType(w.type || w.walletType),
      initialBalance: Number(w.initialBalance ?? w.openingBalance ?? w.balance ?? 0) || 0,
      currency: String(w.currency || 'IDR'),
      color: typeof (w.colorHex || w.color) === 'string' && String(w.colorHex || w.color).startsWith('#')
        ? String(w.colorHex || w.color)
        : '#30D158',
      _raw: w
    }));

    const fallbackWalletId = wallets[0]?.id || 'w-cash';
    const transactions = rawTxs.map((t, idx) => {
      const catId = t.categoryId !== undefined ? String(t.categoryId) : null;
      const category = t.categoryName || t.category || (catId && catMap.get(catId)) || 'Lainnya';
      const ts = Number(t.date ?? t.timestamp ?? t.updatedAt ?? Date.now());
      return {
        id: String(t.id ?? ('tx-' + idx)),
        type: normalizeType(t.type || t.transactionType),
        amount: Math.abs(Number(t.amount ?? t.nominal ?? 0)) || 0,
        category: String(category),
        description: String(t.title || t.description || t.notes || t.note || category),
        notes: String(t.notes || t.note || ''),
        walletId: String(t.walletId ?? t.accountId ?? fallbackWalletId),
        toWalletId: t.toWalletId != null ? String(t.toWalletId) : (t.destinationWalletId != null ? String(t.destinationWalletId) : null),
        date: normalizeDate(t.date ?? t.timestamp ?? t.createdAt),
        createdAt: typeof t.createdAt === 'string' ? t.createdAt : new Date(Number.isFinite(ts) ? ts : Date.now()).toISOString(),
        _raw: t
      };
    });

    // Preserve all other Android tables untouched for lossless round-trip
    const androidBase = {
      app: raw.app || 'Finance Tracker',
      version: Number(raw.version) || 4,
      mergeProtocol: Number(raw.mergeProtocol) || 1
    };
    EXTRA_TABLES.forEach((key) => {
      if (Array.isArray(raw[key])) androidBase[key] = raw[key];
      else if (key === 'categories') androidBase[key] = rawCats;
      else androidBase[key] = [];
    });

    return {
      wallets: wallets.length ? wallets : (window.UANGII_WEB_CONFIG.defaultWallets || []),
      transactions,
      androidBase,
      lastModified: raw.lastModified || (raw.exportDate ? new Date(Number(raw.exportDate)).toISOString() : new Date().toISOString())
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
      mStore.put({ key: 'androidBase', value: snapshot.androidBase });
      mStore.put({ key: 'lastModified', value: snapshot.lastModified });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    return { walletsCount: snapshot.wallets.length, transactionsCount: snapshot.transactions.length };
  }

  // Exports in exact Android Uangii version 4 JSON format while preserving all extra Android tables
  async function exportSnapshot() {
    const [wallets, transactions, androidBase] = await Promise.all([
      getAll('wallets'),
      getAll('transactions'),
      getMeta('androidBase')
    ]);
    const nowMs = Date.now();
    const base = androidBase || {};
    const categories = Array.isArray(base.categories) && base.categories.length
      ? base.categories
      : DEFAULT_ANDROID_CATEGORIES.map((c) => Object.assign({ updatedAt: nowMs }, c));

    // Build deterministic numeric IDs for wallets (preserving existing Android numeric IDs)
    const walletIdMap = new Map();
    let maxWalletId = 0;
    wallets.forEach((w) => {
      const rawId = Number(w._raw?.id ?? w.id);
      if (Number.isInteger(rawId) && rawId > 0) {
        walletIdMap.set(String(w.id), rawId);
        if (rawId > maxWalletId) maxWalletId = rawId;
      }
    });
    wallets.forEach((w) => {
      if (!walletIdMap.has(String(w.id))) {
        maxWalletId += 1;
        walletIdMap.set(String(w.id), maxWalletId);
      }
    });

    const outWallets = wallets.map((w, idx) => {
      const numId = walletIdMap.get(String(w.id));
      const raw = w._raw || {};
      return Object.assign({
        id: numId,
        type: toAndroidWalletType(w.type),
        remoteId: raw.remoteId || ('web_w_' + numId),
        colorHex: w.color || raw.colorHex || '#30D158',
        dueDateDay: raw.dueDateDay ?? null,
        accountNumber: raw.accountNumber ?? '',
        isInvestment: raw.isInvestment ?? (w.type === 'rdn'),
        isOwnerConsented: raw.isOwnerConsented ?? false,
        walletScope: raw.walletScope || 'PERSONAL',
        updatedAt: nowMs,
        currency: w.currency || 'IDR',
        iconName: raw.iconName || (w.type === 'bank' ? 'account_balance' : w.type === 'ewallet' ? 'account_balance_wallet' : 'payments'),
        isDefault: raw.isDefault ?? (idx === 0),
        name: w.name,
        ownerUid: raw.ownerUid ?? '',
        creditLimit: raw.creditLimit ?? null,
        initialBalance: Number(w.initialBalance) || 0,
        billingCycleDay: raw.billingCycleDay ?? null,
        sharingLevel: raw.sharingLevel || 'PRIVATE'
      }, raw, {
        id: numId,
        name: w.name,
        type: toAndroidWalletType(w.type),
        colorHex: w.color || raw.colorHex || '#30D158',
        initialBalance: Number(w.initialBalance) || 0,
        currency: w.currency || 'IDR',
        updatedAt: nowMs
      });
    });

    // Map category names to category IDs
    const catByName = new Map();
    categories.forEach((c) => {
      if (c && c.name) catByName.set(String(c.name).toLowerCase(), Number(c.id) || 0);
    });

    let maxTxId = 0;
    transactions.forEach((t) => {
      const rawId = Number(t._raw?.id ?? t.id);
      if (Number.isInteger(rawId) && rawId > maxTxId) maxTxId = rawId;
    });

    const outTransactions = transactions.map((t) => {
      const raw = t._raw || {};
      let numId = Number(raw.id ?? t.id);
      if (!Number.isInteger(numId) || numId <= 0) {
        maxTxId += 1;
        numId = maxTxId;
      }
      const upperType = t.type === 'income' ? 'INCOME' : t.type === 'transfer' ? 'TRANSFER' : 'EXPENSE';
      const catId = upperType === 'TRANSFER'
        ? 0
        : (catByName.get(String(t.category || '').toLowerCase()) ?? Number(raw.categoryId) ?? 1);
      const dateMs = dateToEpochMs(t.date, Number(raw.date));
      const walletNumId = walletIdMap.get(String(t.walletId)) || outWallets[0]?.id || 1;
      const toWalletNumId = upperType === 'TRANSFER' && t.toWalletId
        ? (walletIdMap.get(String(t.toWalletId)) || null)
        : null;

      const obj = Object.assign({
        id: numId,
        remoteId: raw.remoteId || ('web_tx_' + numId + '_' + dateMs),
        updatedAt: nowMs,
        title: t.description || t.category || 'Transaksi',
        amount: Number(t.amount) || 0,
        type: upperType,
        categoryId: catId,
        categoryName: upperType === 'TRANSFER' ? 'Transfer' : (t.category || 'Lainnya'),
        date: dateMs,
        notes: t.notes || raw.notes || '',
        walletId: walletNumId,
        currency: raw.currency || 'IDR',
        exchangeRate: raw.exchangeRate ?? 1,
        toWalletExchangeRate: raw.toWalletExchangeRate ?? 1,
        walletExchangeRate: raw.walletExchangeRate ?? 1,
        financialTag: raw.financialTag || 'NEEDS',
        scope: raw.scope || 'PERSONAL',
        authorUid: raw.authorUid ?? '',
        authorName: raw.authorName ?? '',
        sharingLevel: raw.sharingLevel || 'PRIVATE',
        syncStatus: raw.syncStatus || 'SYNCED',
        version: Number(raw.version) || 1,
        lastModifiedByUid: raw.lastModifiedByUid ?? '',
        lastModifiedAt: nowMs,
        eventId: raw.eventId ?? null
      }, raw, {
        id: numId,
        title: t.description || t.category || 'Transaksi',
        amount: Number(t.amount) || 0,
        type: upperType,
        categoryId: catId,
        categoryName: upperType === 'TRANSFER' ? 'Transfer' : (t.category || 'Lainnya'),
        date: dateMs,
        walletId: walletNumId,
        updatedAt: nowMs,
        lastModifiedAt: nowMs
      });
      if (toWalletNumId !== null) obj.toWalletId = toWalletNumId;
      else delete obj.toWalletId;
      return obj;
    });

    const payload = {
      app: base.app || 'Finance Tracker',
      version: Number(base.version) || 4,
      exportDate: nowMs,
      mergeProtocol: Number(base.mergeProtocol) || 1,
      tombstones: Array.isArray(base.tombstones) ? base.tombstones : [],
      wallets: outWallets,
      categories,
      subcategories: Array.isArray(base.subcategories) ? base.subcategories : [],
      familyArchives: Array.isArray(base.familyArchives) ? base.familyArchives : [],
      transactions: outTransactions,
      budgets: Array.isArray(base.budgets) ? base.budgets : [],
      recurringPayments: Array.isArray(base.recurringPayments) ? base.recurringPayments : [],
      debts: Array.isArray(base.debts) ? base.debts : [],
      debtPayments: Array.isArray(base.debtPayments) ? base.debtPayments : [],
      savingsGoals: Array.isArray(base.savingsGoals) ? base.savingsGoals : [],
      savingsDeposits: Array.isArray(base.savingsDeposits) ? base.savingsDeposits : [],
      investmentPortfolios: Array.isArray(base.investmentPortfolios) ? base.investmentPortfolios : [],
      investmentTransactions: Array.isArray(base.investmentTransactions) ? base.investmentTransactions : [],
      fioLearnedAssociations: Array.isArray(base.fioLearnedAssociations) ? base.fioLearnedAssociations : []
    };
    return payload;
  }

  async function getAndroidCategories() {
    const base = await getMeta('androidBase');
    return (base && Array.isArray(base.categories) && base.categories.length)
      ? base.categories
      : DEFAULT_ANDROID_CATEGORIES;
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

  async function getAndroidTable(tableName) {
    const base = (await getMeta('androidBase')) || {};
    return Array.isArray(base[tableName]) ? base[tableName] : [];
  }

  async function saveAndroidTable(tableName, rows) {
    const base = (await getMeta('androidBase')) || {
      app: 'Finance Tracker',
      version: 4,
      mergeProtocol: 1,
      categories: DEFAULT_ANDROID_CATEGORIES.map((c) => Object.assign({ updatedAt: Date.now() }, c))
    };
    base[tableName] = Array.isArray(rows) ? rows : [];
    await setMeta('androidBase', base);
    await setMeta('lastModified', new Date().toISOString());
  }

  window.UangiiDB = {
    seedIfEmpty,
    getWallets: () => getAll('wallets'),
    getTransactions: () => getAll('transactions'),
    getAndroidCategories,
    getAndroidTable,
    saveAndroidTable,
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
