(() => {
  const dialog = document.getElementById('releaseScreenshotDialog');
  if (!dialog?.showModal) return;
  const image = dialog.querySelector('img');
  document.querySelectorAll('[data-release-screenshot]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      image.src = link.href;
      image.alt = link.querySelector('img').alt;
      dialog.showModal();
    });
  });
})();
