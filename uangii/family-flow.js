(() => {
  const demo = document.getElementById('simulasi-setoran');
  const controls = demo.querySelector('.uf-controls');
  const action = demo.querySelector('#uf-action');
  const cash = demo.querySelector('#uf-cash');
  const member = demo.querySelector('#uf-member');
  const status = demo.querySelector('#uf-status');
  const steps = [
    ['Simulasikan setoran', 'Menunggu setoran', 'Menunggu sinkronisasi', 'Contoh: setoran Rp500.000 dari dompet pribadi.'],
    ['Sinkronkan ke HP Nia', 'Setoran masuk +Rp500.000', 'Menunggu sinkronisasi', 'Setoran tercatat di Kas Rumah.'],
    ['Ulangi simulasi', 'Setoran masuk +Rp500.000', 'Melihat setoran +Rp500.000', 'Setoran terlihat oleh Nia. Riwayat dompet pribadi tetap privat.']
  ];
  let step = 0;
  function render() {
    demo.dataset.step = String(step);
    [action.textContent, cash.textContent, member.textContent, status.textContent] = steps[step];
  }
  action.addEventListener('click', () => {
    step = (step + 1) % steps.length;
    render();
  });
  render();
  controls.hidden = false;
})();
