/* Faceted Eye v2 — shared UI pieces: hex cards, boards, helpers. */
(function () {
  'use strict';
  const { cards, DECKS, bySlug } = window.FE_CARDS;
  const H = window.Hex;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const el = (tag, attrs = {}, html = '') => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === false || v == null) continue;
      if (k === 'class') e.className = v; else if (k === 'style') e.style.cssText = v; else e.setAttribute(k, v === true ? '' : v);
    }
    if (html) e.innerHTML = html;
    return e;
  };
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const announce = msg => { const a = $('#announce'); a.textContent = ''; requestAnimationFrame(() => { a.textContent = msg; }); };
  const rand = n => Math.floor(Math.random() * n);
  function shuffle(list) { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  /* Preferred deck persists across views. */
  const LEAD = (window.FE_CONFIG && window.FE_CONFIG.LEAD_DECK) || 'feline';
  const store = {
    get(k, d) { try { const v = localStorage.getItem('fe3.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('fe3.' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  };
  const prefs = {
    get deck() { const v = store.get('deck', LEAD); return DECKS[v] ? v : LEAD; },
    set deck(v) { store.set('deck', v); }
  };

  /* ---------- Kickstarter call to action ---------- */
  function ksButton(label = 'Follow on Kickstarter', cls = 'btn btn-brass btn-ks', where = '') {
    const url = window.FE_CONFIG.KICKSTARTER_URL;
    const icon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h4v6.2L15.6 3H21l-6 8 6.4 10H16l-5-8v8H7Z"/></svg>';
    return url
      ? `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener" data-ks="${esc(where)}">${icon}<span>${esc(label)}</span></a>`
      : `<button type="button" class="${cls}" data-ks="${esc(where)}" data-ks-soon>${icon}<span>${esc(label)}</span></button>`;
  }
  /* One delegated handler: counts clicks; explains while the page isn't live yet. */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-ks]');
    if (!b) return;
    window.FE_TRACK && window.FE_TRACK.event('kickstarter-click', b.dataset.ks || 'button');
    if (!b.hasAttribute('data-ks-soon')) return;
    const modal = document.getElementById('modal');
    if (modal.open) modal.close();
    modal.className = 'modal modal-sheet';
    modal.innerHTML = `<div class="sheet"><button type="button" class="close" data-close aria-label="Close">Close ×</button>
      <p class="kicker">Coming to Kickstarter</p><h2 id="modal-title">Feline Foresight is almost ready.</h2>
      <p>The Kickstarter pre-launch page is being set up. When it’s live, this button will take you straight there so you can follow the campaign and be notified the moment it launches.</p>
      <p class="fine">Following on Kickstarter is free. Nothing is for sale on this site.</p>
      <button type="button" class="btn btn-ghost" data-close>Keep exploring</button></div>`;
    $$('[data-close]', modal).forEach(x => x.addEventListener('click', () => modal.close()));
    modal.showModal();
  });

  /* ---------- Daily card: the same card and turn for everyone on a given date ---------- */
  function dayKey(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function dailyCard(key = dayKey()) {
    const h = hashStr('faceted-eye:' + key);
    return { card: cards[h % 78], steps: Math.floor(h / 78) % 6, key };
  }

  /* ---------- Hex card ----------
     Outer box is a flat-top hexagon's bounding box (2 : √3). The artwork image is
     scaled per deck so its printed outer hexagon exactly fills the box, then turned
     inside the clip. A regular hexagon maps onto itself every 60°, so a turned card
     always shows its complete face. */
  function hexCard({ deck, slug, steps = 0, faceUp = true, thumb = true, lift = false, label = '' }) {
    const d = DECKS[deck], card = bySlug[slug];
    const root = el('div', { class: `hx${faceUp ? '' : ' is-down'}${lift ? ' hx--lift' : ''}`, 'data-deck': deck, style: `--scale:${d.scale};--turn:${steps * 60}deg` });
    const front = card ? (thumb ? d.thumb(card) : d.image(card)) : '';
    const back = thumb ? d.backThumb : d.back;
    root.innerHTML = `<div class="hx-flip"><div class="hx-face hx-front"><div class="hx-clip">${card ? `<img src="${front}" alt="${esc(label || card.name)}" decoding="async" loading="lazy" draggable="false">` : ''}</div></div><div class="hx-face hx-back"><div class="hx-clip"><img src="${back}" alt="" decoding="async" loading="lazy" draggable="false"></div></div></div>`;
    root._steps = steps;
    return root;
  }
  function setCard(node, { deck, slug, steps, faceUp, thumb = true }) {
    if (deck && deck !== node.dataset.deck) {
      const d = DECKS[deck];
      node.dataset.deck = deck; node.style.setProperty('--scale', d.scale);
      $('.hx-back img', node).src = thumb ? d.backThumb : d.back;
    }
    if (slug) {
      const d = DECKS[node.dataset.deck], card = bySlug[slug];
      let img = $('.hx-front img', node);
      if (!img) { img = el('img', { decoding: 'async', draggable: 'false' }); $('.hx-front .hx-clip', node).append(img); }
      const src = thumb ? d.thumb(card) : d.image(card);
      if (!img.src.endsWith(src)) img.src = src;
      img.alt = card.name;
    }
    if (steps != null) {
      /* Accumulate turns so the animation always takes the short way round. */
      const prev = node._steps ?? 0;
      let target = prev + (((steps - prev) % 6) + 6) % 6;
      if (target - prev > 3) target -= 6;
      node._steps = target;
      node.style.setProperty('--turn', `${target * 60}deg`);
    }
    if (faceUp != null) node.classList.toggle('is-down', !faceUp);
  }

  /* ---------- Board ----------
     Lays cards out on an axial grid, fitted to its host. Optional empty cells
     (for the open table) and live seam lines between touching edges. */
  class Board {
    constructor(host, opts = {}) {
      this.host = host;
      this.opts = Object.assign({ maxR: 150, pad: 18, seams: true, order: true, cells: [], interactive: false, thumb: true, deck: 'maya' }, opts);
      this.cards = [];
      this.nodes = [];
      this.stage = el('div', { class: 'board-stage' });
      this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      this.svg.setAttribute('class', 'board-seams'); this.svg.setAttribute('aria-hidden', 'true');
      this.pills = el('div', { class: 'board-pills', 'aria-hidden': 'true' });
      this.cellLayer = el('div', { class: 'board-cells' });
      this.cardLayer = el('div', { class: 'board-cards' });
      this.stage.append(this.cellLayer, this.cardLayer, this.svg, this.pills);
      host.append(this.stage);
      this.ro = new ResizeObserver(() => this.layout());
      this.ro.observe(host);
    }
    destroy() { this.ro.disconnect(); }
    setCells(cells) { this.opts.cells = cells; this.renderCells(); this.layout(); }
    renderCells() {
      this.cellLayer.replaceChildren();
      this.cellNodes = this.opts.cells.map((c, i) => {
        const b = el('button', { type: 'button', class: 'board-cell', 'data-q': c.q, 'data-r': c.r, 'aria-label': c.label || `Empty position ${i + 1}: draw a card here` }, '<span aria-hidden="true">+</span>');
        b.addEventListener('click', () => this.opts.onCell && this.opts.onCell(c, i));
        this.cellLayer.append(b);
        return b;
      });
    }
    set(cardsList, { deal = false } = {}) {
      const deck = this.opts.deck;
      // Remove extra nodes.
      while (this.nodes.length > cardsList.length) this.nodes.pop().remove();
      cardsList.forEach((c, i) => {
        let wrap = this.nodes[i];
        const fresh = !wrap;
        if (fresh) {
          wrap = el(this.opts.interactive ? 'button' : 'div', { class: 'board-card', type: this.opts.interactive ? 'button' : null });
          wrap.append(hexCard({ deck: c.deck || deck, slug: c.slug, steps: c.steps, faceUp: c.faceUp !== false, thumb: this.opts.thumb }));
          wrap.append(el('span', { class: 'board-order', 'aria-hidden': 'true' }, String(i + 1)));
          if (this.opts.interactive) wrap.addEventListener('click', () => this.opts.onCard && this.opts.onCard(this.nodes.indexOf(wrap)));
          if (deal && !reducedMotion()) { wrap.classList.add('is-dealing'); wrap.style.transitionDelay = `${i * 90}ms`; }
          this.cardLayer.append(wrap);
          this.nodes[i] = wrap;
        } else {
          setCard($('.hx', wrap), { deck: c.deck || deck, slug: c.slug, steps: c.steps, faceUp: c.faceUp !== false, thumb: this.opts.thumb });
        }
        wrap.classList.toggle('is-selected', !!c.selected);
        wrap.dataset.q = c.q; wrap.dataset.r = c.r;
        if (this.opts.interactive) {
          const card = bySlug[c.slug];
          const what = c.faceUp === false ? 'face down — reveal' : `${card ? card.name : ''}, turned ${H.mod(c.steps) * 60}°, top edge ${H.top(c.steps)} ${H.WORDS[H.top(c.steps)]}`;
          wrap.setAttribute('aria-label', `${i + 1}${c.role ? ' · ' + c.role : ''}: ${what}`);
          wrap.setAttribute('aria-pressed', c.selected ? 'true' : 'false');
        }
      });
      this.cards = cardsList;
      this.layout();
      if (deal) requestAnimationFrame(() => requestAnimationFrame(() => this.nodes.forEach(n => n.classList.remove('is-dealing'))));
    }
    layout() {
      const W = this.host.clientWidth, Hh = this.host.clientHeight;
      if (!W || !Hh) return;
      const all = this.cards.map(c => ({ q: c.q, r: c.r })).concat(this.opts.cells);
      if (!all.length) { this.svg.innerHTML = ''; this.pills.replaceChildren(); return; }
      const b = H.bounds(all);
      const bw = b.maxX - b.minX, bh = b.maxY - b.minY, pad = this.opts.pad;
      const R = Math.max(10, Math.min(this.opts.maxR, (W - pad * 2) / bw, (Hh - pad * 2) / bh));
      const ox = (W - bw * R) / 2 - b.minX * R, oy = (Hh - bh * R) / 2 - b.minY * R;
      this.R = R; this.ox = ox; this.oy = oy;
      this.stage.style.setProperty('--R', `${R}px`);
      const place = (node, c) => {
        const [x, y] = H.center(c);
        node.style.left = `${ox + (x - 1) * R}px`;
        node.style.top = `${oy + (y - H.SQ3 / 2) * R}px`;
        node.style.width = `${2 * R}px`;
        node.style.height = `${H.SQ3 * R}px`;
      };
      this.nodes.forEach((n, i) => place(n, this.cards[i]));
      (this.cellNodes || []).forEach((n, i) => {
        const c = this.opts.cells[i];
        place(n, c);
        n.hidden = this.cards.some(k => k.q === c.q && k.r === c.r);
      });
      this.drawSeams();
    }
    drawSeams() {
      const R = this.R, ox = this.ox, oy = this.oy;
      this.svg.setAttribute('viewBox', `0 0 ${this.host.clientWidth} ${this.host.clientHeight}`);
      if (!this.opts.seams) { this.svg.innerHTML = ''; this.pills.replaceChildren(); return; }
      const visible = this.cards.map((c, i) => ({ ...c, i })).filter(c => c.faceUp !== false);
      const seams = H.contacts(visible).map(s => ({ ...s, anchor: visible[s.anchor].i, force: visible[s.force].i }));
      this.svg.innerHTML = seams.map(s => {
        const [[x1, y1], [x2, y2]] = s.line.map(([x, y]) => [ox + x * R, oy + y * R]);
        const sx = x1 + (x2 - x1) * 0.12, sy = y1 + (y2 - y1) * 0.12, ex = x2 - (x2 - x1) * 0.12, ey = y2 - (y2 - y1) * 0.12;
        const strong = H.interpretation(s.a, s.b) ? ' is-named' : '';
        return `<line class="seam${strong}" x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}"/>`;
      }).join('');
      this.pills.replaceChildren(...(R < 46 ? [] : seams).map(s => {
        const [[x1, y1], [x2, y2]] = s.line;
        const p = el('span', { class: `seam-pill${H.interpretation(s.a, s.b) ? ' is-named' : ''}` }, `<b>${s.a}</b><i>·</i><b>${s.b}</b>`);
        p.style.left = `${ox + (x1 + x2) / 2 * R}px`; p.style.top = `${oy + (y1 + y2) / 2 * R}px`;
        p.style.fontSize = `${Math.max(9, Math.min(13, R * 0.11))}px`;
        return p;
      }));
      this.seams = seams;
    }
  }

  /* Map v1 lesson art IDs (e.g. "ace-of-coins", "fool") onto the canonical slugs. */
  function lessonSlug(id) {
    const s = id.replace(/-coins$/, '-pentacles');
    if (bySlug[s]) return s;
    if (bySlug['the-' + s]) return 'the-' + s;
    return s;
  }

  function trapModal(dialog) {
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  }

  window.UI = { esc, $, $$, el, hexCard, setCard, Board, prefs, store, announce, shuffle, rand, reducedMotion, lessonSlug, trapModal, ksButton, dayKey, dailyCard, cards, DECKS, bySlug };
})();
