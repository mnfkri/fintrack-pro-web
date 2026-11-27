// Batch 2: Visual Analytics Module (6-Month Cashflow SVG, 50/30/20 Ring, Emergency Runway, Wealth Donut)
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);

  function fmtRp(num) {
    const n = Number(num) || 0;
    return (n < 0 ? '-Rp ' : 'Rp ') + Math.abs(Math.round(n)).toLocaleString('id-ID');
  }

  function fmtCompact(num) {
    const abs = Math.abs(Number(num) || 0);
    if (abs >= 1e9) return (num / 1e9).toFixed(1) + 'M';
    if (abs >= 1e6) return (num / 1e6).toFixed(1) + 'jt';
    if (abs >= 1e3) return Math.round(num / 1e3) + 'rb';
    return String(Math.round(num));
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function getLast6Months() {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('id-ID', { month: 'short' });
      months.push({ key, label, income: 0, expense: 0 });
    }
    return months;
  }

  async function renderAnalytics(state) {
    if (!$('view-analytics')) return;
    const [portfolios, goals] = await Promise.all([
      window.UangiiDB.getAndroidTable('investmentPortfolios'),
      window.UangiiDB.getAndroidTable('savingsGoals')
    ]);

    const txs = state.transactions || [];
    const months = getLast6Months();
    const monthMap = new Map(months.map((m) => [m.key, m]));

    // Current month metrics
    const curKey = months[months.length - 1].key;
    let curIncome = 0;
    let curExpense = 0;
    let needsExp = 0;
    let wantsExp = 0;

    txs.forEach((t) => {
      const mKey = (t.date || '').slice(0, 7);
      const bucket = monthMap.get(mKey);
      const amt = Number(t.amount) || 0;
      if (bucket) {
        if (t.type === 'income') bucket.income += amt;
        else if (t.type === 'expense') bucket.expense += amt;
      }
      if (mKey === curKey) {
        if (t.type === 'income') curIncome += amt;
        else if (t.type === 'expense') {
          curExpense += amt;
          const tag = String(t._raw?.financialTag || '').toUpperCase();
          const catLower = String(t.category || '').toLowerCase();
          if (tag === 'WANTS' || /hiburan|gaya hidup|belanja|kopi|nongkrong/.test(catLower)) {
            wantsExp += amt;
          } else {
            needsExp += amt;
          }
        }
      }
    });

    // If current month has 0 data, fall back to the latest month that has transactions
    let displayIncome = curIncome;
    let displayExpense = curExpense;
    let periodLabel = 'Bulan ini';
    if (displayIncome === 0 && displayExpense === 0 && txs.length > 0) {
      const latestMonth = (txs[0].date || '').slice(0, 7);
      periodLabel = `Periode ${latestMonth}`;
      needsExp = 0;
      wantsExp = 0;
      txs.forEach((t) => {
        if ((t.date || '').slice(0, 7) !== latestMonth) return;
        const amt = Number(t.amount) || 0;
        if (t.type === 'income') displayIncome += amt;
        else if (t.type === 'expense') {
          displayExpense += amt;
          const catLower = String(t.category || '').toLowerCase();
          if (/hiburan|gaya hidup|belanja/.test(catLower)) wantsExp += amt;
          else needsExp += amt;
        }
      });
    }

    // Saving rate
    const savings = displayIncome - displayExpense;
    const savingRate = displayIncome > 0 ? Math.round((savings / displayIncome) * 100) : 0;
    $('anSavingRate').textContent = `${savingRate}%`;
    $('anSavingRate').className = 'stat-value ' + (savingRate >= 20 ? 'text-pos' : savingRate >= 0 ? '' : 'text-neg');
    $('anSavingSub').textContent = `${periodLabel} · Tabungan ${fmtRp(savings)}`;

    // Daily burn rate
    const daysInMonth = 30;
    const dailyBurn = displayExpense / daysInMonth;
    $('anDailyBurn').textContent = fmtRp(dailyBurn);
    $('anDailySub').textContent = `Rata-rata per hari (${periodLabel})`;

    // Emergency Runway
    const balances = window.UangiiDB.computeWalletBalances(state.wallets, txs);
    let liquidCash = 0;
    balances.forEach((v) => { liquidCash += Math.max(0, v); });
    const emergencyGoalAmt = goals
      .filter((g) => g.isEmergencyFund)
      .reduce((s, g) => s + (Number(g.currentAmount) || 0), 0);
    const emergencyPool = emergencyGoalAmt > 0 ? emergencyGoalAmt : liquidCash;
    const monthlyNeed = displayExpense > 0 ? displayExpense : 1;
    const runwayMonths = displayExpense > 0 ? (emergencyPool / monthlyNeed) : 0;
    $('anRunway').textContent = displayExpense > 0 ? `${runwayMonths.toFixed(1)} Bulan` : '—';
    $('anRunway').className = 'stat-value ' + (runwayMonths >= 6 ? 'text-pos' : runwayMonths >= 3 ? 'text-info' : 'text-neg');
    $('anRunwaySub').textContent = emergencyGoalAmt > 0
      ? `Dana darurat tercatat: ${fmtRp(emergencyGoalAmt)}`
      : `Basis kas likuid: ${fmtRp(liquidCash)}`;

    // 1. 6-Month Cashflow SVG Bar Chart
    renderCashflowChart(months);

    // 2. 50/30/20 Health Ring
    renderHealthRing(displayIncome, needsExp, wantsExp, Math.max(0, savings), periodLabel);

    // 3. Wealth Allocation Donut (Cash vs Investments)
    let invTotal = 0;
    portfolios.forEach((p) => {
      invTotal += (Number(p.totalUnits) || 0) * (Number(p.currentPrice) || 0);
    });
    renderWealthDonut(liquidCash, invTotal);
  }

  function renderCashflowChart(months) {
    const el = $('anCashflowChart');
    if (!el) return;
    const maxVal = Math.max(1, ...months.flatMap((m) => [m.income, m.expense]));
    const W = 540;
    const H = 210;
    const padB = 30;
    const padT = 18;
    const chartH = H - padB - padT;
    const colW = W / months.length;

    const bars = months.map((m, i) => {
      const cx = i * colW + colW / 2;
      const incH = Math.max(2, (m.income / maxVal) * chartH);
      const expH = Math.max(2, (m.expense / maxVal) * chartH);
      const incY = padT + (chartH - incH);
      const expY = padT + (chartH - expH);
      return `<g class="chart-col">
        <rect class="bar-anim bar-inc" x="${cx - 18}" y="${incY}" width="15" height="${incH}" rx="5">
          <title>${escapeHtml(m.label)} · Pemasukan: ${fmtRp(m.income)}</title>
        </rect>
        <rect class="bar-anim bar-exp" x="${cx + 3}" y="${expY}" width="15" height="${expH}" rx="5">
          <title>${escapeHtml(m.label)} · Pengeluaran: ${fmtRp(m.expense)}</title>
        </rect>
        <text x="${cx}" y="${H - 8}" text-anchor="middle" fill="#98a89d" font-size="11" font-weight="600">${escapeHtml(m.label)}</text>
      </g>`;
    }).join('');

    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;" role="img" aria-label="Grafik Arus Kas 6 Bulan">
      <line x1="8" y1="${padT + chartH}" x2="${W - 8}" y2="${padT + chartH}" stroke="rgba(183,245,138,.16)" stroke-width="1"/>
      <text x="10" y="12" fill="#98a89d" font-size="10">Maks: ${fmtCompact(maxVal)}</text>
      ${bars}
    </svg>
    <div style="display:flex;gap:16px;justify-content:center;margin-top:8px;font-size:.78rem;color:var(--muted);">
      <span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:#30d158;margin-right:5px;"></i>Pemasukan</span>
      <span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:#f87171;margin-right:5px;"></i>Pengeluaran</span>
    </div>`;
  }

  function renderHealthRing(income, needs, wants, savings, periodLabel) {
    const el = $('anHealthBox');
    if (!el) return;
    const total = income > 0 ? income : Math.max(1, needs + wants + savings);
    const pNeeds = Math.min(100, Math.round((needs / total) * 100));
    const pWants = Math.min(100, Math.round((wants / total) * 100));
    const pSave = Math.max(0, Math.min(100, Math.round((savings / total) * 100)));

    // Score out of 100
    let score = 50;
    if (income > 0) {
      const sSave = Math.min(40, (pSave / 20) * 40);
      const sNeeds = pNeeds <= 50 ? 35 : Math.max(0, 35 - (pNeeds - 50));
      const sWants = pWants <= 30 ? 25 : Math.max(0, 25 - (pWants - 30));
      score = Math.round(Math.min(100, sSave + sNeeds + sWants));
    }
    const r = 42;
    const circ = 2 * Math.PI * r;
    const offset = circ - (score / 100) * circ;
    const statusText = score >= 80 ? 'Sangat Sehat' : score >= 60 ? 'Cukup Baik' : 'Perlu Dirapikan';

    el.innerHTML = `<div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;">
      <svg width="110" height="110" viewBox="0 0 110 110" style="flex-shrink:0;">
        <circle cx="55" cy="55" r="${r}" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="10"/>
        <circle class="ring-anim" cx="55" cy="55" r="${r}" fill="none" stroke="#b7f58a" stroke-width="10"
          stroke-linecap="round" stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"
          transform="rotate(-90 55 55)"/>
        <text x="55" y="53" text-anchor="middle" fill="#f1f5ee" font-size="22" font-weight="800">${score}</text>
        <text x="55" y="69" text-anchor="middle" fill="#98a89d" font-size="10">SKOR</text>
      </svg>
      <div style="flex:1;min-width:190px;">
        <div style="font-weight:800;font-size:1rem;margin-bottom:4px;">${statusText} <span style="font-weight:500;font-size:.78rem;color:var(--muted);">(${escapeHtml(periodLabel)})</span></div>
        <div class="cat-row"><div class="cat-top"><span>Kebutuhan (Ideal ≤50%)</span><strong>${pNeeds}%</strong></div><div class="cat-track"><div class="cat-fill" style="width:${pNeeds}%"></div></div></div>
        <div class="cat-row"><div class="cat-top"><span>Keinginan (Ideal ≤30%)</span><strong>${pWants}%</strong></div><div class="cat-track"><div class="cat-fill" style="width:${pWants}%;background:var(--info);"></div></div></div>
        <div class="cat-row" style="margin-bottom:0;"><div class="cat-top"><span>Tabungan (Ideal ≥20%)</span><strong>${pSave}%</strong></div><div class="cat-track"><div class="cat-fill" style="width:${pSave}%;background:var(--accent-strong);"></div></div></div>
      </div>
    </div>`;
  }

  function renderWealthDonut(cash, invest) {
    const el = $('anWealthDonut');
    if (!el) return;
    const total = cash + invest;
    const cashPct = total > 0 ? Math.round((cash / total) * 100) : 100;
    const invPct = total > 0 ? 100 - cashPct : 0;
    const r = 42;
    const circ = 2 * Math.PI * r;
    const invLen = (invPct / 100) * circ;

    el.innerHTML = `<div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;">
      <svg width="110" height="110" viewBox="0 0 110 110" style="flex-shrink:0;">
        <circle cx="55" cy="55" r="${r}" fill="none" stroke="#30d158" stroke-width="12"/>
        <circle class="ring-anim" cx="55" cy="55" r="${r}" fill="none" stroke="#a78bfa" stroke-width="12"
          stroke-dasharray="${invLen.toFixed(1)} ${circ.toFixed(1)}" transform="rotate(-90 55 55)"/>
        <text x="55" y="59" text-anchor="middle" fill="#f1f5ee" font-size="12" font-weight="800">${fmtCompact(total)}</text>
      </svg>
      <div style="flex:1;min-width:170px;display:flex;flex-direction:column;gap:10px;">
        <div>
          <div style="font-size:.8rem;color:var(--muted);"><i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#30d158;margin-right:6px;"></i>Kas &amp; Dompet (${cashPct}%)</div>
          <strong style="font-size:1.05rem;">${fmtRp(cash)}</strong>
        </div>
        <div>
          <div style="font-size:.8rem;color:var(--muted);"><i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#a78bfa;margin-right:6px;"></i>Portofolio Investasi (${invPct}%)</div>
          <strong style="font-size:1.05rem;">${fmtRp(invest)}</strong>
        </div>
      </div>
    </div>`;
  }

  window.UangiiAnalytics = { render: renderAnalytics };
})();
