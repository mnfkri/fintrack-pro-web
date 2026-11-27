(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  const motion = document.getElementById('investmentMotion');
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

  // Staggered reveals & spotlight cards
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('[data-stagger]').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('[data-stagger]').forEach(el => el.classList.add('is-in'));
  }

  document.querySelectorAll('.u-spot').forEach(card => {
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

  const menuButton = document.getElementById('investmentMenu');
  const menu = document.getElementById('investmentNav');
  function closeMenu() { menu.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); }
  menuButton?.addEventListener('click', () => {
    menu.hidden = !menu.hidden;
    menuButton.setAttribute('aria-expanded', String(!menu.hidden));
  });
  menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  addEventListener('keydown', event => { if (event.key === 'Escape' && menu && !menu.hidden) { closeMenu(); menuButton?.focus(); } });

  const dialog = document.getElementById('performanceDialog');
  document.querySelectorAll('[data-open-performance]').forEach(button => button.addEventListener('click', () => dialog?.showModal()));
  document.querySelectorAll('[data-close-performance]').forEach(button => button.addEventListener('click', () => dialog?.close()));
  dialog?.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
})();
