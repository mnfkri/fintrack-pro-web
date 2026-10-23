(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const motionButton = document.getElementById('motionToggle');
  let paused = false;
  try { paused = localStorage.getItem('uangii-motion-paused') === 'true'; } catch (_) {}
  function applyMotion() {
    document.body.classList.toggle('u-motion-paused', paused || reduced.matches);
    motionButton?.setAttribute('aria-pressed', String(paused || reduced.matches));
    if (motionButton) {
      motionButton.textContent = paused ? '▶' : 'Ⅱ';
      motionButton.setAttribute('aria-label', paused ? 'Aktifkan animasi' : 'Jeda animasi');
      motionButton.title = paused ? 'Aktifkan animasi' : 'Jeda animasi';
    }
  }
  applyMotion();
  reduced.addEventListener('change', applyMotion);
  motionButton?.addEventListener('click', () => {
    paused = !paused;
    try { localStorage.setItem('uangii-motion-paused', String(paused)); } catch (_) {}
    applyMotion();
  });
  document.querySelectorAll('[data-tilt]').forEach(el => {
    let frame = 0;
    el.addEventListener('pointermove', event => {
      if (!finePointer.matches || reduced.matches || paused) return;
      const rect = el.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty('--rx', `${-y * 9}deg`);
        el.style.setProperty('--ry', `${x * 12}deg`);
      });
    });
    el.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });
  const hero = document.querySelector('.u-hero');
  const parallax = document.querySelector('.u-parallax');
  let scrollFrame = 0;
  addEventListener('scroll', () => {
    if (scrollFrame || !hero || !parallax || reduced.matches || paused || !finePointer.matches) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      if (hero.getBoundingClientRect().bottom > 0) parallax.style.setProperty('--scroll-y', `${Math.min(scrollY * .09, 65)}px`);
    });
  }, { passive: true });
  const productImage = document.getElementById('productImage');
  window.openCalculatorStudio = function() {
    window.goSection('interactive-studio');
    window.switchBentoStudioTab('calc', document.getElementById('tabBtnCalc'));
    document.querySelectorAll('.bento-tab-btn').forEach(b => b.setAttribute('aria-selected', String(b.id === 'tabBtnCalc')));
  };
  const productCaption = document.getElementById('productCaption');
  let imageTimer;
  document.querySelectorAll('[data-product-image]').forEach(button => {
    button.addEventListener('click', () => {
      clearTimeout(imageTimer);
      document.querySelectorAll('[data-product-image]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      productImage.style.opacity = '0';
      imageTimer = setTimeout(() => {
        productImage.src = button.dataset.productImage;
        productImage.alt = button.dataset.alt;
        productCaption.textContent = button.dataset.caption;
        productImage.style.opacity = '1';
      }, reduced.matches ? 0 : 160);
    });
  });
  // Keep the existing studio controls while exposing their selected state.
  document.querySelectorAll('.bento-tab-btn').forEach(button => {
    button.setAttribute('role', 'tab');
    const name = button.id.replace('tabBtn', '');
    const suffix = {Fio:'fio',Calc:'calc',SmartInput:'smart-input'}[name];
    button.setAttribute('aria-controls', 'bentoTabContent-' + suffix);
    button.setAttribute('aria-selected', String(button.classList.contains('active')));
    button.addEventListener('click', () => document.querySelectorAll('.bento-tab-btn').forEach(b => b.setAttribute('aria-selected', String(b === button))));
  });
  document.querySelectorAll('.bento-tab-content').forEach(panel => panel.setAttribute('role', 'tabpanel'));
  const drawer = document.getElementById('navDrawer');
  const drawerToggle = document.querySelector('.menu-toggle');
  drawerToggle?.setAttribute('aria-controls', 'navDrawer');
  drawerToggle?.setAttribute('aria-expanded', 'false');
  drawer?.setAttribute('inert', '');
  let lastFocus;
  const navToggle = window.toggleNav;
  window.toggleNav = function(open) {
    if (open) lastFocus = document.activeElement;
    navToggle(open);
    drawerToggle?.setAttribute('aria-expanded', String(open));
    drawer?.toggleAttribute('inert', !open);
    if (open) drawer?.querySelector('button')?.focus();
    else if (drawer?.contains(document.activeElement)) lastFocus?.focus();
  };
  const modal = document.getElementById('waitlistModal');
  modal?.setAttribute('role','dialog');
  modal?.setAttribute('aria-modal','true');
  modal?.setAttribute('aria-label','Daftar early access Uangii');
  let modalFocus;
  const openModal = window.openWaitlistModal;
  const closeModal = window.closeWaitlistModal;
  window.openWaitlistModal = function(email) {
    modalFocus = document.activeElement;
    openModal(email);
    setTimeout(() => modal?.querySelector('input:not([disabled]),button')?.focus(), 30);
  };
  window.closeWaitlistModal = function() { closeModal(); modalFocus?.focus(); };
  addEventListener('keydown', event => {
    const activeDialog = modal?.classList.contains('open') ? modal : drawer?.classList.contains('open') ? drawer : null;
    if (!activeDialog) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      if (activeDialog === modal) window.closeWaitlistModal(); else window.toggleNav(false);
    }
    if (event.key === 'Tab') {
      const controls = [...activeDialog.querySelectorAll('a[href],button,input,select,[tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });
})();
