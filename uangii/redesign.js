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
    document.getElementById('tabBtnCalc').click();
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
  const tablist = document.querySelector('.bento-nav-tabs');
  const tabs = [...tablist.querySelectorAll('.bento-tab-btn')];
  const vertical = matchMedia('(max-width: 600px)');
  function updateOrientation() { tablist.setAttribute('aria-orientation', vertical.matches ? 'vertical' : 'horizontal'); }
  updateOrientation();
  vertical.addEventListener('change', updateOrientation);
  function updateTabs(selected) {
    tabs.forEach(tab => {
      tab.tabIndex = tab === selected ? 0 : -1;
      tab.setAttribute('aria-selected', String(tab === selected));
      document.getElementById(tab.getAttribute('aria-controls')).hidden = tab !== selected;
    });
  }
  tabs.forEach(button => {
    button.setAttribute('role', 'tab');
    const name = button.id.replace('tabBtn', '');
    const suffix = {Fio:'fio',Calc:'calc',SmartInput:'smart-input'}[name];
    button.setAttribute('aria-controls', 'bentoTabContent-' + suffix);
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', button.id);
    panel.tabIndex = 0;
    button.addEventListener('click', () => updateTabs(button));
  });
  updateTabs(tabs.find(tab => tab.classList.contains('active')) || tabs[0]);
  tablist.addEventListener('keydown', event => {
    const index = tabs.indexOf(event.target);
    if (index < 0) return;
    const next = vertical.matches ? 'ArrowDown' : 'ArrowRight';
    const prev = vertical.matches ? 'ArrowUp' : 'ArrowLeft';
    const offset = event.key === next ? 1 : event.key === prev ? -1 : 0;
    const target = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs.at(-1) : offset ? tabs[(index + offset + tabs.length) % tabs.length] : null;
    if (!target) return;
    event.preventDefault();
    target.focus();
    target.click();
  });
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
  addEventListener('keydown', event => {
    const activeDialog = drawer?.classList.contains('open') ? drawer : null;
    if (!activeDialog) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      window.toggleNav(false);
    }
    if (event.key === 'Tab') {
      const controls = [...activeDialog.querySelectorAll('a[href],button,input,select,[tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });
})();
