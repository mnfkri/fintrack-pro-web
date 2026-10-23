(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = matchMedia('(hover:hover) and (pointer:fine)');
  const motion = document.getElementById('pageMotion');
  let paused = false;
  try { paused = localStorage.getItem('uangii-motion-paused') === 'true'; } catch (_) {}
  function applyMotion() {
    const disabled = paused || reduced.matches;
    document.body.classList.toggle('u-motion-paused', disabled);
    motion.setAttribute('aria-pressed', String(disabled));
    motion.setAttribute('aria-label', disabled ? 'Aktifkan animasi' : 'Jeda animasi');
    motion.textContent = disabled ? '▶' : 'Ⅱ';
  }
  applyMotion(); reduced.addEventListener('change', applyMotion);
  motion.addEventListener('click', () => { paused = !paused; try { localStorage.setItem('uangii-motion-paused', String(paused)); } catch (_) {} applyMotion(); });
  const menuButton = document.getElementById('pageMenu'), menu = document.getElementById('pageNav');
  function closeMenu() { menu.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); }
  menuButton.addEventListener('click', () => { menu.hidden = !menu.hidden; menuButton.setAttribute('aria-expanded', String(!menu.hidden)); });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  addEventListener('keydown', event => { if (event.key === 'Escape' && !menu.hidden) { closeMenu(); menuButton.focus(); } });
  if ('IntersectionObserver' in window) {
    document.body.classList.add('s-motion-ready');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('in'); observer.unobserve(entry.target); } }), {threshold:.08});
    document.querySelectorAll('.s-reveal').forEach(el => observer.observe(el));
  }
  document.querySelectorAll('[data-tilt]').forEach(el => {
    let frame;
    el.addEventListener('pointermove', event => {
      if (paused || reduced.matches || !pointer.matches) return;
      const rect = el.getBoundingClientRect(), x = (event.clientX-rect.left)/rect.width-.5, y = (event.clientY-rect.top)/rect.height-.5;
      cancelAnimationFrame(frame);frame = requestAnimationFrame(() => { el.style.setProperty('--rx', `${-y*7}deg`); el.style.setProperty('--ry', `${x*9}deg`); });
    });
    el.addEventListener('pointerleave', () => { cancelAnimationFrame(frame);el.style.setProperty('--rx','0deg');el.style.setProperty('--ry','0deg'); });
  });
  const progress = document.querySelector('.s-progress');let scrollFrame;
  addEventListener('scroll', () => { if(scrollFrame)return;scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;const height=document.documentElement.scrollHeight-innerHeight;progress.style.width=height>0?`${scrollY/height*100}%`:'0';}); },{passive:true});
  const image = document.getElementById('featureImage'), caption = document.getElementById('featureCaption');
  document.querySelectorAll('[data-feature-image]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-feature-image]').forEach(b => b.setAttribute('aria-pressed', String(b===button)));
    image.src=button.dataset.featureImage;image.alt=button.dataset.alt;caption.textContent=button.dataset.caption;
  }));
  document.querySelectorAll('[data-model]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-model]').forEach(b => b.setAttribute('aria-pressed', String(b===button)));
    document.querySelectorAll('[data-model-panel]').forEach(panel => panel.hidden=panel.dataset.modelPanel!==button.dataset.model);
  }));
  const layers = [
    {tag:'DEVICE ACCESS',title:'Mulai dari akses perangkat.',text:'Kunci aplikasi membantu membatasi akses ke catatan keuangan. Autentikasi biometrik memanfaatkan mekanisme keamanan Android di perangkat yang mendukungnya.',flow:['Kunci aplikasi','Autentikasi perangkat','Akses catatan']},
    {tag:'LOCAL DATABASE',title:'Catatan terlindungi saat disimpan.',text:'Database lokal menggunakan SQLCipher dengan enkripsi AES-256. Proteksi ini melindungi data tersimpan; keamanan perangkat dan pengelolaan kunci tetap menjadi bagian penting dari keseluruhan perlindungan.',flow:['Catatan keuangan','Enkripsi SQLCipher','Database lokal']},
    {tag:'OPTIONAL CONNECTIONS',title:'Koneksi dengan konteks yang jelas.',text:'Cadangan Google Drive menggunakan enkripsi sebelum diunggah. Untuk konteks Fio, penyamaran informasi identitas membantu mengurangi data pribadi dalam teks yang diproses. Mode AI cloud dan pencadangan memerlukan koneksi internet.',flow:['Fitur yang dipilih','Enkripsi / penyamaran','Layanan terkait']}
  ];
  document.querySelectorAll('[data-layer]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-layer]').forEach(b => b.setAttribute('aria-pressed', String(b===button)));
    const layer=layers[Number(button.dataset.layer)];
    document.getElementById('layerTag').textContent=layer.tag;document.getElementById('layerTitle').textContent=layer.title;document.getElementById('layerText').textContent=layer.text;
    document.querySelectorAll('#layerFlow span').forEach((el,i)=>el.textContent=layer.flow[i]);
  }));
})();
