// Uangii Web Main Controller (Stage 1: IndexedDB + Google Drive AppData Sync)
(() => {
  'use strict';

  const state = {
    wallets: [],
    transactions: [],
    view: 'dashboard',
    modalType: 'expense',
    editingTxId: null,
    editingWalletId: null
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
    const [wallets, transactions, lastSync, lastModified] = await Promise.all([
      window.UangiiDB.getWallets(),
      window.UangiiDB.getTransactions(),
      window.UangiiDB.getMeta('lastDriveSync'),
      window.UangiiDB.getMeta('lastModified')
    ]);
    state.wallets = wallets;
    state.transactions = transactions.sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
    renderAll(lastSync, lastModified);
  }

  function renderAll(lastSync, lastModified) {
    const balances = window.UangiiDB.computeWalletBalances(state.wallets, state.transactions);
    renderDashboard(balances);
    renderTransactions();
    renderWallets(balances);
    renderSyncStatus(lastSync, lastModified);
    populateWalletSelects();
    if (window.UangiiModules) window.UangiiModules.render(state);
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
        <button type="button" class="icon-btn" title="Edit transaksi" aria-label="Edit transaksi" data-edit-tx="${escapeHtml(t.id)}">✎</button>
        <button type="button" class="icon-btn" title="Hapus transaksi" aria-label="Hapus transaksi" data-del-tx="${escapeHtml(t.id)}">✕</button>
      </div>
    </div>`;
  }

  function renderTransactions() {
    const q = ($('filterSearch')?.value || '').trim().toLowerCase();
    const month = $('filterMonth')?.value || '';
    const type = $('filterType')?.value || 'all';
    const walletId = $('filterWallet')?.value || 'all';

    const filtered = state.transactions.filter((t) => {
      if (month && (!t.date || !t.date.startsWith(month))) return false;
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
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;gap:6px;">
          <small style="color:var(--muted);">Saldo awal: ${fmtRp(w.initialBalance)}</small>
          <div style="display:flex;gap:4px;">
            <button type="button" class="icon-btn" title="Edit dompet" aria-label="Edit dompet" data-edit-wallet="${escapeHtml(w.id)}">✎</button>
            ${state.wallets.length > 1 ? `<button type="button" class="icon-btn" title="Hapus dompet" aria-label="Hapus dompet" data-del-wallet="${escapeHtml(w.id)}">✕</button>` : ''}
          </div>
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

  function renderSyncStatus(lastSync, lastModified) {
    const connected = window.UangiiDriveSync.isConnected();
    const hasUnsynced = Boolean(
      (lastModified && (!lastSync || lastModified > lastSync)) ||
      (state.transactions.length > 0 && !lastSync)
    );
    const dot = $('sidebarSyncDot');
    dot.classList.toggle('online', connected && !hasUnsynced);
    dot.classList.toggle('dirty', hasUnsynced);

    if (hasUnsynced) {
      $('sidebarSyncText').textContent = 'Belum dicadangkan';
    } else {
      $('sidebarSyncText').textContent = connected ? 'Google Drive terhubung' : 'Tersimpan Lokal';
    }

    $('driveStatusText').textContent = connected
      ? 'Terhubung ke Google Drive (folder khusus aplikasi)'
      : 'Belum terhubung · Data tersimpan aman di browser ini';

    const syncEl = $('driveLastSync');
    if (hasUnsynced) {
      syncEl.textContent = lastSync
        ? `Ada perubahan baru sejak cadangan terakhir (${new Date(lastSync).toLocaleString('id-ID')})`
        : 'Ada data baru yang belum dicadangkan ke Google Drive';
      syncEl.style.color = 'var(--warn)';
    } else {
      syncEl.textContent = lastSync
        ? 'Semua data sudah dicadangkan: ' + new Date(lastSync).toLocaleString('id-ID')
        : 'Belum pernah mencadangkan ke Google Drive';
      syncEl.style.color = 'var(--accent)';
    }
    if ($('btnDriveDisconnect')) $('btnDriveDisconnect').style.display = connected ? 'inline-flex' : 'none';
  }

  function switchView(name) {
    state.view = name;
    document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + name));
    document.querySelectorAll('[data-nav]').forEach((b) => b.classList.toggle('active', b.dataset.nav === name));
    const titles = {
      dashboard: ['Beranda', 'Ringkasan saldo, arus kas bulan ini, dan input cepat.'],
      transactions: ['Riwayat Transaksi', 'Cari, saring per bulan, edit, dan ekspor catatan keuanganmu.'],
      wallets: ['Dompet & RDN', 'Kelola saldo tunai, rekening bank, e-wallet, dan kas investasi.'],
      investments: ['Portofolio Investasi', 'Pantau saham, reksa dana, emas, kripto, Average Price, dan Floating P/L.'],
      planning: ['Perencanaan Keuangan', 'Kelola anggaran bulanan, target tabungan, tagihan rutin, serta hutang & piutang.'],
      sync: ['Sync & Cadangan', 'Cadangan terenkripsi Google Drive & file lokal untuk menjaga datamu tetap aman.']
    };
    const [t, s] = titles[name] || titles.dashboard;
    $('pageTitle').textContent = t;
    $('pageSub').textContent = s;
  }

  function openTxModal(type = 'expense', existingTx = null) {
    state.editingTxId = existingTx ? existingTx.id : null;
    state.modalType = existingTx ? existingTx.type : type;
    document.querySelectorAll('.seg-btn').forEach((b) => b.classList.toggle('active', b.dataset.txType === state.modalType));
    $('txToWalletWrap').style.display = state.modalType === 'transfer' ? 'flex' : 'none';
    populateCategories(state.modalType);
    $('txModalTitle').textContent = existingTx ? 'Edit Transaksi' : 'Catat Transaksi';
    $('txSubmitBtn').textContent = existingTx ? 'Perbarui Transaksi' : 'Simpan Transaksi';
    $('txDate').value = existingTx ? existingTx.date : todayISO();
    $('txAmount').value = existingTx ? existingTx.amount : '';
    $('txDesc').value = existingTx ? (existingTx.description || '') : '';
    if (existingTx) {
      $('txCategory').value = existingTx.category;
      $('txWallet').value = existingTx.walletId;
      if (existingTx.toWalletId) $('txToWallet').value = existingTx.toWalletId;
    }
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
      const existing = state.editingTxId ? state.transactions.find((x) => x.id === state.editingTxId) : null;
      const tx = {
        id: existing ? existing.id : 'tx-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        type: state.modalType,
        amount,
        category: $('txCategory').value,
        description: ($('txDesc').value || '').trim() || $('txCategory').value,
        notes: existing ? (existing.notes || '') : '',
        walletId,
        toWalletId,
        date: $('txDate').value || todayISO(),
        createdAt: existing ? existing.createdAt : new Date().toISOString(),
        _raw: existing?._raw || undefined
      };
      await window.UangiiDB.putTransaction(tx);
      state.editingTxId = null;
      $('txModal').close();
      await refreshState();
      toast(existing ? 'Transaksi diperbarui.' : 'Transaksi berhasil dicatat.');
    });

    $('quickForm').addEventListener('submit', saveQuickInput);
    $('quickInput').addEventListener('input', handleQuickPreview);

    ['filterSearch', 'filterMonth', 'filterType', 'filterWallet'].forEach((id) => {
      $(id)?.addEventListener('input', renderTransactions);
      $(id)?.addEventListener('change', renderTransactions);
    });

    document.body.addEventListener('click', async (e) => {
      const editTx = e.target.closest('[data-edit-tx]');
      if (editTx) {
        const tx = state.transactions.find((x) => x.id === editTx.dataset.editTx);
        if (tx) openTxModal(tx.type, tx);
        return;
      }
      const delTx = e.target.closest('[data-del-tx]');
      if (delTx) {
        if (!confirm('Hapus transaksi ini?')) return;
        await window.UangiiDB.deleteTransaction(delTx.dataset.delTx);
        await refreshState();
        toast('Transaksi dihapus.');
        return;
      }
      const editW = e.target.closest('[data-edit-wallet]');
      if (editW) {
        const w = state.wallets.find((x) => x.id === editW.dataset.editWallet);
        if (w) {
          state.editingWalletId = w.id;
          $('walletFormTitle').textContent = 'Edit Dompet';
          $('walletSubmitBtn').textContent = 'Perbarui Dompet';
          $('btnCancelEditWallet').style.display = 'inline-flex';
          $('walletName').value = w.name;
          $('walletType').value = w.type || 'cash';
          $('walletBalance').value = Number(w.initialBalance) || 0;
          $('walletColor').value = w.color || '#30D158';
          $('walletName').focus();
        }
        return;
      }
      const delW = e.target.closest('[data-del-wallet]');
      if (delW) {
        if (!confirm('Hapus dompet ini?')) return;
        await window.UangiiDB.deleteWallet(delW.dataset.delWallet);
        await refreshState();
        toast('Dompet dihapus.');
      }
    });

    function resetWalletForm() {
      state.editingWalletId = null;
      $('walletFormTitle').textContent = 'Tambah Dompet Baru';
      $('walletSubmitBtn').textContent = 'Simpan Dompet';
      $('btnCancelEditWallet').style.display = 'none';
      $('walletName').value = '';
      $('walletBalance').value = '';
    }

    $('btnCancelEditWallet').addEventListener('click', resetWalletForm);

    $('walletForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = ($('walletName').value || '').trim();
      if (!name) return;
      const existingW = state.editingWalletId ? state.wallets.find((x) => x.id === state.editingWalletId) : null;
      const isEdit = Boolean(existingW);
      const w = {
        id: existingW ? existingW.id : ('w-' + Date.now()),
        name,
        type: $('walletType').value,
        initialBalance: Number($('walletBalance').value) || 0,
        currency: existingW?.currency || 'IDR',
        color: $('walletColor').value || '#30D158',
        _raw: existingW?._raw || undefined
      };
      await window.UangiiDB.putWallet(w);
      resetWalletForm();
      await refreshState();
      toast(isEdit ? `Dompet "${name}" diperbarui.` : `Dompet "${name}" ditambahkan.`);
    });

    // Sync & Backup handlers
    $('btnDriveConnect').addEventListener('click', async () => {
      try {
        await window.UangiiDriveSync.connect();
        await refreshState();
        toast('Berhasil terhubung ke Google Drive!');
      } catch (err) {
        toast(err.message);
      }
    });

    $('btnDrivePush').addEventListener('click', async () => {
      try {
        const pass = $('vaultPassphrase').value;
        const res = await window.UangiiDriveSync.pushEncryptedSnapshot(pass);
        $('vaultPassphrase').value = '';
        await refreshState();
        toast(`Upload terenkripsi berhasil (${res.count} transaksi).`);
      } catch (err) {
        toast(err.message);
      }
    });

    $('btnDrivePull').addEventListener('click', async () => {
      try {
        const pass = $('vaultPassphrase').value;
        const res = await window.UangiiDriveSync.pullEncryptedSnapshot(pass);
        $('vaultPassphrase').value = '';
        await refreshState();
        toast(`Pulihkan dari Drive berhasil (${res.count} transaksi).`);
      } catch (err) {
        toast(err.message);
      }
    });

    $('btnDriveDisconnect').addEventListener('click', async () => {
      window.UangiiDriveSync.disconnect();
      const lastSync = await window.UangiiDB.getMeta('lastDriveSync');
      renderSyncStatus(lastSync);
      toast('Sesi Google Drive diputuskan.');
    });

    $('btnExportVault').addEventListener('click', async () => {
      try {
        const pass = $('vaultPassphrase').value;
        const snap = await window.UangiiDB.exportSnapshot();
        const encrypted = await window.UangiiCrypto.encryptVault(snap, pass);
        $('vaultPassphrase').value = '';
        const body = typeof encrypted === 'string' ? encrypted : JSON.stringify(encrypted, null, 2);
        downloadBlob(new Blob([body], { type: 'application/json' }), `fintrack_backup_${todayISO()}.json`);
        toast('File cadangan terenkripsi diunduh.');
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
        const snap = await window.UangiiCrypto.decryptVault(text, pass);
        $('vaultPassphrase').value = '';
        const res = await window.UangiiDB.importSnapshot(snap);
        await refreshState();
        toast(`Cadangan dipulihkan (${res.transactionsCount} transaksi, ${res.walletsCount} dompet).`);
      } catch (err) {
        toast(err.message);
      } finally {
        e.target.value = '';
      }
    });

    $('btnWipeLocal').addEventListener('click', async () => {
      if (!confirm('Hapus seluruh transaksi & dompet lokal di browser ini serta putuskan sesi Google Drive? (Cadangan di Google Drive tetap aman.)')) return;
      window.UangiiDriveSync.disconnect();
      await window.UangiiDB.wipeAllData();
      $('vaultPassphrase').value = '';
      await refreshState();
      toast('Data lokal dibersihkan dan sesi Drive diputuskan.');
    });

    $('btnExportCsv').addEventListener('click', exportCSV);
  }

  function renderVipGate(ev) {
    const gate = $('vipGate');
    const title = $('vipGateTitle');
    const desc = $('vipGateDesc');
    const meta = $('vipGateMeta');
    const btnSignIn = $('btnVipGoogleSignIn');
    const btnRefresh = $('btnVipRefresh');
    const btnUpgrade = $('btnVipUpgrade');
    const btnGateSignOut = $('btnVipGateSignOut');
    const userBox = $('vipUserBox');
    const btnSideSignOut = $('btnVipSignOut');

    if (!window.UANGII_WEB_CONFIG?.vipGateEnabled) {
      gate.hidden = true;
      return;
    }

    const show = (el, yes) => { if (el) el.style.display = yes ? 'inline-flex' : 'none'; };

    if (ev.status === 'vip_active') {
      gate.hidden = true;
      const tierLabel = ev.entitlement?.label || 'VIP Aktif';
      const email = ev.user?.email || '';
      if (userBox) {
        userBox.style.display = 'block';
        $('vipUserTier').textContent = tierLabel;
        $('vipUserEmail').textContent = email;
      }
      if ($('syncAccountCard')) {
        $('syncAccountCard').style.display = 'block';
        $('syncAccountTier').textContent = tierLabel;
        $('syncAccountEmail').textContent = email;
      }
      show(btnSideSignOut, true);
      maybeShowOnboarding(tierLabel, email);
      return;
    }

    gate.hidden = false;
    if ($('onboardGate')) $('onboardGate').hidden = true;
    if (userBox) userBox.style.display = 'none';
    if ($('syncAccountCard')) $('syncAccountCard').style.display = 'none';
    show(btnSideSignOut, false);
    meta.style.display = 'none';

    if (ev.status === 'signed_out') {
      title.textContent = 'Masuk ke Uangii Web';
      desc.textContent = 'Masuk dengan akun Google Uangii untuk memverifikasi status Personal Pro atau Family VIP Anda.';
      show(btnSignIn, true);
      show(btnRefresh, false);
      show(btnUpgrade, false);
      show(btnGateSignOut, false);
    } else if (ev.status === 'checking') {
      title.textContent = 'Memverifikasi Hak VIP…';
      desc.textContent = `Memeriksa status langganan untuk ${ev.user?.email || 'akun Anda'}…`;
      show(btnSignIn, false);
      show(btnRefresh, false);
      show(btnUpgrade, false);
      show(btnGateSignOut, false);
    } else if (ev.status === 'not_vip') {
      title.textContent = 'Khusus Personal Pro & Family VIP';
      desc.textContent = `Akun ${ev.user?.email || ''} belum memiliki paket Personal Pro atau Family VIP aktif. Aktifkan di aplikasi Android Uangii (mulai Rp 9.000/bln).`;
      show(btnSignIn, false);
      show(btnRefresh, true);
      show(btnUpgrade, true);
      show(btnGateSignOut, true);
    } else {
      title.textContent = 'Verifikasi Gagal';
      desc.textContent = ev.error || 'Terjadi kendala saat memverifikasi status VIP. Periksa koneksi lalu coba lagi.';
      show(btnSignIn, !ev.user);
      show(btnRefresh, Boolean(ev.user));
      show(btnUpgrade, false);
      show(btnGateSignOut, Boolean(ev.user));
    }
  }

  async function maybeShowOnboarding(tierLabel, email) {
    const ob = $('onboardGate');
    if (!ob) return;
    const [onboarded, txs] = await Promise.all([
      window.UangiiDB.getMeta('onboarded'),
      window.UangiiDB.getTransactions()
    ]);
    if (onboarded || (txs && txs.length > 0)) {
      ob.hidden = true;
      return;
    }
    $('onboardTierBadge').textContent = tierLabel;
    $('onboardTitle').textContent = 'Mau mulai dari mana?';
    $('onboardDesc').textContent = `Halo ${email || 'Pengguna VIP'}! Browser ini belum memiliki data lokal. Pulihkan cadangan dari Google Drive atau mulai baru dari nol.`;
    $('onboardStepChoice').style.display = 'flex';
    $('onboardDriveForm').style.display = 'none';
    ob.hidden = false;
  }

  function setupOnboarding() {
    const startFresh = async () => {
      await window.UangiiDB.setMeta('onboarded', true);
      $('onboardGate').hidden = true;
      toast('Siap digunakan! Anda bisa mencadangkan ke Google Drive kapan saja.');
    };

    $('btnOnboardStartFresh')?.addEventListener('click', startFresh);
    $('btnOnboardBackFresh')?.addEventListener('click', startFresh);

    $('btnOnboardConnectDrive')?.addEventListener('click', async () => {
      try {
        await window.UangiiDriveSync.connect();
        const files = await window.UangiiDriveSync.listVaultFiles();
        if (!files.length) {
          toast('Belum ada file cadangan di Google Drive akun ini. Mulai baru dari nol.');
          await startFresh();
          await refreshState();
          return;
        }
        const sel = $('onboardFileSelect');
        sel.innerHTML = files.map((f) => {
          const dt = f.modifiedTime ? new Date(f.modifiedTime).toLocaleString('id-ID') : '';
          return `<option value="${escapeHtml(f.id)}">${escapeHtml(f.name)}${dt ? ' · ' + escapeHtml(dt) : ''}</option>`;
        }).join('');
        $('onboardStepChoice').style.display = 'none';
        $('onboardDriveForm').style.display = 'block';
        $('onboardPassphrase').focus();
        await refreshState();
      } catch (err) {
        toast(err.message || 'Gagal menghubungkan ke Google Drive.');
      }
    });

    $('onboardDriveForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const fileId = $('onboardFileSelect').value;
        const pass = $('onboardPassphrase').value;
        const res = await window.UangiiDriveSync.pullEncryptedSnapshot(pass, fileId);
        $('onboardPassphrase').value = '';
        $('onboardGate').hidden = true;
        await refreshState();
        toast(`Berhasil memulihkan ${res.count} transaksi & ${res.wallets} dompet!`);
      } catch (err) {
        toast(err.message || 'Gagal memulihkan cadangan.');
      }
    });
  }

  function setupVipGate() {
    $('btnVipGoogleSignIn')?.addEventListener('click', async () => {
      try {
        await window.UangiiVipAuth.signInGoogle();
      } catch (err) {
        toast(err.message || 'Login Google gagal.');
      }
    });

    $('btnVipRefresh')?.addEventListener('click', async () => {
      try {
        const ent = await window.UangiiVipAuth.refreshEntitlement();
        renderVipGate({
          status: ent ? 'vip_active' : 'not_vip',
          user: window.UangiiVipAuth.getUser(),
          entitlement: ent
        });
        toast(ent ? `VIP terverifikasi: ${ent.label}` : 'Belum ada paket VIP aktif pada akun ini.');
      } catch (err) {
        toast(err.message || 'Gagal memeriksa ulang status VIP.');
      }
    });

    const handleSignOut = async () => {
      if (confirm('Hapus juga data lokal di browser ini saat keluar? (Pilih OK untuk komputer bersama, Batal untuk tetap menyimpan data lokal.)')) {
        window.UangiiDriveSync.disconnect();
        await window.UangiiDB.wipeAllData();
      }
      await window.UangiiVipAuth.signOut();
      toast('Berhasil keluar akun.');
    };
    $('btnVipGateSignOut')?.addEventListener('click', handleSignOut);
    $('btnVipSignOut')?.addEventListener('click', handleSignOut);
    $('btnSyncSignOut')?.addEventListener('click', handleSignOut);

    if (window.UangiiVipAuth) {
      window.UangiiVipAuth.init(renderVipGate);
    }
  }

  window.addEventListener('DOMContentLoaded', async () => {
    bindEvents();
    if (window.UangiiModules) window.UangiiModules.init(refreshState, toast);
    setupOnboarding();
    setupVipGate();
    await refreshState();
  });
})();
