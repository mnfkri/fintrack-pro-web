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
    if (motion) {
      motion.setAttribute('aria-pressed', String(disabled));
      motion.setAttribute('aria-label', disabled ? 'Aktifkan animasi' : 'Jeda animasi');
      motion.textContent = disabled ? '▶' : 'Ⅱ';
    }
  }
  applyMotion();
  reduced.addEventListener('change', applyMotion);
  motion?.addEventListener('click', () => {
    paused = !paused;
    try { localStorage.setItem('uangii-motion-paused', String(paused)); } catch (_) {}
    applyMotion();
  });

  const menuButton = document.getElementById('pageMenu'), menu = document.getElementById('pageNav');
  function closeMenu() {
    if (!menu || !menuButton) return;
    menu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
  }
  menuButton?.addEventListener('click', () => {
    if (!menu) return;
    menu.hidden = !menu.hidden;
    menuButton.setAttribute('aria-expanded', String(!menu.hidden));
  });
  menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu && !menu.hidden) {
      closeMenu();
      menuButton?.focus();
    }
  });

  if ('IntersectionObserver' in window) {
    document.body.classList.add('s-motion-ready');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .08 });
    document.querySelectorAll('.s-reveal,[data-stagger]').forEach(el => observer.observe(el));
  } else {
    document.querySelectorAll('[data-stagger]').forEach(el => el.classList.add('is-in'));
  }

  // Spotlight hover glow on cards
  document.querySelectorAll('.u-spot,.s-card').forEach(card => {
    card.classList.add('u-spot');
    let frame = 0;
    card.addEventListener('pointermove', event => {
      if (paused || reduced.matches || !pointer.matches) return;
      const rect = card.getBoundingClientRect();
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
        card.style.setProperty('--my', `${event.clientY - rect.top}px`);
      });
    });
  });

  document.querySelectorAll('[data-tilt]').forEach(el => {
    let frame;
    el.addEventListener('pointermove', event => {
      if (paused || reduced.matches || !pointer.matches) return;
      const rect = el.getBoundingClientRect(), x = (event.clientX - rect.left) / rect.width - .5, y = (event.clientY - rect.top) / rect.height - .5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty('--rx', `${-y * 7}deg`);
        el.style.setProperty('--ry', `${x * 9}deg`);
      });
    });
    el.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });

  const progress = document.querySelector('.s-progress');
  let scrollFrame;
  addEventListener('scroll', () => {
    if (scrollFrame || !progress) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      const height = document.documentElement.scrollHeight - innerHeight;
      progress.style.width = height > 0 ? `${scrollY / height * 100}%` : '0';
    });
  }, { passive: true });

  document.querySelectorAll('[data-model]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-model]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    document.querySelectorAll('[data-model-panel]').forEach(panel => panel.hidden = panel.dataset.modelPanel !== button.dataset.model);
  }));

  const layers = [
    { tag: 'DEVICE ACCESS', title: 'Mulai dari akses perangkat.', text: 'Kunci aplikasi membantu membatasi akses ke catatan keuangan. Autentikasi biometrik memanfaatkan Android BiometricPrompt API di perangkat yang mendukungnya.', flow: ['Kunci aplikasi', 'Autentikasi perangkat', 'Akses catatan'] },
    { tag: 'LOCAL DATABASE & NOTIFIKASI', title: 'Terenkripsi lokal & filter ephemeral.', text: 'Database lokal menggunakan SQLCipher AES-256. Jika fitur opsional Auto-Capture Notifikasi diaktifkan, teks notifikasi bank/e-wallet diproses sementara di memori perangkat; OTP, PIN, dan promo otomatis dibuang.', flow: ['Catatan / Notifikasi', 'SQLCipher & Filter Lokal', 'Database Perangkat'] },
    { tag: 'OPTIONAL CONNECTIONS', title: 'Koneksi dengan konteks yang jelas.', text: 'Cadangan Drive dienkripsi AES-256-GCM sebelum diunggah. Mode Fio offline berjalan di perangkat. Gemini Cloud dapat menerima pertanyaan, riwayat terbaru, dan konteks nominal finansial dengan penyaringan PII. Ruang Keluarga mengikuti peran dan mode berbagi.', flow: ['Fitur yang dipilih', 'Konteks sesuai fungsi', 'Layanan terkait'] }
  ];
  document.querySelectorAll('[data-layer]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-layer]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    const layer = layers[Number(button.dataset.layer)];
    if (!layer) return;
    const tagEl = document.getElementById('layerTag');
    const titleEl = document.getElementById('layerTitle');
    const textEl = document.getElementById('layerText');
    if (tagEl) tagEl.textContent = layer.tag;
    if (titleEl) titleEl.textContent = layer.title;
    if (textEl) textEl.textContent = layer.text;
    document.querySelectorAll('#layerFlow span').forEach((el, i) => { if (layer.flow[i]) el.textContent = layer.flow[i]; });
  }));
})();
