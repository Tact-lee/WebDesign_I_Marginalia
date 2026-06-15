(function () {
  'use strict';
  var btn   = document.getElementById('contactBtn');
  var panel = document.getElementById('contactPanel');
  if (!btn || !panel) return;
  btn.addEventListener('click', function () {
    var open = btn.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
    panel.classList.toggle('open', open);
  });
})();
