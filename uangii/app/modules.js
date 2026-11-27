// Batch 1 Modules: Investasi & RDN + Perencanaan (Anggaran, Target Tabungan, Tagihan Rutin, Hutang/Piutang)
// Reads/writes directly to Android v4 tables in UangiiDB for 100% lossless backup compatibility.
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  let activePlanTab = 'budgets';
  let refreshAppFn = null;
  let toastFn = (m) => alert(m);

  function fmtRp(num) {
    const n = Number(num) || 0;
    return (n < 0 ? '-Rp ' : 'Rp ') + Math.abs(Math.round(n)).toLocaleString('id-ID');
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function fmtDate(val) {
    if (!val) return '-';
    const d = new Date(Number(val));
    return Number.isNaN(d.getTime()) ? String(val) : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function nextId(rows) {
    return rows.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0) + 1;
  }

  async function renderAllModules(state) {
    const [portfolios, budgets, goals, recurring, debts, categories] = await Promise.all([
      window.UangiiDB.getAndroidTable('investmentPortfolios'),
      window.UangiiDB.getAndroidTable('budgets'),
      window.UangiiDB.getAndroidTable('savingsGoals'),
      window.UangiiDB.getAndroidTable('recurringPayments'),
      window.UangiiDB.getAndroidTable('debts'),
      window.UangiiDB.getAndroidCategories()
    ]);

    renderInvestments(portfolios);
    renderBudgets(budgets, state.transactions, categories);
    renderGoals(goals);
    renderRecurring(recurring, state.wallets);
    renderDebts(debts);
    renderCategories(categories);
  }

  // ===== 1. INVESTASI & PORTOFOLIO =====
  function renderInvestments(portfolios) {
    let totalValue = 0;
    let totalCost = 0;
    portfolios.forEach((p) => {
      const units = Number(p.totalUnits) || 0;
      totalValue += units * (Number(p.currentPrice) || 0);
      totalCost += units * (Number(p.averagePrice) || 0);
    });
    const pl = totalValue - totalCost;
    const plPct = totalCost > 0 ? ((pl / totalCost) * 100).toFixed(2) : '0.00';

    if ($('invTotalValue')) $('invTotalValue').textContent = fmtRp(totalValue);
    if ($('invTotalCost')) $('invTotalCost').textContent = fmtRp(totalCost);
    if ($('invFloatingPL')) {
      $('invFloatingPL').textContent = `${pl >= 0 ? '+' : ''}${fmtRp(pl)} (${pl >= 0 ? '+' : ''}${plPct}%)`;
      $('invFloatingPL').className = 'stat-value ' + (pl >= 0 ? 'text-pos' : 'text-neg');
    }

    const listEl = $('invList');
    if (!listEl) return;
    if (!portfolios.length) {
      listEl.innerHTML = '<div class="empty-state">Belum ada aset investasi. Tambahkan saham, emas, reksa dana, atau pulihkan cadangan dari HP Android.</div>';
      return;
    }
    listEl.innerHTML = portfolios.map((p) => {
      const units = Number(p.totalUnits) || 0;
      const avg = Number(p.averagePrice) || 0;
      const cur = Number(p.currentPrice) || 0;
      const val = units * cur;
      const diff = (cur - avg) * units;
      const pct = avg > 0 ? (((cur - avg) / avg) * 100).toFixed(1) : '0.0';
      const cls = diff >= 0 ? 'text-pos' : 'text-neg';
      return `<article class="wallet-card">
        <div class="wallet-top">
          <div>
            <strong>${escapeHtml(p.tickerSymbol || p.name)}</strong>
            <div style="font-size:.78rem;color:var(--muted);">${escapeHtml(p.name)}</div>
          </div>
          <span class="wallet-type">${escapeHtml(p.type || 'ASET')}</span>
        </div>
        <div class="wallet-bal">${fmtRp(val)}</div>
        <div style="font-size:.8rem;" class="${cls}">${diff >= 0 ? '+' : ''}${fmtRp(diff)} (${diff >= 0 ? '+' : ''}${pct}%)</div>
        <div style="font-size:.76rem;color:var(--muted);display:flex;justify-content:space-between;gap:8px;">
          <span>${units.toLocaleString('id-ID')} unit · Avg ${fmtRp(avg)}</span>
          <span>Skrg ${fmtRp(cur)}</span>
        </div>
        <div style="display:flex;gap:6px;margin-top:6px;">
          <button type="button" class="btn btn-ghost btn-sm" style="flex:1;" data-inv-price="${escapeHtml(p.id)}">Update Harga</button>
          <button type="button" class="icon-btn" title="Hapus aset" data-inv-del="${escapeHtml(p.id)}">✕</button>
        </div>
      </article>`;
    }).join('');
  }

  // ===== 2. ANGGARAN BULANAN =====
  function renderBudgets(budgets, transactions, categories) {
    const nowMonth = new Date().toISOString().slice(0, 7);
    const catSelect = $('budgetCategory');
    if (catSelect) {
      const expCats = categories.filter((c) => String(c.type).toUpperCase() === 'EXPENSE');
      catSelect.innerHTML = expCats.map((c) => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('');
    }

    const spentByCat = new Map();
    transactions.forEach((t) => {
      if (t.type !== 'expense' || !t.date || !t.date.startsWith(nowMonth)) return;
      const key = String(t.category || '').toLowerCase();
      spentByCat.set(key, (spentByCat.get(key) || 0) + (Number(t.amount) || 0));
    });

    const el = $('budgetList');
    if (!el) return;
    if (!budgets.length) {
      el.innerHTML = '<div class="empty-state">Belum ada anggaran bulanan. Tambahkan batas pengeluaran per kategori di sebelah.</div>';
      return;
    }
    el.innerHTML = budgets.map((b) => {
      const limit = Number(b.amount) || 0;
      const spent = spentByCat.get(String(b.categoryName || '').toLowerCase()) || 0;
      const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
      const over = spent > limit;
      return `<div class="tx-row" style="flex-direction:column;align-items:stretch;gap:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
          <div>
            <strong>${escapeHtml(b.categoryName)}</strong>
            <span style="font-size:.76rem;color:var(--muted);margin-left:6px;">(${escapeHtml(b.monthKey || nowMonth)})</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="${over ? 'text-neg' : 'text-pos'}" style="font-size:.84rem;font-weight:700;">${fmtRp(spent)} / ${fmtRp(limit)}</span>
            <button type="button" class="icon-btn" title="Hapus anggaran" data-budget-del="${escapeHtml(b.id)}">✕</button>
          </div>
        </div>
        <div class="cat-track"><div class="cat-fill" style="width:${pct}%;${over ? 'background:var(--danger);' : ''}"></div></div>
      </div>`;
    }).join('');
  }

  // ===== 3. TARGET TABUNGAN =====
  function renderGoals(goals) {
    const el = $('goalList');
    if (!el) return;
    if (!goals.length) {
      el.innerHTML = '<div class="empty-state">Belum ada target tabungan. Buat target Dana Darurat atau impian lainnya.</div>';
      return;
    }
    el.innerHTML = goals.map((g) => {
      const target = Number(g.targetAmount) || 0;
      const cur = Number(g.currentAmount) || 0;
      const pct = target > 0 ? Math.min(100, Math.round((cur / target) * 100)) : 0;
      return `<div class="tx-row" style="flex-direction:column;align-items:stretch;gap:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
          <div>
            <strong>${escapeHtml(g.name)}</strong>
            ${g.isEmergencyFund ? '<span class="brand-badge" style="margin-left:6px;">DANA DARURAT</span>' : ''}
            <div class="tx-meta">Target: ${fmtDate(g.targetDate)} · ${pct}% tercapai</div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <button type="button" class="btn btn-ghost btn-sm" data-goal-topup="${escapeHtml(g.id)}">+ Setor</button>
            <button type="button" class="icon-btn" title="Hapus target" data-goal-del="${escapeHtml(g.id)}">✕</button>
          </div>
        </div>
        <div style="font-size:.84rem;font-weight:700;">${fmtRp(cur)} <span style="color:var(--muted);font-weight:500;">dari ${fmtRp(target)}</span></div>
        <div class="cat-track"><div class="cat-fill" style="width:${pct}%"></div></div>
      </div>`;
    }).join('');
  }

  // ===== 4. TAGIHAN RUTIN =====
  function renderRecurring(recurring) {
    const el = $('recurringList');
    if (!el) return;
    if (!recurring.length) {
      el.innerHTML = '<div class="empty-state">Belum ada tagihan berulang (WiFi, listrik, langganan, dll.).</div>';
      return;
    }
    el.innerHTML = recurring.map((r) => `
      <div class="tx-row">
        <div class="tx-main">
          <div class="tx-title">${escapeHtml(r.title)}</div>
          <div class="tx-meta">Setiap tgl ${escapeHtml(r.dayOfMonth || 1)} · ${escapeHtml(r.categoryName || 'Tagihan')} · Jatuh tempo: ${fmtDate(r.nextDueDate)}</div>
        </div>
        <div class="tx-right">
          <span class="tx-amount text-neg">-${fmtRp(r.amount)}</span>
          <button type="button" class="btn btn-ghost btn-sm" data-rec-pay="${escapeHtml(r.id)}">Catat</button>
          <button type="button" class="icon-btn" title="Hapus tagihan" data-rec-del="${escapeHtml(r.id)}">✕</button>
        </div>
      </div>
    `).join('');
  }

  // ===== 5. HUTANG & PIUTANG =====
  function renderDebts(debts) {
    const el = $('debtList');
    if (!el) return;
    if (!debts.length) {
      el.innerHTML = '<div class="empty-state">Belum ada catatan hutang atau piutang.</div>';
      return;
    }
    el.innerHTML = debts.map((d) => {
      const total = Number(d.totalAmount) || 0;
      const paid = Number(d.paidAmount) || 0;
      const remain = Math.max(0, total - paid);
      const isPiutang = String(d.type).toUpperCase() === 'PIUTANG';
      return `<div class="tx-row">
        <div class="tx-main">
          <div class="tx-title">
            <span class="brand-badge" style="margin:0 6px 0 0;${isPiutang ? '' : 'color:var(--danger);border-color:rgba(248,113,113,.35);background:rgba(248,113,113,.12);'}">${isPiutang ? 'PIUTANG' : 'HUTANG'}</span>
            ${escapeHtml(d.personName)}
            ${d.isSettled ? '<span style="color:var(--accent);font-size:.76rem;margin-left:6px;">✓ Lunas</span>' : ''}
          </div>
          <div class="tx-meta">${escapeHtml(d.notes || '-')} · Jatuh tempo: ${fmtDate(d.dueDate)} · Terbayar ${fmtRp(paid)} / ${fmtRp(total)}</div>
        </div>
        <div class="tx-right">
          <span class="tx-amount ${isPiutang ? 'text-pos' : 'text-neg'}">${fmtRp(remain)}</span>
          ${!d.isSettled ? `<button type="button" class="btn btn-ghost btn-sm" data-debt-pay="${escapeHtml(d.id)}">Cicil</button>` : ''}
          <button type="button" class="icon-btn" title="Hapus" data-debt-del="${escapeHtml(d.id)}">✕</button>
        </div>
      </div>`;
    }).join('');
  }

  // ===== 6. KATEGORI (DARI BACKUP / CUSTOM) =====
  function renderCategories(categories) {
    const el = $('categoryList');
    if (!el) return;
    if (!categories.length) {
      el.innerHTML = '<div class="empty-state">Belum ada kategori. Tambahkan kategori pengeluaran/pemasukan baru.</div>';
      return;
    }
    el.innerHTML = categories.map((c) => {
      const isInc = String(c.type || '').toUpperCase() === 'INCOME';
      return `<div class="tx-row">
        <div class="tx-main" style="display:flex;align-items:center;gap:10px;">
          <span class="wallet-dot" style="background:${escapeHtml(c.colorHex || '#30D158')};margin:0;"></span>
          <div>
            <div class="tx-title">${escapeHtml(c.name)}</div>
            <div class="tx-meta">${isInc ? 'Pemasukan' : 'Pengeluaran'}</div>
          </div>
        </div>
        <div class="tx-right">
          <button type="button" class="icon-btn" title="Hapus kategori" data-cat-del="${escapeHtml(c.id)}">✕</button>
        </div>
      </div>`;
    }).join('');
  }

  function bindModuleEvents() {
    // Planning sub-tabs
    document.querySelectorAll('[data-plan-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activePlanTab = btn.dataset.planTab;
        document.querySelectorAll('[data-plan-tab]').forEach((b) => b.classList.toggle('active', b === btn));
        document.querySelectorAll('.plan-panel').forEach((p) => {
          p.style.display = p.id === 'plan-' + activePlanTab ? 'block' : 'none';
        });
      });
    });

    // Add Investment
    $('invForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rows = await window.UangiiDB.getAndroidTable('investmentPortfolios');
      const now = Date.now();
      const avg = Number($('invAvg').value) || 0;
      const cur = Number($('invCur').value) || avg;
      const units = Number($('invUnits').value) || 0;
      const id = nextId(rows);
      rows.push({
        id,
        remoteId: 'web_inv_' + id + '_' + now,
        tickerSymbol: ($('invTicker').value || '').trim().toUpperCase(),
        name: ($('invName').value || '').trim(),
        type: $('invType').value,
        totalUnits: units,
        openingUnits: units,
        averagePrice: avg,
        openingAveragePrice: avg,
        currentPrice: cur,
        currency: 'IDR',
        isEmergencyFund: false,
        lastSyncedAt: now,
        updatedAt: now
      });
      await window.UangiiDB.saveAndroidTable('investmentPortfolios', rows);
      $('invForm').reset();
      await refreshAppFn();
      toastFn('Aset investasi ditambahkan.');
    });

    // Add Budget
    $('budgetForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rows = await window.UangiiDB.getAndroidTable('budgets');
      const cats = await window.UangiiDB.getAndroidCategories();
      const catName = $('budgetCategory').value;
      const catObj = cats.find((c) => c.name === catName);
      const now = Date.now();
      const id = nextId(rows);
      rows.push({
        id,
        remoteId: 'web_bdg_' + id + '_' + now,
        monthKey: new Date().toISOString().slice(0, 7),
        amount: Number($('budgetAmount').value) || 0,
        categoryId: catObj ? Number(catObj.id) : 1,
        categoryName: catName,
        updatedAt: now
      });
      await window.UangiiDB.saveAndroidTable('budgets', rows);
      $('budgetAmount').value = '';
      await refreshAppFn();
      toastFn(`Anggaran ${catName} disimpan.`);
    });

    // Add Savings Goal
    $('goalForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rows = await window.UangiiDB.getAndroidTable('savingsGoals');
      const now = Date.now();
      const id = nextId(rows);
      const tDate = $('goalDate').value ? new Date($('goalDate').value + 'T12:00:00').getTime() : now + 180 * 86400000;
      rows.push({
        id,
        remoteId: 'web_goal_' + id + '_' + now,
        name: ($('goalName').value || '').trim(),
        targetAmount: Number($('goalTarget').value) || 0,
        currentAmount: Number($('goalCurrent').value) || 0,
        targetDate: tDate,
        isEmergencyFund: $('goalEmergency').checked,
        isCompleted: false,
        colorHex: '#10B981',
        iconName: 'savings',
        walletId: 1,
        notes: '',
        updatedAt: now
      });
      await window.UangiiDB.saveAndroidTable('savingsGoals', rows);
      $('goalForm').reset();
      await refreshAppFn();
      toastFn('Target tabungan ditambahkan.');
    });

    // Add Recurring Payment
    $('recurringForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rows = await window.UangiiDB.getAndroidTable('recurringPayments');
      const now = Date.now();
      const id = nextId(rows);
      rows.push({
        id,
        remoteId: 'web_rec_' + id + '_' + now,
        title: ($('recTitle').value || '').trim(),
        amount: Number($('recAmount').value) || 0,
        dayOfMonth: Number($('recDay').value) || 1,
        frequency: 'MONTHLY',
        type: 'EXPENSE',
        categoryId: 3,
        categoryName: 'Tagihan & Utilitas',
        walletId: 1,
        isActive: true,
        isAutoPost: false,
        nextDueDate: now + 30 * 86400000,
        notes: '',
        updatedAt: now
      });
      await window.UangiiDB.saveAndroidTable('recurringPayments', rows);
      $('recurringForm').reset();
      await refreshAppFn();
      toastFn('Tagihan rutin ditambahkan.');
    });

    // Add Debt / Receivable
    $('debtForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rows = await window.UangiiDB.getAndroidTable('debts');
      const now = Date.now();
      const id = nextId(rows);
      const due = $('debtDue').value ? new Date($('debtDue').value + 'T12:00:00').getTime() : now + 30 * 86400000;
      rows.push({
        id,
        remoteId: 'web_debt_' + id + '_' + now,
        type: $('debtType').value,
        personName: ($('debtPerson').value || '').trim(),
        totalAmount: Number($('debtTotal').value) || 0,
        paidAmount: 0,
        isSettled: false,
        isOpeningBalance: false,
        repaymentType: 'LUMP_SUM',
        dueDate: due,
        notes: ($('debtNotes').value || '').trim(),
        adminFee: 0,
        monthlyInterestPercent: 0,
        tenorMonths: null,
        createdAt: now,
        updatedAt: now
      });
      await window.UangiiDB.saveAndroidTable('debts', rows);
      $('debtForm').reset();
      await refreshAppFn();
      toastFn('Catatan hutang/piutang ditambahkan.');
    });

    // Delegated click handlers
    document.body.addEventListener('click', async (e) => {
      // Update Investment Price
      const invPrice = e.target.closest('[data-inv-price]');
      if (invPrice) {
        const rows = await window.UangiiDB.getAndroidTable('investmentPortfolios');
        const item = rows.find((r) => String(r.id) === invPrice.dataset.invPrice);
        if (!item) return;
        const val = prompt(`Update harga terkini per unit untuk ${item.tickerSymbol || item.name} (Rp):`, item.currentPrice);
        if (val === null) return;
        const num = Number(val);
        if (!Number.isFinite(num) || num <= 0) { toastFn('Harga tidak valid.'); return; }
        item.currentPrice = num;
        item.updatedAt = Date.now();
        await window.UangiiDB.saveAndroidTable('investmentPortfolios', rows);
        await refreshAppFn();
        toastFn('Harga aset diperbarui.');
        return;
      }

      // Delete Investment
      const invDel = e.target.closest('[data-inv-del]');
      if (invDel) {
        if (!confirm('Hapus aset investasi ini?')) return;
        const rows = (await window.UangiiDB.getAndroidTable('investmentPortfolios')).filter((r) => String(r.id) !== invDel.dataset.invDel);
        await window.UangiiDB.saveAndroidTable('investmentPortfolios', rows);
        await refreshAppFn();
        toastFn('Aset dihapus.');
        return;
      }

      // Delete Budget
      const bdgDel = e.target.closest('[data-budget-del]');
      if (bdgDel) {
        if (!confirm('Hapus anggaran ini?')) return;
        const rows = (await window.UangiiDB.getAndroidTable('budgets')).filter((r) => String(r.id) !== bdgDel.dataset.budgetDel);
        await window.UangiiDB.saveAndroidTable('budgets', rows);
        await refreshAppFn();
        toastFn('Anggaran dihapus.');
        return;
      }

      // Topup Savings Goal
      const goalTop = e.target.closest('[data-goal-topup]');
      if (goalTop) {
        const rows = await window.UangiiDB.getAndroidTable('savingsGoals');
        const item = rows.find((r) => String(r.id) === goalTop.dataset.goalTopup);
        if (!item) return;
        const val = prompt(`Tambah setoran untuk "${item.name}" (Rp):`, '500000');
        if (val === null) return;
        const amt = Number(val);
        if (!Number.isFinite(amt) || amt <= 0) { toastFn('Nominal setoran tidak valid.'); return; }
        item.currentAmount = (Number(item.currentAmount) || 0) + amt;
        item.isCompleted = item.currentAmount >= (Number(item.targetAmount) || 0);
        item.updatedAt = Date.now();
        await window.UangiiDB.saveAndroidTable('savingsGoals', rows);
        await refreshAppFn();
        toastFn(`Setoran ${fmtRp(amt)} dicatat ke ${item.name}.`);
        return;
      }

      // Delete Goal
      const goalDel = e.target.closest('[data-goal-del]');
      if (goalDel) {
        if (!confirm('Hapus target tabungan ini?')) return;
        const rows = (await window.UangiiDB.getAndroidTable('savingsGoals')).filter((r) => String(r.id) !== goalDel.dataset.goalDel);
        await window.UangiiDB.saveAndroidTable('savingsGoals', rows);
        await refreshAppFn();
        toastFn('Target tabungan dihapus.');
        return;
      }

      // Pay Recurring -> create real transaction
      const recPay = e.target.closest('[data-rec-pay]');
      if (recPay) {
        const rows = await window.UangiiDB.getAndroidTable('recurringPayments');
        const item = rows.find((r) => String(r.id) === recPay.dataset.recPay);
        if (!item) return;
        const wallets = await window.UangiiDB.getWallets();
        const walletId = wallets.find((w) => String(w.id) === String(item.walletId))?.id || wallets[0]?.id || 'w-cash';
        const today = new Date().toISOString().slice(0, 10);
        await window.UangiiDB.putTransaction({
          id: 'tx-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
          type: 'expense',
          amount: Number(item.amount) || 0,
          category: item.categoryName || 'Tagihan & Utilitas',
          description: item.title,
          notes: 'Tagihan rutin',
          walletId,
          toWalletId: null,
          date: today,
          createdAt: new Date().toISOString()
        });
        await refreshAppFn();
        toastFn(`Tagihan "${item.title}" dicatat ke Transaksi.`);
        return;
      }

      // Delete Recurring
      const recDel = e.target.closest('[data-rec-del]');
      if (recDel) {
        if (!confirm('Hapus tagihan rutin ini?')) return;
        const rows = (await window.UangiiDB.getAndroidTable('recurringPayments')).filter((r) => String(r.id) !== recDel.dataset.recDel);
        await window.UangiiDB.saveAndroidTable('recurringPayments', rows);
        await refreshAppFn();
        toastFn('Tagihan rutin dihapus.');
        return;
      }

      // Pay / Receive Debt installment
      const debtPay = e.target.closest('[data-debt-pay]');
      if (debtPay) {
        const rows = await window.UangiiDB.getAndroidTable('debts');
        const item = rows.find((r) => String(r.id) === debtPay.dataset.debtPay);
        if (!item) return;
        const remain = Math.max(0, (Number(item.totalAmount) || 0) - (Number(item.paidAmount) || 0));
        const val = prompt(`Catat pembayaran untuk ${item.personName} (sisa ${fmtRp(remain)}):`, String(remain));
        if (val === null) return;
        const amt = Number(val);
        if (!Number.isFinite(amt) || amt <= 0) { toastFn('Nominal tidak valid.'); return; }
        item.paidAmount = (Number(item.paidAmount) || 0) + amt;
        item.isSettled = item.paidAmount >= (Number(item.totalAmount) || 0);
        item.updatedAt = Date.now();
        await window.UangiiDB.saveAndroidTable('debts', rows);
        await refreshAppFn();
        toastFn(item.isSettled ? `${item.personName} ditandai LUNAS!` : `Cicilan ${fmtRp(amt)} dicatat.`);
        return;
      }

      // Delete Debt
      const debtDel = e.target.closest('[data-debt-del]');
      if (debtDel) {
        if (!confirm('Hapus catatan hutang/piutang ini?')) return;
        const rows = (await window.UangiiDB.getAndroidTable('debts')).filter((r) => String(r.id) !== debtDel.dataset.debtDel);
        await window.UangiiDB.saveAndroidTable('debts', rows);
        await refreshAppFn();
        toastFn('Catatan dihapus.');
        return;
      }

      // Delete Category
      const catDel = e.target.closest('[data-cat-del]');
      if (catDel) {
        if (!confirm('Hapus kategori ini?')) return;
        const rows = (await window.UangiiDB.getAndroidCategories()).filter((r) => String(r.id) !== catDel.dataset.catDel);
        await window.UangiiDB.saveAndroidTable('categories', rows);
        await refreshAppFn();
        toastFn('Kategori dihapus.');
      }
    });

    // Add Category
    $('categoryForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rows = await window.UangiiDB.getAndroidCategories();
      const now = Date.now();
      const id = nextId(rows);
      rows.push({
        id,
        remoteId: 'web_cat_' + id + '_' + now,
        name: ($('catName').value || '').trim(),
        type: $('catType').value,
        colorHex: $('catColor').value || '#30D158',
        iconName: 'label',
        isDefault: false,
        updatedAt: now
      });
      await window.UangiiDB.saveAndroidTable('categories', rows);
      $('categoryForm').reset();
      await refreshAppFn();
      toastFn('Kategori baru ditambahkan.');
    });
  }

  window.UangiiModules = {
    init(refreshFn, showToastFn) {
      refreshAppFn = refreshFn;
      if (showToastFn) toastFn = showToastFn;
      bindModuleEvents();
    },
    render: renderAllModules
  };
})();
