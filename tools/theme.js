/* Weergave kiezen (licht, donker, rood). Wordt als eerste geladen zodat er niets flitst. */
(function () {
  var KEY = 'run90.theme', COLORS = { dark: '#0e0e0e', light: '#f6f3ee', red: '#c4201a' };
  function stored() { try { var s = localStorage.getItem(KEY); if (COLORS[s]) return s; } catch (e) {} return 'dark'; }
  function apply(t) {
    document.documentElement.setAttribute('data-theme', t);
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', COLORS[t]);
    var b = document.querySelectorAll('[data-theme-set]');
    for (var i = 0; i < b.length; i++) b[i].setAttribute('aria-pressed', b[i].getAttribute('data-theme-set') === t ? 'true' : 'false');
  }
  apply(stored());
  document.addEventListener('DOMContentLoaded', function () { apply(stored()); });
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-theme-set]'); if (!el) return;
    var t = el.getAttribute('data-theme-set'); if (!COLORS[t]) return;
    try { localStorage.setItem(KEY, t); } catch (err) {}
    apply(t);
  });
})();
