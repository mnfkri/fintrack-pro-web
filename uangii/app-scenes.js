(() => {
  'use strict';
  // Recreated illustrations. No original screenshot, account name, or identifier is embedded.
  const scope = family => '<div class="us-scope"><span class="'+(!family?'is-on':'')+'">▣ Pribadi</span><span class="'+(family?'is-on is-family':'')+'">◇ Keluarga</span></div>';
  const panel = (body, tone='') => '<div class="us-panel '+tone+'">'+body+'</div>';
  const row = (title, detail, value='', tone='') => '<div class="us-row"><div><strong>'+title+'</strong><small>'+detail+'</small></div>'+(value?'<b class="'+tone+'">'+value+'</b>':'')+'</div>';
  const total = (label, amount) => '<small>'+label+'</small><strong class="us-amount">'+amount+'</strong>';
  const pair = (a,b) => '<div class="us-pair"><div><small>Pemasukan</small><b class="us-positive">'+a+'</b></div><div><small>Pengeluaran</small><b class="us-negative">'+b+'</b></div></div>';
  const tag = text => '<span class="us-tag">'+text+'</span>';
  const actions = (a,b) => '<div class="us-pair us-choices"><span>'+a+'</span><span>'+b+'</span></div>';
  const scenes = {
    personal: {label:'Beranda Pribadi', badge:'RUANG PRIBADI', description:'Ringkasan kekayaan bersih, pemasukan dan pengeluaran, dompet, serta batas belanja harian.',tab:0,screen:'',art:'wallet', chips:['Dompet pribadi','Batas harian'], body:
      scope(false)+panel(total('Total Kekayaan Bersih · Pribadi','Rp 26.255.000')+pair('Rp 8.500.000','Rp 2.860.000'),'us-green')+
      '<strong>Dompet &amp; Rekening</strong>'+panel(row('Demo Bank','Rekening · Pribadi','Rp 11.340.000')+row('Dompet Demo','Rekening · Pribadi','Rp 4.600.000'))+
      panel(total('Batas Aman Harian','Rp 188.182')+'<small>Sisa harian berdasarkan siklus gajian</small>')},
    family: {label:'Beranda Keluarga', badge:'RUANG KELUARGA', description:'Beralih ke kas keluarga untuk melihat saldo bersama, status sinkronisasi, dan akses ke Setor kas.',tab:0,screen:'',art:'home',chips:['Kas Rumah','Tersinkron'],body:
      scope(true)+'<small class="us-positive">● Tersinkron</small>'+panel(total('Kas Rumah · Keluarga Demo','Rp 600.000')+'<small>Dompet keluarga dan dompet pribadi yang dibagikan.</small>'+actions('Setor kas','Kelola keluarga'),'us-cyan')+
      panel('<small>Siklus November</small>'+pair('Rp 600.000','Rp 0'))+panel(total('Batas harian','Rp 27.273')+'<small>Contoh jatah belanja keluarga</small>')},
    familyTransactions: {label:'Transaksi Keluarga', badge:'KAS BERSAMA', description:'Setoran tampil sebagai transfer kas keluarga. Dalam contoh ini, dua setoran membentuk saldo kas Rp600.000.',tab:2,screen:'Transaksi',art:'ledger',chips:['2 setoran','Transfer kas'],body:
      scope(true)+panel('<small>Cari transaksi, merchant, catatan…</small>')+tag('Bulan ini · Semua kategori')+'<small>2 Transaksi Ditemukan · Net: Rp 0</small>'+
      panel(row('Setoran Kas Rumah Tangga','Anggota demo · Transfer Kas Keluarga','Rp 100.000','us-amber')+row('Setoran Kas Rumah Tangga','Anggota demo · Transfer Kas Keluarga','Rp 500.000','us-amber'))},
    members: {label:'Kelola Keluarga', badge:'ANGGOTA & PRIVASI', description:'Host bisa mengundang anggota lewat QR atau kode, melihat kapasitas ruang, dan mengatur privasi dompet.',tab:4,screen:'Ruang keluarga',art:'home',chips:['2 / 4 anggota','Privasi dompet'],body:
      '<small>Tidak ada antrean sync</small>'+panel('<strong>Keluarga Demo</strong><small>Ruang kas bersama keluarga</small>'+actions('+ Catat kas','+ Undang'))+
      panel('<strong>Anggota · 2/4</strong>'+row('Host Demo','Pengelola keluarga','Host','us-positive')+row('Anggota Demo','Anggota dewasa','Dewasa'))+
      panel(row('Privasi dompet','Atur apa yang dilihat anggota','›'))},
    exchange: {label:'Kurs & Konversi', badge:'MULTI-MATA UANG', description:'Kalkulator membantu mengonversi antarmata uang. Nilai tukar di sini adalah ilustrasi, bukan kurs saat ini.',tab:0,screen:'Kurs Mata Uang Asing',art:'coin',chips:['USD → IDR','Kurs contoh'],body:
      panel('<strong>Nilai tukar</strong><small>Contoh tampilan pembaruan kurs</small>'+tag('Perbarui'))+
      panel('<strong>Kalkulator Konversi Kurs</strong><small>Jumlah yang dikonversi</small><div class="us-field">1</div>'+actions('USD','IDR')+total('$1 USD ≈','Rp 18.102')+'<small>Angka ilustrasi · bukan kurs saat ini</small>','us-green')+
      panel(row('Daftar nilai tukar','Ketuk untuk edit manual'))},
    trend: {label:'Tren & Grafik Kas', badge:'ANALISIS KAS', description:'Target saldo akhir membantu meninjau batas harian. Grafik memperlihatkan contoh pertumbuhan total aset.',tab:4,screen:'Tren & Grafik Kas',art:'chart',chips:['Target saldo akhir','Tren aset'],body:
      '<small>Grafik saldo &amp; prakiraan kas</small>'+scope(false)+panel(row('Pasang Target Saldo Akhir','Hitung batas harian untuk target kas'))+
      panel(total('Pertumbuhan Total Aset','Rp 26.255.000')+'<small>Contoh perkembangan sepanjang tahun</small><svg class="us-chart" viewBox="0 0 240 104" aria-hidden="true"><path d="M0 24h240M0 58h240M0 93h240" fill="none" stroke="#34433f"/><path d="M0 93h155V66l7 4 10-3 12 4V45l12 6 12-3 12 6V22l10 6 10-3v68Z" fill="#00bbd524"/><path d="M0 93h155V66l7 4 10-3 12 4V45l12 6 12-3 12 6V22l10 6 10-3" fill="none" stroke="#40cce3" stroke-width="2.5"/></svg><small>Januari → November · Data ilustrasi</small>')},
    fio: {label:'Fio Offline', badge:'ASISTEN DI PERANGKAT', description:'Fio dalam mode offline menampilkan contoh perhitungan kekayaan bersih dari aset dan kewajiban.',tab:3,screen:'Fio AI',art:'spark',chips:['Mode Offline','Kekayaan bersih'],body:
      tag('● Offline')+'<div class="us-question">Berapa total kekayaan bersih saya?</div>'+
      panel(total('Kalkulasi Kekayaan Bersih','Rp 26.255.000')+row('Kas &amp; saldo dompet','Aset','Rp 17.520.000')+row('Portofolio investasi','Aset','Rp 8.735.000')+row('Piutang dan kewajiban','Dalam contoh ini','Rp 0')+'<small>Jawaban bersifat informatif.</small>')+tag('Tanya Fio atau catat transaksi…')},
    transactions: {label:'Transaksi Pribadi', badge:'CATATAN HARIAN', description:'Cari catatan dan saring daftar pribadi. Pemasukan, pengeluaran, dan transfer dibedakan.',tab:2,screen:'Transaksi',art:'ledger',chips:['Pencarian & filter','Catatan pribadi'],body:
      scope(false)+panel('<small>Cari transaksi, merchant, catatan…</small>')+tag('Bulan ini · Semua kategori')+'<small>Contoh riwayat transaksi pribadi</small>'+
      panel(row('Kopi akhir pekan','Makanan &amp; Minuman','−Rp 48.000','us-negative')+row('Ojek pulang','Transportasi','−Rp 33.000','us-negative')+row('Sisihkan dana darurat','Transfer antardompet','Rp 1.500.000','us-amber')+row('Bayar internet','Tagihan','−Rp 310.000','us-negative'))},
    investments: {label:'Investasi & RDN', badge:'PORTOFOLIO', description:'Lihat alokasi emas, kripto, reksa dana, dan saham. Kas RDN dipisahkan dari uang belanja, dengan harga aset yang diinput manual.',tab:1,screen:'Daftar Aset Investasi',art:'chart',chips:['4 kelas aset','Kas Investasi & RDN'],body:
      panel(total('Total Nilai Portofolio','Rp 8.735.000')+tag('4 aset aktif · Floating +1,0%')+'<small>Alokasi aset portofolio</small><div class="us-allocation"></div><small>Emas 35% · Kripto 31% · Reksa dana 18% · Saham 16%</small>','us-green')+
      panel(row('Kas Investasi &amp; RDN','Pisahkan kas trading dari uang belanja','Rp 0'))+
      panel('<strong>Aset Saya</strong><small>Harga aset diinput manual</small>'+row('Demo Emas Digital','Emas · 2 gram','Rp 3.100.000')+row('Demo Kripto','Aset kripto','Rp 2.700.000'))}
  };
  const labels = ['Beranda','Investasi','Transaksi','Fio','Menu'];
  const icons = ['▦','◒','▤','✦','◇'];
  const art = {
    wallet:'<path d="M6 33 36 20l32 13-31 14z"/><path d="M6 33v23l31 14V47z"/><path d="M37 47l31-14v23L37 70z"/><path class="us-object-mark" d="m46 53 14-6v6l-14 6z"/>',
    home:'<path d="m11 34 24-21 31 16-23 22z"/><path d="m16 37 27 14v22L16 59z"/><path d="m43 51 18-17v24L43 73z"/><path class="us-object-mark" d="m25 50 9 5v11l-9-5z"/>',
    ledger:'<path d="m12 29 37-15 17 10-36 16z"/><path d="m12 29 18 11v30L12 59z"/><path d="m30 40 36-16v30L30 70z"/><path class="us-object-mark" d="m37 48 22-10m-22 17 22-10m-22 17 16-7"/>',
    chart:'<path d="M9 32 44 16l22 12-35 16z"/><path d="M9 32 31 44v25L9 57z"/><path d="m31 44 35-16v25L31 69z"/><path class="us-object-mark" d="m37 60 8-12 6 2 9-12"/>',
    coin:'<ellipse cx="36" cy="40" rx="28" ry="17"/><path d="M8 40v10c0 9 13 17 28 17s28-8 28-17V40c0 9-13 17-28 17S8 49 8 40z"/><path class="us-object-mark" d="m27 41 20-5m-14-4-6 9 9 4"/>',
    spark:'<path d="m35 12 22 14 8 24-28 22-26-15 2-28z"/><path d="m35 12 2 60m-24-43 52 21m-54 7 46-31"/><path class="us-object-mark" d="m37 27 3 10 10 3-10 4-3 10-4-10-10-4 10-3z"/>'
  };
  function stage(key) {
    const s = scenes[key];
    const nav = labels.map((label,i)=>'<span'+(i===s.tab?' class="is-on"':'')+'><b>'+icons[i]+'</b>'+label+'</span>').join('');
    return '<div class="us-stage" role="img" aria-label="Ilustrasi '+s.label+'. '+s.description+'"><div class="us-orbit" aria-hidden="true"></div><div class="us-float us-float--top" aria-hidden="true"><svg viewBox="0 0 76 80">'+art[s.art]+'</svg><span>'+s.chips[0]+'</span></div><div class="us-float us-float--bottom" aria-hidden="true">'+s.chips[1]+'</div><div class="us-device" aria-hidden="true"><div class="us-screen"><div class="us-status"><span>08:20</span><span>▮▮▮ ▰</span></div><div class="us-appbar">'+(s.screen?'<strong>'+s.screen+'</strong>':'<img src="assets/brand/uangii-icon.webp" width="26" height="26" alt=""><strong>uangii.</strong><span class="us-quick">✦ Catat Cepat</span>')+'</div><div class="us-screen-body">'+s.body+'</div><div class="us-appnav">'+nav+'</div></div></div></div>';
  }
  document.querySelectorAll('[data-app-scene]').forEach(target => {
    if(scenes[target.dataset.appScene])target.innerHTML=stage(target.dataset.appScene);
  });
  document.querySelectorAll('[data-app-tour]').forEach(tour => {
    const keys = tour.dataset.appTour.split(/\s+/).filter(key=>scenes[key]);
    if(!keys.length)return;
    const view = tour.querySelector('[data-tour-view]');
    const summary = tour.querySelector('[data-tour-summary]');
    const controls = tour.querySelector('[data-tour-controls]');
    const buttons=keys.map(key=>{
      const button=document.createElement('button');
      button.type='button';
      button.className='us-select';
      button.textContent=scenes[key].label;
      button.setAttribute('aria-pressed','false');
      button.addEventListener('click',()=>show(key));
      controls.append(button);
      return button;
    });
    function show(key){
      const s=scenes[key];
      buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(keys[i]===key)));
      view.innerHTML=stage(key);
      summary.querySelector('small').textContent=s.badge;
      summary.querySelector('h3').textContent=s.label;
      summary.querySelector('p').textContent=s.description;
    }
    show(keys[0]);
    controls.hidden=false;
  });
})();
