/* Faceted Eye v3 — cookie-free visitor counting via GoatCounter (optional).
   Counts page views per route and a handful of named events. No cookies, no
   personal data, nothing loaded unless FE_CONFIG.GOATCOUNTER is set. */
(function () {
  'use strict';
  const code = (window.FE_CONFIG || {}).GOATCOUNTER;
  const queue = [];
  let ready = false;

  if (code) {
    window.goatcounter = { no_onload: true };
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://gc.zgo.at/count.js';
    s.dataset.goatcounter = `https://${code}.goatcounter.com/count`;
    s.onload = () => { ready = true; queue.splice(0).forEach(send); };
    document.head.append(s);
  }

  function send(hit) {
    try { window.goatcounter.count(hit); } catch (e) { /* blocked or offline: ignore */ }
  }
  function hit(h) {
    if (!code) return;
    if (ready && window.goatcounter && window.goatcounter.count) send(h); else queue.push(h);
  }

  window.FE_TRACK = {
    /* Page view for a hash route, e.g. "#/decks/feline" -> "/decks/feline". */
    page(hash) {
      const path = (hash || '#/').replace(/^#/, '').split('?')[0] || '/';
      hit({ path, title: document.title });
    },
    /* Named event, e.g. "kickstarter-click", "share", "reading-complete". */
    event(name, title) { hit({ path: name, title: title || name, event: true }); }
  };
})();
