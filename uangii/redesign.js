(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const motionButton = document.getElementById('motionToggle');
  let paused = false;
  try { paused = localStorage.getItem('uangii-motion-paused') === 'true'; } catch (_) {}

  function applyMotion() {
    const disabled = paused || reduced.matches;
    document.body.classList.toggle('u-motion-paused', disabled);
    motionButton?.setAttribute('aria-pressed', String(disabled));
    if (motionButton) {
      motionButton.textContent = disabled ? '▶' : 'Ⅱ';
      motionButton.setAttribute('aria-label', disabled ? 'Aktifkan animasi' : 'Jeda animasi');
      motionButton.title = disabled ? 'Aktifkan animasi' : 'Jeda animasi';
    }
  }
  applyMotion();
  reduced.addEventListener('change', applyMotion);
  motionButton?.addEventListener('click', () => {
    paused = !paused;
    try { localStorage.setItem('uangii-motion-paused', String(paused)); } catch (_) {}
    applyMotion();
  });

  // Staggered Scroll Reveals
  if ('IntersectionObserver' in window) {
    const staggerObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          staggerObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('[data-stagger]').forEach(el => staggerObserver.observe(el));
  } else {
    document.querySelectorAll('[data-stagger]').forEach(el => el.classList.add('is-in'));
  }

  // Cursor-Tracking Spotlight Glow on Cards
  document.querySelectorAll('.u-spot').forEach(card => {
    let frame = 0;
    card.addEventListener('pointermove', event => {
      if (!finePointer.matches || reduced.matches || paused) return;
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        card.style.setProperty('--mx', `${x}px`);
        card.style.setProperty('--my', `${y}px`);
      });
    });
  });

  // 3D Tilt on marked elements
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

  // Studio Calculator shortcut
  window.openCalculatorStudio = function() {
    if (typeof window.goSection === 'function') window.goSection('interactive-studio');
    document.getElementById('tabBtnCalc')?.click();
  };

  // Studio Smart Input shortcut
  window.openSmartInputStudio = function() {
    if (typeof window.goSection === 'function') window.goSection('interactive-studio');
    document.getElementById('tabBtnSmartInput')?.click();
  };

  // Interactive Bento Studio accessible tabs
  const tablist = document.querySelector('.bento-nav-tabs');
  if (tablist) {
    const tabs = [...tablist.querySelectorAll('.bento-tab-btn')];
    const vertical = matchMedia('(max-width: 600px)');
    const updateOrientation = () => tablist.setAttribute('aria-orientation', vertical.matches ? 'vertical' : 'horizontal');
    updateOrientation();
    vertical.addEventListener('change', updateOrientation);

    function updateTabs(selected) {
      tabs.forEach(tab => {
        tab.tabIndex = tab === selected ? 0 : -1;
        tab.setAttribute('aria-selected', String(tab === selected));
        const ctrl = document.getElementById(tab.getAttribute('aria-controls'));
        if (ctrl) ctrl.hidden = tab !== selected;
      });
    }

    tabs.forEach(button => {
      button.setAttribute('role', 'tab');
      const name = button.id.replace('tabBtn', '');
      const suffix = { Fio: 'fio', Calc: 'calc', SmartInput: 'smart-input' }[name];
      if (!suffix) return;
      button.setAttribute('aria-controls', 'bentoTabContent-' + suffix);
      const panel = document.getElementById('bentoTabContent-' + suffix);
      if (panel) {
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', button.id);
        panel.tabIndex = 0;
      }
      button.addEventListener('click', () => updateTabs(button));
    });

    if (tabs.length) updateTabs(tabs.find(t => t.classList.contains('active')) || tabs[0]);

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
  }

  // Accessible Flyout Drawer
  const drawer = document.getElementById('navDrawer');
  const drawerToggle = document.querySelector('.menu-toggle');
  drawerToggle?.setAttribute('aria-controls', 'navDrawer');
  drawerToggle?.setAttribute('aria-expanded', 'false');
  drawer?.setAttribute('inert', '');
  let lastFocus;
  const navToggle = window.toggleNav;
  if (typeof navToggle === 'function') {
    window.toggleNav = function(open) {
      if (open) lastFocus = document.activeElement;
      navToggle(open);
      drawerToggle?.setAttribute('aria-expanded', String(open));
      drawer?.toggleAttribute('inert', !open);
      if (open) drawer?.querySelector('button,a')?.focus();
      else if (drawer?.contains(document.activeElement)) lastFocus?.focus();
    };
  }

  addEventListener('keydown', event => {
    const activeDialog = drawer?.classList.contains('open') ? drawer : null;
    if (!activeDialog) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      window.toggleNav?.(false);
    }
    if (event.key === 'Tab') {
      const controls = [...activeDialog.querySelectorAll('a[href],button,input,select,[tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });
})();
