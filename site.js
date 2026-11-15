/* Mobile navigation is hidden from keyboard and screen readers while closed. */
(function () {
  var button = document.getElementById('burger');
  var nav = document.getElementById('nav');
  if (!button || !nav) return;
  var mobile = window.matchMedia('(max-width: 900px)');
  var today = new Date(Date.now() + 3 * 36e5).toISOString().slice(0, 10);
  nav.querySelectorAll('[data-shows-until]').forEach(function (link) {
    if (link.dataset.showsUntil < today) link.hidden = true;
  });
  function setOpen(open, restoreFocus) {
    open = mobile.matches && open;
    nav.classList.toggle('open', open);
    nav.inert = mobile.matches && !open;
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Закрыть меню' : 'Меню');
    document.body.style.overflow = open ? 'hidden' : '';
    if (restoreFocus) button.focus();
  }
  button.addEventListener('click', function () {
    setOpen(button.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', function (event) {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', function (event) {
    if (button.getAttribute('aria-expanded') !== 'true') return;
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false, true);
    } else if (event.key === 'Tab') {
      var links = Array.from(nav.querySelectorAll('a:not([hidden])'));
      var focusable = links.concat(button);
      var current = focusable.indexOf(document.activeElement);
      var next = (current + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length;
      event.preventDefault();
      focusable[next].focus();
    }
  });
  mobile.addEventListener('change', function () { setOpen(false); });
  setOpen(false);
})();
