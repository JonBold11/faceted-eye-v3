/* Faceted Eye v3 — hash router. */
(function () {
  'use strict';
  const V = window.Views;
  const view = document.getElementById('view');
  let current = null, lastPath = null;
  /* Which bottom tab each route belongs to. */
  const TAB = { '': 'read', table: 'read', daily: 'daily', decks: 'decks', learn: 'learn', more: 'more', about: 'more', goods: 'more' };

  function parse() {
    const raw = location.hash.replace(/^#/, '') || '/';
    const [path, query = ''] = raw.split('?');
    const params = Object.fromEntries(new URLSearchParams(query));
    const parts = path.split('/').filter(Boolean);
    return { path, parts, params };
  }

  function route() {
    const { path, parts, params } = parse();
    /* The table mirrors its state with replaceState, which never fires hashchange,
       so any hashchange here is a real navigation (link, back/forward). */
    const modal = document.getElementById('modal');
    if (modal.open) modal.close();
    if (current && current.destroy) current.destroy();
    let v;
    switch (parts[0]) {
      case undefined: v = V.read(); break;
      case 'daily': v = V.daily(); break;
      case 'decks': v = parts[1] ? V.deck(parts[1], params) : V.decks(); break;
      case 'table': v = V.table(params); break;
      case 'learn': v = parts[1] ? V.lesson(parts[1]) : V.learn(); break;
      case 'more': v = V.more(); break;
      case 'goods': v = V.goods(parts[1]); break;
      case 'about': v = V.about(); break;
      default: v = V.notFound();
    }
    current = v;
    view.replaceChildren(v.node);
    document.body.dataset.route = parts[0] || 'read';
    const tab = TAB[parts[0] || ''];
    document.querySelectorAll('[data-nav]').forEach(a => {
      const on = a.dataset.nav === tab;
      a.classList.toggle('is-on', on);
      on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
    });
    const h1 = v.node.querySelector('h1');
    document.title = (parts[0] && h1 ? h1.textContent.replace(/\s+/g, ' ').trim() + ' · ' : '') + 'The Faceted Eye';
    if (path !== lastPath) {
      window.scrollTo(0, 0);
      if (lastPath !== null) view.focus({ preventScroll: true });
      window.FE_TRACK && window.FE_TRACK.page(location.hash);
    }
    lastPath = path;
  }

  window.addEventListener('hashchange', route);
  /* Tapping the tab you are already on returns to its top. */
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-nav], .brand');
    if (!a) return;
    const target = a.getAttribute('href').replace(/^#/, '').split('?')[0];
    const here = (location.hash.replace(/^#/, '') || '/').split('?')[0];
    if (target === here) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: window.UI.reducedMotion() ? 'auto' : 'smooth' });
    }
  });
  window.UI.trapModal(document.getElementById('modal'));
  route();
})();
