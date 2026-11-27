(() => {
  'use strict';

  /**
   * Uangii v1.2.7 Code-Faithful Illustration Engine
   * Reconstructed directly from Uangii Android Jetpack Compose UI & iOS 18 OLED Dark design tokens
   * (Color.kt, UangiiNotchedBottomBar.kt, DashboardScreen.kt, PracticalToolsHubScreen.kt,
   *  AnalysisScreen.kt, InvestmentsScreen.kt, AdvisorChatScreen.kt, UangiiRewindScreen.kt,
   *  NotificationDraftsScreen.kt, ZakatCalculatorScreen.kt, FamilyHubScreen.kt).
   * Purely illustrative demo data — zero personal user data or static raster screenshots.
   */

  const scopeBar = (isFamily) => `
    <div class="us-scope" aria-hidden="true">
      <span class="${!isFamily ? 'is-on' : ''}">
        <svg viewBox="0 0 16 16" class="us-ico"><rect x="2.2" y="2.2" width="11.6" height="11.6" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="6.6" r="1.9" fill="currentColor"/><path d="M4.8 12c.7-1.7 5.7-1.7 6.4 0" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        Pribadi
      </span>
      <span class="${isFamily ? 'is-on is-family' : ''}">
        <svg viewBox="0 0 16 16" class="us-ico"><path d="M2.5 7.4 8 2.8l5.5 4.6v5.8H2.5Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M6.4 13.2V9.4h3.2v3.8" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>
        Keluarga
      </span>
    </div>`;

  const card = (body, cls = '') => `<div class="us-card ${cls}">${body}</div>`;

  const row = (icon, tone, title, sub, val = '', valCls = '') => `
    <div class="us-row">
      <div class="us-row-left">
        <span class="us-row-ic ${tone}">${icon}</span>
        <div class="us-row-txt"><strong>${title}</strong><small>${sub}</small></div>
      </div>
      ${val ? `<b class="us-val ${valCls}">${val}</b>` : '<span class="us-chev">›</span>'}
    </div>`;

  const pill = (text, cls = '') => `<span class="us-pill ${cls}">${text}</span>`;

  // Real UangiiNotchedBottomBar.kt: Beranda · Investasi · [ + ] · Fio · Menu
  const bottomBar = (activeTab) => {
    const item = (idx, label, svg) => `
      <span class="us-nav-item ${activeTab === idx ? 'is-on' : ''}">
        <svg viewBox="0 0 20 20" aria-hidden="true">${svg}</svg>
        <em>${label}</em>
      </span>`;
    return `
      <div class="us-notched-bar" aria-hidden="true">
        <svg class="us-notch-bg" viewBox="0 0 280 54" preserveAspectRatio="none">
          <path d="M0 12 Q0 2 10 2 L98 2 C110 2 114 26 140 26 C166 26 170 2 182 2 L270 2 Q280 2 280 12 L280 54 L0 54 Z"/>
        </svg>
        <div class="us-notch-fab" title="Catat Cepat">
          <svg viewBox="0 0 20 20"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>
        </div>
        <div class="us-nav-grid">
          ${item(0, 'Beranda', '<rect x="3" y="3" width="6" height="6" rx="1.6" fill="currentColor"/><rect x="11" y="3" width="6" height="6" rx="1.6" fill="currentColor" opacity=".7"/><rect x="3" y="11" width="6" height="6" rx="1.6" fill="currentColor" opacity=".7"/><rect x="11" y="11" width="6" height="6" rx="1.6" fill="currentColor" opacity=".45"/>')}
          ${item(1, 'Investasi', '<path d="M3 14.5 7.6 9.8 11 12.6 16.8 5.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 5.5h3.8v3.8" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>')}
          <span class="us-nav-spacer"></span>
          ${item(2, 'Fio', '<path d="M10 2.6 11.9 7.8 17.2 9.6 11.9 11.4 10 16.8 8.1 11.4 2.8 9.6 8.1 7.8Z" fill="currentColor"/>')}
          ${item(3, 'Menu', '<rect x="3" y="4" width="6" height="5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="11" y="4" width="6" height="5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="3" y="11" width="6" height="5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="11" y="11" width="6" height="5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/>')}
        </div>
      </div>`;
  };

  const scenes = {
    personal: {
      label: 'Beranda Pribadi',
      badge: 'BERANDA · OLED DARK',
      description: 'Ringkasan Kekayaan Bersih, Batas Aman Harian sesuai siklus gajian, daftar dompet multi-mata uang, dan navigasi lengkung khas Uangii dengan tombol + melayang.',
      tab: 0,
      screen: '',
      accent: 'mint',
      chips: ['Batas Aman Harian', '4 Tab + Tombol +'],
      art: 'wallet',
      body: `
        ${scopeBar(false)}
        ${card(`
          <div class="us-card-head">
            <small>Total Kekayaan Bersih</small>
            <span class="us-eye" title="Mode Privasi">◉</span>
          </div>
          <strong class="us-hero-num">Rp 28.450.000</strong>
          <div class="us-mini-spark">
            <svg viewBox="0 0 210 34" preserveAspectRatio="none">
              <defs><linearGradient id="spG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#30D158" stop-opacity=".35"/><stop offset="100%" stop-color="#30D158" stop-opacity="0"/></linearGradient></defs>
              <path class="us-area" d="M0 28 C25 25 45 27 70 19 C95 11 120 17 148 11 C172 6 192 9 210 3 L210 34 L0 34Z" fill="url(#spG)"/>
              <path class="us-draw-line" d="M0 28 C25 25 45 27 70 19 C95 11 120 17 148 11 C172 6 192 9 210 3" fill="none" stroke="#30D158" stroke-width="2" stroke-linecap="round"/>
              <circle cx="210" cy="3" r="3" fill="#30D158" class="us-pulse-dot"/>
            </svg>
          </div>
          <div class="us-inout">
            <div><small>Pemasukan</small><b class="c-green">+Rp 9.200.000</b></div>
            <div><small>Pengeluaran</small><b class="c-red">−Rp 3.140.000</b></div>
          </div>
        `, 'us-card-hero')}
        ${card(`
          <div class="us-safe-top">
            <div><small>Batas Aman Harian</small><strong class="us-mid-num">Rp 216.400<small>/hari</small></strong></div>
            ${pill('Aman · 68%', 'p-green')}
          </div>
          <div class="us-bar"><i style="--w:68%"></i></div>
        `)}
        <div class="us-sec-lbl"><span>Dompet &amp; Rekening</span><em>3 Aktif</em></div>
        ${card(`
          ${row('🏦', 't-blue', 'Bank Demo Utama', 'Rekening · IDR', 'Rp 14.120.000')}
          ${row('💳', 't-cyan', 'Dompet Harian', 'E-Wallet · IDR', 'Rp 3.850.000')}
          ${row('📈', 't-mint', 'Kas RDN Investasi', 'Sekuritas · Terpisah', 'Rp 10.480.000', 'c-green')}
        `, 'us-inset')}
      `
    },

    toolsHub: {
      label: 'Tools Uangii (7-in-1)',
      badge: 'TOOLS UANGII · V1.2.7',
      description: 'Tujuh alat bantu keuangan harian di satu hub: Auto-Capture Notifikasi, Split Bill, Mode Trip & Event, Daftar Belanja Cerdas, Brankas Garansi, Kalkulator Zakat, dan Uangii Rewind.',
      tab: 3,
      screen: 'Tools Uangii',
      accent: 'cyan',
      chips: ['7 Alat Bantu Harian', '100% Lokal di HP'],
      art: 'tools',
      body: `
        <div class="us-sub-head">Alat bantu keuangan harian</div>
        ${card(`
          ${row('🔔', 't-mint', 'Catat dari Notifikasi', 'Tarik transaksi bank & e-wallet', '2 Baru', 'c-green')}
          ${row('👥', 't-mint', 'Split Bill & Patungan', 'Bagi tagihan & piutang teman')}
          ${row('✈️', 't-cyan', 'Mode Trip & Event', 'Anggaran liburan & acara', '1 Aktif', 'c-cyan')}
          ${row('🛍️', 't-blue', 'Daftar Belanja Cerdas', 'Cek belanja vs Batas Aman', '4 Item', 'c-blue')}
          ${row('🛡️', 't-amber', 'Brankas Struk & Garansi', 'Simpan struk & masa garansi', '3 Struk', 'c-amber')}
          ${row('🤲', 't-mint', 'Kalkulator Zakat', 'Zakat Mal & Penghasilan')}
          ${row('✨', 't-cyan', 'Uangii Rewind', 'Cerita bulanan siap bagikan', 'Baru', 'c-cyan')}
        `, 'us-inset us-compact-rows')}
      `
    },

    autoCapture: {
      label: 'Auto-Capture Notifikasi',
      badge: 'OPSIONAL · 100% LOKAL',
      description: 'Membaca notifikasi bank/e-wallet yang Anda pilih secara ephemeral di memori perangkat. OTP, PIN, dan promo otomatis dibuang—hanya transaksi sah yang menjadi draf siap konfirmasi.',
      tab: 3,
      screen: 'Catat dari Notifikasi',
      accent: 'mint',
      chips: ['OTP & PIN Dibuang', 'Tanpa Open Banking'],
      art: 'shield',
      body: `
        <div class="us-notif-toast">
          <div class="us-notif-ic">🏦</div>
          <div>
            <strong>Notifikasi Bank Terdeteksi · Lokal</strong>
            <small>"QRIS Rp 42.000 di Kopi Nusantara berhasil"</small>
          </div>
          <span class="us-live-dot"></span>
        </div>
        <div class="us-filter-strip">
          <span>✓ Parser lokal</span>
          <span>✕ OTP/PIN dibuang</span>
          <span>✕ Tanpa server</span>
        </div>
        <div class="us-sec-lbl"><span>Draf Siap Konfirmasi</span><em>2 Pending</em></div>
        ${card(`
          <div class="us-draft-head">
            <div><strong>Kopi Nusantara (QRIS)</strong><small>Makanan &amp; Minuman · Bank Demo</small></div>
            <b class="c-red">−Rp 42.000</b>
          </div>
          <div class="us-draft-actions">
            <span class="us-btn-ok">✓ Catat Transaksi</span>
            <span class="us-btn-no">Abaikan</span>
          </div>
        `, 'us-card-highlight')}
        ${card(`
          <div class="us-draft-head">
            <div><strong>Transfer Masuk Gaji</strong><small>Pemasukan · Bank Demo</small></div>
            <b class="c-green">+Rp 8.500.000</b>
          </div>
          <div class="us-draft-actions">
            <span class="us-btn-ok">✓ Catat Transaksi</span>
            <span class="us-btn-no">Edit</span>
          </div>
        `)}
      `
    },

    rewind: {
      label: 'Uangii Rewind',
      badge: 'CERITA BULANAN',
      description: 'Ringkasan finansial bergaya story bulanan yang merangkum tingkat tabungan, hari paling hemat, ketahanan dana darurat, dan kartu visual siap bagikan dengan opsi sensor nominal.',
      tab: 3,
      screen: 'Uangii Rewind',
      accent: 'cyan',
      chips: ['Mode Sensor Nominal', 'Siap Bagikan'],
      art: 'spark',
      body: `
        <div class="us-rewind-card">
          <div class="us-rewind-top">
            <span>✦ UANGII REWIND</span>
            <em>NOV 2026</em>
          </div>
          <div class="us-rewind-title">Bulan Paling Terkendali</div>
          <div class="us-rewind-ring-wrap">
            <svg class="us-ring-svg" viewBox="0 0 88 88">
              <circle cx="44" cy="44" r="35" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="7"/>
              <circle class="us-ring-arc" cx="44" cy="44" r="35" fill="none" stroke="#30D158" stroke-width="7" stroke-linecap="round" stroke-dasharray="220" stroke-dashoffset="52" transform="rotate(-90 44 44)"/>
            </svg>
            <div class="us-ring-center"><strong>34%</strong><small>Saving Rate</small></div>
          </div>
          <div class="us-rewind-grid">
            <div><small>Runway Darurat</small><b>5,8 Bulan</b></div>
            <div><small>Hari Hemat</small><b>19 Hari</b></div>
          </div>
          <div class="us-rewind-share">
            <span>🔒 Sensor Nominal</span>
            <span class="us-share-btn">↗ Bagikan Story</span>
          </div>
        </div>
      `
    },

    analytics: {
      label: 'Analitik Visual',
      badge: 'SANKEY · WATERFALL · RUNWAY',
      description: 'Delapan sub-layar analitik mendalam: Sankey Cash Flow, Cash Flow Waterfall, Emergency Runway Gauge, Debt Payoff Mountain, Skor Kesehatan 50/30/20, Kalender Kas, dan Ekspor PDF/CSV.',
      tab: 3,
      screen: 'Analisa Finansial',
      accent: 'blue',
      chips: ['Sankey & Waterfall', 'Emergency Runway'],
      art: 'chart',
      body: `
        ${card(`
          <div class="us-card-head"><small>Aliran Kas (Sankey)</small>${pill('Surplus +34%', 'p-green')}</div>
          <svg class="us-sankey" viewBox="0 0 240 84" aria-hidden="true">
            <rect x="2" y="8" width="10" height="68" rx="3" fill="#30D158"/>
            <path class="us-flow-path" d="M12 22 C85 22 140 16 226 16" fill="none" stroke="#30D158" stroke-width="14" stroke-opacity=".42"/>
            <path class="us-flow-dash" d="M12 22 C85 22 140 16 226 16" fill="none" stroke="#30D158" stroke-width="2" stroke-dasharray="5 7"/>
            <path class="us-flow-path" d="M12 46 C90 46 140 44 226 44" fill="none" stroke="#06B6D4" stroke-width="11" stroke-opacity=".42"/>
            <path class="us-flow-dash" d="M12 46 C90 46 140 44 226 44" fill="none" stroke="#06B6D4" stroke-width="2" stroke-dasharray="5 7"/>
            <path class="us-flow-path" d="M12 65 C90 65 145 70 226 70" fill="none" stroke="#FF9F0A" stroke-width="8" stroke-opacity=".45"/>
            <rect x="226" y="7" width="10" height="19" rx="3" fill="#30D158"/>
            <rect x="226" y="36" width="10" height="16" rx="3" fill="#06B6D4"/>
            <rect x="226" y="63" width="10" height="14" rx="3" fill="#FF9F0A"/>
          </svg>
          <div class="us-legend"><span>● Tabungan 34%</span><span>● Kebutuhan 46%</span><span>● Gaya Hidup 20%</span></div>
        `)}
        <div class="us-two-mini">
          ${card(`
            <small>Skor Kesehatan</small>
            <strong class="c-green us-big-stat">86<small>/100</small></strong>
            <div class="us-bar"><i style="--w:86%"></i></div>
          `)}
          ${card(`
            <small>Emergency Runway</small>
            <strong class="c-cyan us-big-stat">5,8<small> bln</small></strong>
            <div class="us-bar us-bar-cyan"><i style="--w:78%"></i></div>
          `)}
        </div>
        ${card(`
          <div class="us-card-head"><small>Cash Flow Waterfall</small><small>Nov</small></div>
          <div class="us-waterfall">
            <span style="--h:88%;--c:#30D158"><i>Masuk</i></span>
            <span style="--h:54%;--c:#FF453A"><i>Wajib</i></span>
            <span style="--h:24%;--c:#FF9F0A"><i>Ingin</i></span>
            <span style="--h:36%;--c:#06B6D4"><i>Invest</i></span>
            <span style="--h:48%;--c:#30D158"><i>Sisa</i></span>
          </div>
        `)}
      `
    },

    investments: {
      label: 'Investasi & RDN',
      badge: 'PORTOFOLIO MULTI-ASET',
      description: 'Kelola Saham IHSG/Global, Reksa Dana, Kripto, dan Emas dalam satu tampilan. Saldo Kas RDN otomatis mengikuti transaksi beli/jual, lengkap dengan Average Cost, Floating P/L, Realized Gain, dan Dividen.',
      tab: 1,
      screen: 'Investasi & RDN',
      accent: 'mint',
      chips: ['4 Kelas Aset', 'RDN Terhubung'],
      art: 'chart',
      body: `
        ${card(`
          <div class="us-card-head"><small>Total Nilai Portofolio</small>${pill('Floating +8,4%', 'p-green')}</div>
          <strong class="us-hero-num">Rp 18.750.000</strong>
          <div class="us-alloc-bar">
            <i style="width:36%;background:#30D158"></i>
            <i style="width:26%;background:#FF9F0A"></i>
            <i style="width:22%;background:#06B6D4"></i>
            <i style="width:16%;background:#0A84FF"></i>
          </div>
          <div class="us-legend"><span>● Saham 36%</span><span>● Emas 26%</span><span>● Reksadana 22%</span><span>● Kripto 16%</span></div>
        `, 'us-card-hero')}
        <div class="us-two-mini">
          ${card('<small>Kas RDN</small><strong class="c-cyan">Rp 2.450.000</strong><small>Auto-sinkron</small>')}
          ${card('<small>Realized + Dividen</small><strong class="c-green">+Rp 1.750.000</strong><small>Historis tercatat</small>')}
        </div>
        ${card(`
          ${row('📊', 't-mint', 'Saham Demo BBCA', 'Avg Rp 9.450 · 7 Lot', 'Rp 6.750.000', 'c-green')}
          ${row('🪙', 't-amber', 'Emas Antam Digital', 'Logam Mulia · 3,2 gr', 'Rp 4.875.000', 'c-green')}
          ${row('💎', 't-blue', 'Reksadana Pasar Uang', 'Unit 2.310 · Manual', 'Rp 4.125.000')}
        `, 'us-inset')}
      `
    },

    fio: {
      label: 'Fio AI Companion',
      badge: 'OFFLINE & GEMINI CLOUD',
      description: 'Catat transaksi lewat teks atau suara, pindai struk belanja, atau tanyakan kondisi keuanganmu. Pilih mode bawaan 100% offline di perangkat atau Gemini Cloud dengan penyaringan PII.',
      tab: 2,
      screen: 'Fio AI',
      accent: 'mint',
      chips: ['Mode Offline & Cloud', 'Usulan Transaksi'],
      art: 'spark',
      body: `
        <div class="us-fio-modes">
          <span class="is-on">● Offline Lokal</span>
          <span>✦ Gemini Cloud</span>
        </div>
        <div class="us-chat-q">Beli kopi 28rb dan bensin 100rb pakai BCA</div>
        ${card(`
          <div class="us-fio-head"><span>✦</span><strong>Fio menyiapkan 2 draf transaksi</strong></div>
          ${row('☕', 't-amber', 'Kopi', 'Makanan & Minuman · BCA', '−Rp 28.000', 'c-red')}
          ${row('⛽', 't-blue', 'Bensin', 'Transportasi · BCA', '−Rp 100.000', 'c-red')}
          <div class="us-draft-actions">
            <span class="us-btn-ok">✓ Simpan Semua</span>
            <span class="us-btn-no">Ubah</span>
          </div>
        `, 'us-card-highlight')}
        <div class="us-fio-input"><span>Tanya Fio atau ucapkan transaksi…</span><b>🎙</b></div>
      `
    },

    transactions: {
      label: 'Transaksi & Struk',
      badge: 'DOUBLE-ENTRY LEDGER',
      description: 'Pencatatan atomik berbasis buku besar dengan filter tanggal, kategori, dompet, dan pencarian instan. Dilengkapi pemindai struk dan brankas foto garansi.',
      tab: 0,
      screen: 'Transaksi',
      accent: 'mint',
      chips: ['Filter Multi-Dimensi', 'Pindai Struk'],
      art: 'ledger',
      body: `
        <div class="us-search-mock">🔍 Cari merchant, catatan, nominal…</div>
        <div class="us-chip-strip">
          <span class="is-on">Siklus Ini</span><span>Pengeluaran</span><span>Transfer</span>
        </div>
        <div class="us-sec-lbl"><span>Hari Ini</span><em>Net −Rp 181.000</em></div>
        ${card(`
          ${row('🍜', 't-amber', 'Makan Siang', 'Makanan · Bank Demo', '−Rp 48.000', 'c-red')}
          ${row('🛵', 't-blue', 'Ojek Online', 'Transportasi · E-Wallet', '−Rp 33.000', 'c-red')}
          ${row('⚡', 't-red', 'Token Listrik', 'Tagihan · Bank Demo', '−Rp 100.000', 'c-red')}
          ${row('🔄', 't-cyan', 'Setor Dana Darurat', 'Transfer Antardompet', 'Rp 1.500.000', 'c-cyan')}
        `, 'us-inset')}
      `
    },

    zakat: {
      label: 'Zakat & Alat Praktis',
      badge: 'ZAKAT · SPLIT BILL · TRIP',
      description: 'Hitung estimasi Zakat Mal & Penghasilan berdasarkan acuan Nisab 85 gram emas (bukan fatwa mengikat), atur patungan Split Bill, hingga cek Daftar Belanja terhadap Batas Aman.',
      tab: 3,
      screen: 'Kalkulator Zakat',
      accent: 'mint',
      chips: ['Nisab 85 gr Emas', 'Acuan Umum BAZNAS'],
      art: 'coin',
      body: `
        <div class="us-fio-modes">
          <span class="is-on">Zakat Penghasilan</span>
          <span>Zakat Mal</span>
        </div>
        ${card(`
          <small>Estimasi Nisab Bulanan (85 gr ÷ 12)</small>
          <strong class="us-mid-num">Rp 9.562.500</strong>
          <div class="us-zakat-status">✓ Mencapai Nisab · Tarif 2,5%</div>
        `)}
        ${card(`
          <div class="us-card-head"><small>Estimasi Zakat Bulanan</small>${pill('Referensi', 'p-cyan')}</div>
          <strong class="us-hero-num c-green">Rp 250.000</strong>
          <small>Dapat dicatat langsung ke kategori Sedekah/Zakat.</small>
        `, 'us-card-hero')}
        ${card(`
          ${row('👥', 't-mint', 'Split Bill Makan Tim', '3 orang · Rp 115.000/org', 'Lunas 2/3', 'c-amber')}
          ${row('✈️', 't-cyan', 'Trip Yogyakarta 3H2M', 'Terpakai 62% anggaran', 'Sisa Rp 1,1 jt', 'c-cyan')}
        `, 'us-inset')}
      `
    },

    family: {
      label: 'Beranda Keluarga',
      badge: 'RUANG KELUARGA · VIP',
      description: 'Pisahkan pembukuan rumah tangga dari dompet pribadi. Setor kas keluarga, pantau arus kas bersama, dan sinkronkan antarperangkat hingga 4 anggota.',
      tab: 0,
      screen: '',
      accent: 'cyan',
      chips: ['Kas Bersama', 'Sinkron Realtime'],
      art: 'home',
      body: `
        ${scopeBar(true)}
        <div class="us-sync-line"><span class="us-live-dot"></span> Tersinkron · Ruang Keluarga Demo</div>
        ${card(`
          <small>Saldo Kas Rumah Tangga</small>
          <strong class="us-hero-num">Rp 4.850.000</strong>
          <div class="us-draft-actions">
            <span class="us-btn-ok">+ Setor Kas</span>
            <span class="us-btn-no">Kelola Ruang</span>
          </div>
        `, 'us-card-cyan')}
        ${card(`
          <div class="us-inout">
            <div><small>Setoran Masuk</small><b class="c-green">+Rp 6.500.000</b></div>
            <div><small>Belanja Rumah</small><b class="c-red">−Rp 1.650.000</b></div>
          </div>
        `)}
        ${card(`
          ${row('🏠', 't-cyan', 'Setoran Kas Bulanan', 'Host Demo · Transfer Kas', '+Rp 3.500.000', 'c-green')}
          ${row('🛒', 't-amber', 'Belanja Bulanan', 'Anggota · Kas Rumah', '−Rp 840.000', 'c-red')}
        `, 'us-inset')}
      `
    },

    members: {
      label: 'Anggota & Privasi',
      badge: '1 HOST + 3 ANGGOTA',
      description: 'Undang anggota dengan QR atau kode, atur peran Dewasa atau Anak dengan peringatan batas mingguan lunak, dan tentukan level berbagi tiap dompet pribadi: PRIVATE, SUMMARY, atau FULL.',
      tab: 3,
      screen: 'Ruang Keluarga',
      accent: 'cyan',
      chips: ['Maks 4 Akun', 'PRIVATE / SUMMARY / FULL'],
      art: 'home',
      body: `
        ${card(`
          <div class="us-card-head"><strong>Anggota Ruang · 3/4</strong>${pill('+ Undang QR', 'p-cyan')}</div>
          ${row('👑', 't-mint', 'Fikri (Host)', 'Pengelola · Family VIP', 'Host', 'c-green')}
          ${row('🧑', 't-cyan', 'Nia', 'Anggota Dewasa · Hak Turunan', 'Dewasa', 'c-cyan')}
          ${row('🎒', 't-amber', 'Raka', 'Peran Anak · Peringatan Mingguan', 'Anak', 'c-amber')}
        `, 'us-inset')}
        <div class="us-sec-lbl"><span>Kontrol Berbagi Dompet</span><em>Granular</em></div>
        ${card(`
          ${row('🔒', 't-red', 'Tabungan Pribadi', 'Tidak terlihat anggota lain', 'PRIVATE')}
          ${row('📊', 't-amber', 'Rekening Gaji', 'Hanya ringkasan saldo', 'SUMMARY', 'c-amber')}
          ${row('🤝', 't-mint', 'Kas Rumah', 'Rincian penuh bersama', 'FULL', 'c-green')}
        `, 'us-inset')}
      `
    },

    exchange: {
      label: 'Kurs & Multi-Mata Uang',
      badge: 'MULTI-CURRENCY SNAPSHOT',
      description: 'Simpan dompet dalam berbagai mata uang (IDR, USD, SGD, JPY, EUR) dengan snapshot kurs pada setiap transaksi dan kalkulator konversi bawaan.',
      tab: 0,
      screen: 'Kurs Mata Uang',
      accent: 'mint',
      chips: ['Snapshot Kurs', 'Multi-Dompet'],
      art: 'coin',
      body: `
        ${card(`
          <small>Kalkulator Konversi · Ilustrasi</small>
          <div class="us-fx-row"><span>🇺🇸 USD</span><strong>100,00</strong></div>
          <div class="us-fx-arrow">⇅</div>
          <div class="us-fx-row is-res"><span>🇮🇩 IDR</span><strong class="c-green">Rp 1.620.000</strong></div>
          <small>Kurs contoh · edit manual tersedia</small>
        `, 'us-card-hero')}
        ${card(`
          ${row('🇸🇬', 't-cyan', 'SGD → IDR', 'Snapshot dompet SGD', 'Rp 12.150')}
          ${row('🇯🇵', 't-blue', 'JPY → IDR', 'Mode Trip Jepang', 'Rp 106')}
          ${row('🇪🇺', 't-mint', 'EUR → IDR', 'Rekening valas', 'Rp 17.540')}
        `, 'us-inset')}
      `
    }
  };

  const artGlyphs = {
    wallet: '<path d="M8 31 38 18l30 13-30 14z"/><path d="M8 31v24l30 14V45z"/><path d="M38 45l30-14v24L38 69z"/><path class="us-object-mark" d="m47 51 13-6v6l-13 6z"/>',
    home: '<path d="m11 34 25-21 30 16-24 22z"/><path d="m16 37 26 14v22L16 59z"/><path d="m42 51 19-17v24L42 73z"/><path class="us-object-mark" d="m25 50 9 5v11l-9-5z"/>',
    ledger: '<path d="m12 29 37-15 17 10-36 16z"/><path d="m12 29 18 11v30L12 59z"/><path d="m30 40 36-16v30L30 70z"/><path class="us-object-mark" d="m37 48 22-10m-22 17 22-10m-22 17 16-7"/>',
    chart: '<path d="M9 32 44 16l22 12-35 16z"/><path d="M9 32 31 44v25L9 57z"/><path d="m31 44 35-16v25L31 69z"/><path class="us-object-mark" d="m37 60 8-12 6 2 9-12"/>',
    coin: '<ellipse cx="38" cy="39" rx="27" ry="16"/><path d="M11 39v10c0 9 12 16 27 16s27-7 27-16V39c0 9-12 16-27 16S11 48 11 39z"/><path class="us-object-mark" d="m28 40 20-5m-14-4-6 9 9 4"/>',
    spark: '<path d="m37 12 21 14 8 24-28 21-25-15 2-28z"/><path d="m37 12 1 59m-23-42 51 21m-53 7 45-31"/><path class="us-object-mark" d="m38 27 3 10 10 3-10 4-3 10-4-10-10-4 10-3z"/>',
    tools: '<rect x="14" y="16" width="21" height="21" rx="6"/><rect x="41" y="16" width="21" height="21" rx="6"/><rect x="14" y="43" width="21" height="21" rx="6"/><rect x="41" y="43" width="21" height="21" rx="6"/><path class="us-object-mark" d="M21 26.5h7m-3.5-3.5v7M48 26.5l3 3 5-6"/>',
    shield: '<path d="M38 12 62 21v18c0 16-10 26-24 31C24 65 14 55 14 39V21Z"/><path class="us-object-mark" d="m28 40 7 7 14-15"/>'
  };

  function renderPhoneStage(key, compact = false) {
    const s = scenes[key];
    if (!s) return '';
    return `
      <div class="us-stage us-tone-${s.accent} ${compact ? 'us-stage--compact' : ''}" role="img" aria-label="Ilustrasi layar ${s.label} Uangii. ${s.description}">
        <div class="us-orbit" aria-hidden="true"></div>
        <div class="us-orbit us-orbit--2" aria-hidden="true"></div>
        ${compact ? '' : `
          <div class="us-float us-float--top" aria-hidden="true">
            <svg viewBox="0 0 76 80">${artGlyphs[s.art] || artGlyphs.wallet}</svg>
            <span>${s.chips[0]}</span>
          </div>
          <div class="us-float us-float--bottom" aria-hidden="true">
            <i class="us-live-dot"></i>
            <span>${s.chips[1]}</span>
          </div>
        `}
        <div class="us-device" data-phone-tilt aria-hidden="true">
          <div class="us-notch-speaker"></div>
          <div class="us-screen">
            <div class="us-status"><span>09:41</span><span class="us-status-ic">5G ▮▮▮ 🔋</span></div>
            <div class="us-appbar">
              ${s.screen
                ? `<span class="us-back-ic">‹</span><strong>${s.screen}</strong><span class="us-ver-chip">v1.2.7</span>`
                : `<img src="assets/brand/uangii-icon.webp" width="24" height="24" alt=""><strong>uangii<em class="c-green">.</em></strong><span class="us-quick">✦ Fio Cepat</span>`}
            </div>
            <div class="us-screen-body">${s.body}</div>
            ${bottomBar(s.tab)}
          </div>
        </div>
      </div>`;
  }

  // Rich code-based vector/UI canvases replacing legacy static raster photos
  const canvases = {
    ecosystem: () => `
      <div class="uc-canvas uc-ecosystem" role="img" aria-label="Diagram interaktif ekosistem Uangii v1.2.7: Dompet Multi-Mata Uang, Tools Uangii 7-in-1, Investasi dan RDN, Fio AI, serta Ruang Keluarga.">
        <svg class="uc-links" viewBox="0 0 560 310" preserveAspectRatio="none" aria-hidden="true">
          <path class="uc-beam" d="M140 80 C210 80 220 155 280 155"/>
          <path class="uc-beam uc-beam--2" d="M140 230 C210 230 220 155 280 155"/>
          <path class="uc-beam uc-beam--3" d="M420 80 C350 80 340 155 280 155"/>
          <path class="uc-beam uc-beam--4" d="M420 230 C350 230 340 155 280 155"/>
        </svg>
        <div class="uc-node uc-n1">
          <span class="uc-badge">LEDGER ATOMIK</span>
          <strong>Multi-Dompet &amp; Kurs</strong>
          <small>IDR · USD · SGD · Batas Aman</small>
        </div>
        <div class="uc-node uc-n2">
          <span class="uc-badge c-cyan">7 TOOLS HARIAN</span>
          <strong>Notifikasi, Zakat, Rewind</strong>
          <small>Split Bill · Trip · Garansi</small>
        </div>
        <div class="uc-core">
          <div class="uc-core-ring"></div>
          <img src="assets/brand/uangii-icon.webp" width="44" height="44" alt="">
          <strong>Uangii 1.2.7</strong>
          <small>SQLCipher Core</small>
        </div>
        <div class="uc-node uc-n3">
          <span class="uc-badge">PORTOFOLIO</span>
          <strong>Investasi &amp; RDN</strong>
          <small>Saham · Emas · Reksadana · Kripto</small>
        </div>
        <div class="uc-node uc-n4">
          <span class="uc-badge c-cyan">OPSIONAL CLOUD</span>
          <strong>Fio AI &amp; Keluarga</strong>
          <small>4 Akun · Drive AES-256-GCM</small>
        </div>
      </div>`,

    vault: () => `
      <div class="uc-canvas uc-vault" role="img" aria-label="Ilustrasi arsitektur keamanan berlapis Uangii: BiometricPrompt, SQLCipher AES-256 lokal, Filter Notifikasi Ephemeral, dan Cadangan Drive AES-256-GCM.">
        <div class="uc-radar"><i></i><i></i><i></i></div>
        <div class="uc-vault-core">
          <svg viewBox="0 0 64 64" class="uc-shield-svg" aria-hidden="true">
            <path d="M32 6 54 14v16c0 14-9 23-22 28C19 53 10 44 10 30V14Z" fill="rgba(48,209,88,.14)" stroke="#30D158" stroke-width="2.2"/>
            <rect x="23" y="29" width="18" height="14" rx="4" fill="#0B1912" stroke="#b7f58a" stroke-width="2"/>
            <path d="M27 29v-4a5 5 0 0 1 10 0v4" fill="none" stroke="#b7f58a" stroke-width="2" stroke-linecap="round"/>
            <circle cx="32" cy="36" r="2" fill="#30D158"/>
          </svg>
          <strong>SQLCipher AES-256</strong>
          <small>Keystore Perangkat</small>
        </div>
        <div class="uc-vchip uc-v1"><span>🔐</span><div><b>Biometrik &amp; PIN</b><small>Android Keyguard</small></div></div>
        <div class="uc-vchip uc-v2"><span>🔔</span><div><b>Auto-Capture Lokal</b><small>OTP &amp; PIN dibuang</small></div></div>
        <div class="uc-vchip uc-v3"><span>☁️</span><div><b>Drive AES-256-GCM</b><small>PBKDF2 · Sandi Brankas</small></div></div>
        <div class="uc-vchip uc-v4"><span>🧼</span><div><b>PII Masking Fio</b><small>Konteks cloud terkendali</small></div></div>
      </div>`
  };

  // Mount single scenes
  document.querySelectorAll('[data-app-scene]').forEach(el => {
    const key = el.dataset.appScene;
    const compact = el.hasAttribute('data-scene-compact');
    if (scenes[key]) el.innerHTML = renderPhoneStage(key, compact);
  });

  // Mount vector UI canvases
  document.querySelectorAll('[data-app-canvas]').forEach(el => {
    const key = el.dataset.appCanvas;
    if (canvases[key]) el.innerHTML = canvases[key]();
  });

  // Mount interactive tours with smooth transition + optional autoplay indicator
  document.querySelectorAll('[data-app-tour]').forEach(tour => {
    const keys = tour.dataset.appTour.split(/\s+/).filter(k => scenes[k]);
    if (!keys.length) return;
    const view = tour.querySelector('[data-tour-view]');
    const summary = tour.querySelector('[data-tour-summary]');
    const controls = tour.querySelector('[data-tour-controls]');
    if (!view || !summary || !controls) return;

    controls.innerHTML = '';
    const buttons = keys.map(key => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'us-select';
      btn.textContent = scenes[key].label;
      btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', () => show(key, true));
      controls.append(btn);
      return btn;
    });

    function show(key, animate = false) {
      const s = scenes[key];
      buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(keys[i] === key)));
      view.innerHTML = renderPhoneStage(key, false);
      summary.querySelector('small').textContent = s.badge;
      summary.querySelector('h3').textContent = s.label;
      summary.querySelector('p').textContent = s.description;
      if (animate && !document.body.classList.contains('u-motion-paused')) {
        view.classList.remove('is-switching');
        summary.classList.remove('is-popping');
        void view.offsetWidth;
        view.classList.add('is-switching');
        summary.classList.add('is-popping');
      }
    }

    show(keys[0], false);
    controls.hidden = false;
  });

  // Interactive gallery lightbox for code-based app cards (replacing old Play Store PNG lightbox)
  const galleryDialog = document.getElementById('codeShowcaseDialog');
  if (galleryDialog) {
    const dialogMount = galleryDialog.querySelector('[data-dialog-scene]');
    const dialogTitle = galleryDialog.querySelector('[data-dialog-title]');
    const dialogDesc = galleryDialog.querySelector('[data-dialog-desc]');
    document.querySelectorAll('[data-open-scene]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.openScene;
        const s = scenes[key];
        if (!s || !dialogMount) return;
        dialogMount.innerHTML = renderPhoneStage(key, false);
        if (dialogTitle) dialogTitle.textContent = s.label;
        if (dialogDesc) dialogDesc.textContent = s.description;
        if (typeof galleryDialog.showModal === 'function') galleryDialog.showModal();
      });
    });
    galleryDialog.addEventListener('click', (e) => {
      if (e.target === galleryDialog) galleryDialog.close();
    });
  }

  // Expose helper for programmatic tour jumping
  window.UangiiScenes = { renderPhoneStage, scenes };
})();
