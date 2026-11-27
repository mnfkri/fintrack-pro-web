// Uangii Web Main Controller (Stage 1: IndexedDB + Google Drive AppData Sync)
(() => {
  'use strict';

  const state = {
    wallets: [],
    transactions: [],
    view: 'dashboard',
    modalType: 'expense'
  };

  const $ = (id) => document.getElementById(id);

  function fmtRp(num) {
    const n = Number(num) || 0;
    return (n < 0 ? '-Rp ' : 'Rp ') + Math.abs(Math.round(n)).toLocaleString('id-ID');
  }

  function todayISO() {
    const d = new Date();
    const pad = (x) => String(x).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function toast(msg) {
    const el = $('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), 2800);
  }

  function inferCategoryAndWallet(text, type) {
    const lower = text.toLowerCase();
    let category = type === 'income' ? 'Lainnya' : type === 'transfer' ? 'Transfer Antardompet' : 'Belanja & Kebutuhan';
    if (type === 'expense') {
      if (/kopi|makan|nasi|resto|boba|cafe|warteg|bakso|ayam/.test(lower)) category = 'Makanan & Minuman';
      else if (/bensin|pertamax|pertalite|gojek|grab|parkir|tol|ojol/.test(lower)) category = 'Transportasi & Bensin';
      else if (/wifi|indihome|listrik|pln|air|pulsa|kuota|bpjs/.test(lower)) category = 'Tagihan & Utilitas';
      else if (/obat|dokter|apotek|klinik/.test(lower)) category = 'Kesehatan';
      else if (/nonton|bioskop|netflix|spotify|game/.test(lower)) category = 'Hiburan';
    } else if (type === 'income') {
      if (/gaji/.test(lower)) category = 'Gaji & Karir';
      else if (/bonus|freelance|proyek/.test(lower)) category = 'Bonus & Freelance';
      else if (/dividen|saham|bunga/.test(lower)) category = 'Dividen & Investasi';
      else if (/cashback|hadiah/.test(lower)) category = 'Cashback & Hadiah';
    }

    let wallet = state.wallets[0];
    for (const w of state.wallets) {
      if (lower.includes(w.name.toLowerCase())) { wallet = w; break; }
    }
    if (!wallet || wallet === state.wallets[0]) {
      if (/bca|mandiri|bri|bni|jago|qris/.test(lower)) {
        wallet = state.wallets.find((w) => w.type === 'bank') || wallet;
      } else if (/gopay|ovo|dana|shopeepay|ewallet/.test(lower)) {
        wallet = state.wallets.find((w) => w.type === 'ewallet') || wallet;
      } else if (/rdn|saham/.test(lower)) {
        wallet = state.wallets.find((w) => w.type === 'rdn') || wallet;
      } else if (/tunai|cash/.test(lower)) {
        wallet = state.wallets.find((w) => w.type === 'cash') || wallet;
      }
    }
    return { category, walletId: wallet ? wallet.id : 'w-cash' };
  }

  async function refreshState() {
    await window.UangiiDB.seedIfEmpty();
    const [wallets, transactions, lastSync] = await Promise.all([
      window.UangiiDB.getWallets(),
      window.UangiiDB.getTransactions(),
      window.UangiiDB.getMeta('lastDriveSync')
    ]);
    state.wallets = wallets;
    state.transactions = transactions.sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
    renderAll(lastSync);
  }

  function renderAll(lastSync) {
    const balances = window.UangiiDB.computeWalletBalances(state.wallets, state.transactions);
    renderDashboard(balances);
    renderTransactions();
    renderWallets(balances);
    renderSyncStatus(lastSync);
    populateWalletSelects();
  }

  function renderDashboard(balances) {
    let totalBalance = 0;
    balances.forEach((v) => { totalBalance += v; });

    const nowMonth = todayISO().slice(0, 7);
    let monthIncome = 0;
    let monthExpense = 0;
    const catTotals = new Map();

    state.transactions.forEach((t) => {
      if (!t.date || !t.date.startsWith(nowMonth)) return;
      if (t.type === 'income') monthIncome += Number(t.amount) || 0;
      else if (t.type === 'expense') {
        const amt = Number(t.amount) || 0;
        monthExpense += amt;
        catTotals.set(t.category || 'Lainnya', (catTotals.get(t.category || 'Lainnya') || 0) + amt);
      }
    });

    $('statTotalBalance').textContent = fmtRp(totalBalance);
    $('statWalletCount').textContent = `${state.wallets.length} dompet aktif`;
    $('statMonthIncome').textContent = '+' + fmtRp(monthIncome);
    $('statMonthExpense').textContent = '-' + fmtRp(monthExpense);
    const net = monthIncome - monthExpense;
    $('statNetCashflow').textContent = `Selisih bulan ini: ${net >= 0 ? '+' : ''}${fmtRp(net)}`;

    // Recent 5 transactions
    const recentEl = $('recentTxList');
    const recent = state.transactions.slice(0, 5);
    if (!recent.length) {
      recentEl.innerHTML = '<div class="empty-state">Belum ada transaksi. Coba ketik di kolom Input Cepat di atas, misalnya: <strong>Beli kopi 28rb BCA</strong></div>';
    } else {
      recentEl.innerHTML = recent.map(renderTxRowHtml).join('');
    }

    // Category breakdown
    const catEl = $('categoryBreakdown');
    const entries = [...catTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (!entries.length) {
      catEl.innerHTML = '<div class="empty-state">Belum ada pengeluaran bulan ini.</div>';
    } else {
      catEl.innerHTML = entries.map(([cat, amt]) => {
        const pct = monthExpense > 0 ? Math.round((amt / monthExpense) * 100) : 0;
        return `<div class="cat-row">
          <div class="cat-top"><span>${escapeHtml(cat)}</span><strong>${fmtRp(amt)} (${pct}%)</strong></div>
          <div class="cat-track"><div class="cat-fill" style="width:${pct}%"></div></div>
        </div>`;
      }).join('');
    }
  }

  function getWalletName(id) {
    const w = state.wallets.find((x) => x.id === id);
    return w ? w.name : 'Dompet';
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function renderTxRowHtml(t) {
    const cls = t.type === 'income' ? 'text-pos' : t.type === 'transfer' ? 'text-info' : 'text-neg';
    const sign = t.type === 'income' ? '+' : t.type === 'transfer' ? '' : '-';
    const walletLabel = t.type === 'transfer'
      ? `${getWalletName(t.walletId)} → ${getWalletName(t.toWalletId)}`
      : getWalletName(t.walletId);
    return `<div class="tx-row">
      <div class="tx-main">
        <div class="tx-title">${escapeHtml(t.description || t.category)}</div>
        <div class="tx-meta">${escapeHtml(t.date)} · ${escapeHtml(t.category)} · ${escapeHtml(walletLabel)}</div>
      </div>
      <div class="tx-right">
        <span class="tx-amount ${cls}">${sign}${fmtRp(t.amount)}</span>
        <button type="button" class="icon-btn" title="Hapus transaksi" aria-label="Hapus transaksi" data-del-tx="${escapeHtml(t.id)}">✕</button>
      </div>
    </div>`;
  }

  function renderTransactions() {
    const q = ($('filterSearch')?.value || '').trim().toLowerCase();
    const type = $('filterType')?.value || 'all';
    const walletId = $('filterWallet')?.value || 'all';

    const filtered = state.transactions.filter((t) => {
      if (type !== 'all' && t.type !== type) return false;
      if (walletId !== 'all' && t.walletId !== walletId && t.toWalletId !== walletId) return false;
      if (q && !(t.description + ' ' + t.category).toLowerCase().includes(q)) return false;
      return true;
    });

    const el = $('allTxList');
    if (!filtered.length) {
      el.innerHTML = '<div class="empty-state">Tidak ada transaksi yang cocok dengan filter.</div>';
    } else {
      el.innerHTML = filtered.map(renderTxRowHtml).join('');
    }
  }

  function renderWallets(balances) {
    const el = $('walletGrid');
    el.innerHTML = state.wallets.map((w) => {
      const bal = balances.get(w.id) || 0;
      return `<article class="wallet-card">
        <div class="wallet-top">
          <div><span class="wallet-dot" style="background:${escapeHtml(w.color || '#30D158')}"></span><strong>${escapeHtml(w.name)}</strong></div>
          <span class="wallet-type">${escapeHtml(w.type)}</span>
        </div>
        <div class="wallet-bal">${fmtRp(bal)}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
          <small style="color:var(--muted);">Saldo awal: ${fmtRp(w.initialBalance)}</small>
          ${state.wallets.length > 1 ? `<button type="button" class="icon-btn" title="Hapus dompet" data-del-wallet="${escapeHtml(w.id)}">✕</button>` : ''}
        </div>
      </article>`;
    }).join('');
  }

  function populateWalletSelects() {
    const opts = state.wallets.map((w) => `<option value="${escapeHtml(w.id)}">${escapeHtml(w.name)}</option>`).join('');
    if ($('txWallet')) $('txWallet').innerHTML = opts;
    if ($('txToWallet')) $('txToWallet').innerHTML = opts;
    if ($('filterWallet')) {
      const cur = $('filterWallet').value || 'all';
      $('filterWallet').innerHTML = '<option value="all">Semua Dompet</option>' + opts;
      $('filterWallet').value = cur;
    }
  }

  function populateCategories(type) {
    const list = (window.UANGII_WEB_CONFIG.categories && window.UANGII_WEB_CONFIG.categories[type]) || ['Lainnya'];
    $('txCategory').innerHTML = list.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  }

  function renderSyncStatus(lastSync) {
    const connected = window.UangiiDriveSync.isConnected();
    $('sidebarSyncDot').classList.toggle('online', connected);
    $('sidebarSyncText').textContent = connected ? 'Google Drive terhubung' : 'Lokal (IndexedDB)';
    $('driveStatusText').textContent = connected
      ? 'Terhubung ke Google Drive (appDataFolder)'
      : 'Belum terhubung · Data tersimpan aman di browser ini';
    $('driveLastSync').textContent = lastSync
      ? 'Sinkronisasi terakhir: ' + new Date(lastSync).toLocaleString('id-ID')
      : 'Belum pernah sinkronisasi ke Google Drive';
    $('driveClientIdInput').value = window.UangiiDriveSync.getClientId();
  }

  function switchView(name) {
    state.view = name;
    document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + name));
    document.querySelectorAll('[data-nav]').forEach((b) => b.classList.toggle('active', b.dataset.nav === name));
    const titles = {
      dashboard: ['Beranda', 'Ringkasan saldo, arus kas bulan ini, dan input cepat.'],
      transactions: ['Riwayat Transaksi', 'Cari, saring, dan kelola seluruh catatan keuanganmu.'],
      wallets: ['Dompet & RDN', 'Kelola saldo tunai, rekening bank, e-wallet, dan kas investasi.'],
      sync: ['Sync & Cadangan', 'Tahap 1: Enkripsi lokal & Google Drive AppData · Tahap 2: Firebase Live Sync.']
    };
    const [t, s] = titles[name] || titles.dashboard;
    $('pageTitle').textContent = t;
    $('pageSub').textContent = s;
  }

  function openTxModal(type = 'expense') {
    state.modalType = type;
    document.querySelectorAll('.seg-btn').forEach((b) => b.classList.toggle('active', b.dataset.txType === type));
    $('txToWalletWrap').style.display = type === 'transfer' ? 'flex' : 'none';
    populateCategories(type);
    $('txDate').value = todayISO();
    $('txAmount').value = '';
    $('txDesc').value = '';
    $('txModal').showModal();
    setTimeout(() => $('txAmount').focus(), 60);
  }

  async function saveQuickInput(e) {
    e.preventDefault();
    const input = $('quickInput');
    const text = (input.value || '').trim();
    if (!text) return;
    if (typeof window.parseStudioTransaction !== 'function') {
      toast('Parser belum siap.');
      return;
    }
    const parsed = window.parseStudioTransaction(text);
    if (parsed.error) {
      $('quickHint').textContent = parsed.error;
      return;
    }
    const { category, walletId } = inferCategoryAndWallet(text, parsed.type);
    const toWallet = state.wallets.find((w) => w.id !== walletId) || state.wallets[0];
    const tx = {
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      type: parsed.type,
      amount: parsed.amount,
      category,
      description: parsed.description || category,
      walletId,
      toWalletId: parsed.type === 'transfer' ? toWallet.id : null,
      date: todayISO(),
      createdAt: new Date().toISOString()
    };
    await window.UangiiDB.putTransaction(tx);
    input.value = '';
    $('quickHint').textContent = '';
    await refreshState();
    toast(`Tersimpan: ${tx.description} (${fmtRp(tx.amount)})`);
  }

  function handleQuickPreview() {
    const text = ($('quickInput').value || '').trim();
    const hint = $('quickHint');
    if (!text) { hint.textContent = ''; return; }
    if (typeof window.parseStudioTransaction !== 'function') return;
    const parsed = window.parseStudioTransaction(text);
    if (parsed.error) {
      hint.textContent = parsed.error;
      hint.style.color = 'var(--warn)';
    } else {
      const { category, walletId } = inferCategoryAndWallet(text, parsed.type);
      const label = parsed.type === 'income' ? 'Pemasukan' : parsed.type === 'transfer' ? 'Transfer' : 'Pengeluaran';
      hint.textContent = `Pratinjau: ${label} ${fmtRp(parsed.amount)} · ${category} · ${getWalletName(walletId)}`;
      hint.style.color = 'var(--accent)';
    }
  }

  function exportCSV() {
    const rows = [['Tanggal', 'Tipe', 'Kategori', 'Deskripsi', 'Dompet', 'Nominal']];
    state.transactions.forEach((t) => {
      rows.push([
        t.date,
        t.type,
        t.category,
        (t.description || '').replace(/"/g, '""'),
        getWalletName(t.walletId),
        t.amount
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `uangii-transaksi-${todayISO()}.csv`);
    toast('File CSV berhasil diunduh.');
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function bindEvents() {
    document.querySelectorAll('[data-nav]').forEach((btn) => {
      btn.addEventListener('click', () => switchView(btn.dataset.nav));
    });
    $('btnOpenAdd').addEventListener('click', () => openTxModal('expense'));
    $('mobileFab').addEventListener('click', () => openTxModal('expense'));
    $('btnCloseTxModal').addEventListener('click', () => $('txModal').close());

    document.querySelectorAll('.seg-btn').forEach((b) => {
      b.addEventListener('click', () => {
        state.modalType = b.dataset.txType;
        document.querySelectorAll('.seg-btn').forEach((x) => x.classList.toggle('active', x === b));
        $('txToWalletWrap').style.display = state.modalType === 'transfer' ? 'flex' : 'none';
        populateCategories(state.modalType);
      });
    });

    $('txForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const amount = Number($('txAmount').value);
      if (!amount || amount <= 0) { toast('Nominal harus lebih dari 0.'); return; }
      const walletId = $('txWallet').value;
      const toWalletId = state.modalType === 'transfer' ? $('txToWallet').value : null;
      if (state.modalType === 'transfer' && walletId === toWalletId) {
        toast('Dompet asal dan tujuan harus berbeda.');
        return;
      }
      const tx = {
        id: 'tx-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        type: state.modalType,
        amount,
        category: $('txCategory').value,
        description: ($('txDesc').value || '').trim() || $('txCategory').value,
        walletId,
        toWalletId,
        date: $('txDate').value || todayISO(),
        createdAt: new Date().toISOString()
      };
      await window.UangiiDB.putTransaction(tx);
      $('txModal').close();
      await refreshState();
      toast('Transaksi berhasil dicatat.');
    });

    $('quickForm').addEventListener('submit', saveQuickInput);
    $('quickInput').addEventListener('input', handleQuickPreview);

    ['filterSearch', 'filterType', 'filterWallet'].forEach((id) => {
      $(id)?.addEventListener('input', renderTransactions);
      $(id)?.addEventListener('change', renderTransactions);
    });

    document.body.addEventListener('click', async (e) => {
      const delTx = e.target.closest('[data-del-tx]');
      if (delTx) {
        await window.UangiiDB.deleteTransaction(delTx.dataset.delTx);
        await refreshState();
        toast('Transaksi dihapus.');
        return;
      }
      const delW = e.target.closest('[data-del-wallet]');
      if (delW) {
        await window.UangiiDB.deleteWallet(delW.dataset.delWallet);
        await refreshState();
        toast('Dompet dihapus.');
      }
    });

    $('walletForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = ($('walletName').value || '').trim();
      if (!name) return;
      const w = {
        id: 'w-' + Date.now(),
        name,
        type: $('walletType').value,
        initialBalance: Number($('walletBalance').value) || 0,
        currency: 'IDR',
        color: $('walletColor').value || '#30D158'
      };
      await window.UangiiDB.putWallet(w);
      $('walletName').value = '';
      $('walletBalance').value = '';
      await refreshState();
      toast(`Dompet "${name}" ditambahkan.`);
    });

    // Sync & Backup handlers
    $('btnSaveClientId').addEventListener('click', () => {
      window.UangiiDriveSync.setClientId($('driveClientIdInput').value);
      toast('Google Client ID disimpan di browser ini.');
    });

    $('btnDriveConnect').addEventListener('click', async () => {
      try {
        window.UangiiDriveSync.setClientId($('driveClientIdInput').value);
        await window.UangiiDriveSync.connect();
        const lastSync = await window.UangiiDB.getMeta('lastDriveSync');
        renderSyncStatus(lastSync);
        toast('Berhasil terhubung ke Google Drive!');
      } catch (err) {
        toast(err.message);
      }
    });

    $('btnDrivePush').addEventListener('click', async () => {
      try {
        const pass = $('vaultPassphrase').value;
        const res = await window.UangiiDriveSync.pushEncryptedSnapshot(pass);
        renderSyncStatus(res.syncedAt);
        toast(`Upload terenkripsi berhasil (${res.count} transaksi).`);
      } catch (err) {
        toast(err.message);
      }
    });

    $('btnDrivePull').addEventListener('click', async () => {
      try {
        const pass = $('vaultPassphrase').value;
        const res = await window.UangiiDriveSync.pullEncryptedSnapshot(pass);
        await refreshState();
        toast(`Pulihkan dari Drive berhasil (${res.count} transaksi).`);
      } catch (err) {
        toast(err.message);
      }
    });

    $('btnExportVault').addEventListener('click', async () => {
      try {
        const pass = $('vaultPassphrase').value;
        const snap = await window.UangiiDB.exportSnapshot();
        const env = await window.UangiiCrypto.encryptVault(snap, pass);
        downloadBlob(new Blob([JSON.stringify(env, null, 2)], { type: 'application/json' }), `uangii-vault-${todayISO()}.json`);
        toast('File brankas terenkripsi diunduh.');
      } catch (err) {
        toast(err.message);
      }
    });

    $('importVaultFile').addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const pass = $('vaultPassphrase').value;
        const text = await file.text();
        const env = JSON.parse(text);
        const snap = await window.UangiiCrypto.decryptVault(env, pass);
        await window.UangiiDB.importSnapshot(snap);
        await refreshState();
        toast(`Brankas dipulihkan (${snap.transactions.length} transaksi).`);
      } catch (err) {
        toast(err.message);
      } finally {
        e.target.value = '';
      }
    });

    $('btnExportCsv').addEventListener('click', exportCSV);
  }

  window.addEventListener('DOMContentLoaded', async () => {
    bindEvents();
    await refreshState();
  });
})();
