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

/* Tour links activate the same calendar filter as the buttons. */
(function () {
  var today = new Date(Date.now() + 3 * 36e5).toISOString().slice(0, 10);
  var upcomingTour = document.querySelectorAll('.event[data-tour][data-date]');
  var hasTour = Array.from(upcomingTour).some(function (event) {
    return event.dataset.date >= today;
  });
  var promo = document.getElementById('tour-promo');
  if (promo) promo.hidden = !promo.dataset.tourUntil || promo.dataset.tourUntil < today;

  var tools = document.getElementById('tour');
  if (!tools) return;
  var buttons = Array.from(tools.querySelectorAll('[data-schedule-filter]'));
  var events = Array.from(document.querySelectorAll('.events .event[data-date]'));
  var status = document.getElementById('schedule-status');
  var empty = document.getElementById('no-events');
  var citySelect = document.getElementById('schedule-city');
  var filteredEmpty = document.getElementById('schedule-empty');
  tools.hidden = !hasTour;
  if (!hasTour) return;
  var cities = Array.from(new Set(events.map(function (event) { return event.dataset.city; }).filter(Boolean))).sort(function (a, b) { return a.localeCompare(b, 'ru'); });
  cities.forEach(function (city) {
    var option = document.createElement('option');
    option.value = city;
    option.textContent = city;
    citySelect.appendChild(option);
  });
  var initialCity = new URLSearchParams(location.search).get('city');
  if (cities.indexOf(initialCity) !== -1) citySelect.value = initialCity;

  function setAddress(hash) {
    var params = new URLSearchParams(location.search);
    if (citySelect.value) params.set('city', citySelect.value);
    else params.delete('city');
    var search = params.toString();
    history.replaceState(null, '', location.pathname + (search ? '?' + search : '') + hash);
  }

  function applyFilter() {
    var onlyTour = location.hash === '#tour' && hasTour;
    var city = citySelect.value;
    var visible = events.filter(function (event) {
      var show = event.dataset.date >= today && (!onlyTour || event.hasAttribute('data-tour')) && (!city || event.dataset.city === city);
      event.hidden = !show;
      event.classList.remove('next');
      var badge = event.querySelector('.badge');
      if (badge) badge.remove();
      return show;
    });
    buttons.forEach(function (button) {
      button.setAttribute('aria-pressed', String((button.dataset.scheduleFilter === 'tour') === onlyTour));
    });
    if (status) status.textContent = (onlyTour ? 'Концерты тура' : 'Все выступления') + (city ? ' · ' + city : '') + ' · Найдено: ' + visible.length;
    if (empty) empty.hidden = events.length > 0;
    if (filteredEmpty) filteredEmpty.hidden = visible.length > 0;
    if (visible.length) {
      visible[0].classList.add('next');
      var heading = visible[0].querySelector('h3');
      var badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = onlyTour ? 'Ближайший в туре' : 'Ближайший';
      heading.parentNode.insertBefore(badge, heading);
    }
  }
  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      var hash = button.dataset.scheduleFilter === 'tour' ? '#tour' : '';
      setAddress(hash);
      applyFilter();
    });
  });
  citySelect.addEventListener('change', function () {
    setAddress(location.hash === '#tour' ? '#tour' : '');
    applyFilter();
  });
  window.addEventListener('hashchange', applyFilter);
  applyFilter();
})();
