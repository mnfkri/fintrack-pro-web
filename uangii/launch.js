(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const rotators = [...document.querySelectorAll('[data-launch-rotator]')].map(el => ({words:[...el.querySelectorAll('.launch-word')],index:0}));
  let interval = null;
  function stop() { if(interval !== null) clearInterval(interval); interval = null; }
  function sync() {
    stop();
    if (reduced.matches || document.hidden || document.body.classList.contains('u-motion-paused') || !rotators.length) return;
    interval = setInterval(() => {
      rotators.forEach(state => {
        state.words.forEach(word => word.classList.remove('is-exiting'));
        state.words[state.index].classList.replace('is-active','is-exiting');
        state.index = (state.index + 1) % state.words.length;
        state.words[state.index].classList.add('is-active');
      });
    }, 2400);
  }
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange',sync);
  new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
  addEventListener('pagehide',stop);
  addEventListener('pageshow',sync);
  sync();
})();
