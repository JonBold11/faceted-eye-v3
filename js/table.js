/* Faceted Eye v2 — the Reading Table. Deal any study spread (or an open grid)
   from either deck, reveal cards, turn them, and read top edges and seams live.
   State is mirrored into the URL so a reading can be shared or reloaded. */
(function () {
  'use strict';
  const { esc, $, $$, el, Board, prefs, announce, shuffle, rand, ksButton, cards, DECKS, bySlug, lessonSlug } = window.UI;
  const H = window.Hex;
  const C = window.FE_CONTENT;
  const LAYOUTS = Object.fromEntries(window.READING_LAYOUTS.map(l => [l.id, l]));
  const OPEN_CELLS = H.spiral(2);

  function positionsFor(spread) {
    if (spread === 'open') return [];
    return LAYOUTS[spread].boards[0].cards.map(c => ({ q: c.q, r: c.r, role: c.role }));
  }
  /* Studies with one to three cards stay upright, matching the teaching order. */
  const defaultOrient = spread => spread === 'open' ? 'turned' : (positionsFor(spread).length <= 3 ? 'upright' : 'turned');

  function encode(s) {
    const dealt = s.cards.map(c => `${bySlug[c.slug].index}.${H.mod(c.steps)}${c.faceUp ? '' : 'd'}${s.spread === 'open' ? `.${c.q}.${c.r}` : ''}`).join(',');
    return `#/table?deck=${s.deck}&spread=${s.spread}&o=${s.orient}${dealt ? `&c=${dealt}` : ''}`;
  }
  function decode(params, spread) {
    if (!params.c) return null;
    const pos = positionsFor(spread);
    const out = [];
    for (const part of params.c.split(',')) {
      const m = /^(\d+)\.(\d)(d?)(?:\.(-?\d+)\.(-?\d+))?$/.exec(part);
      if (!m || !cards[+m[1]]) return null;
      const i = out.length;
      const p = spread === 'open' ? { q: +m[4], r: +m[5], role: `Card ${i + 1}` } : pos[i];
      if (!p || Number.isNaN(p.q)) return null;
      out.push({ slug: cards[+m[1]].slug, steps: +m[2], faceUp: !m[3], q: p.q, r: p.r, role: p.role });
    }
    return out;
  }

  function table(params) {
    const spread = (params.spread && (LAYOUTS[params.spread] || params.spread === 'open')) ? params.spread : 'past-present-future';
    const s = {
      deck: DECKS[params.deck] ? params.deck : prefs.deck,
      spread,
      orient: params.o === 'upright' || params.o === 'turned' ? params.o : defaultOrient(spread),
      cards: [],
      selected: -1,
      question: (params.q || '').slice(0, 140)
    };
    prefs.deck = s.deck;
    const node = el('div', { class: 'view view-table' });
    node.innerHTML = `
      <section class="table-head">
        <div class="table-title"><p class="kicker">The Reading Table</p><h1>Deal a reading.</h1></div>
        <label class="question"><span class="sr-only">Your question</span><input type="text" maxlength="140" placeholder="Hold a question in mind — or type it here" autocomplete="off"></label>
      </section>
      <div class="table-controls">
        <div class="ctrl"><span class="ctrl-label">Deck</span>${window.Views.deckToggle(s.deck)}</div>
        <div class="ctrl ctrl-spread"><span class="ctrl-label">Spread</span><div class="spread-chips" role="group" aria-label="Spread">${C.tableSpreads.map(id => `<button type="button" data-spread="${id}" aria-pressed="${id === s.spread}">${esc(C.shortNames[id])}</button>`).join('')}</div></div>
        <div class="ctrl"><span class="ctrl-label">Orientation</span><div class="seg" role="group" aria-label="Orientation"><button type="button" data-orient="upright">Upright</button><button type="button" data-orient="turned">As drawn</button></div></div>
      </div>
      <div class="table-main">
        <div class="felt">
          <div class="felt-board"></div>
          <p class="felt-hint" hidden>Tap a card to turn it over</p>
          <div class="felt-empty" hidden><p>Tap any empty facet to draw a card into it.</p></div>
          <div class="felt-tools" hidden>
            <button type="button" class="round" data-sel-turn="-1" aria-label="Turn selected card counter-clockwise">↺</button>
            <span class="sel-name" aria-live="polite"></span>
            <button type="button" class="round" data-sel-turn="1" aria-label="Turn selected card clockwise">↻</button>
            <button type="button" class="round round-sm" data-sel-close aria-label="Deselect card">×</button>
          </div>
          <div class="felt-actions">
            <button type="button" class="btn btn-brass" data-deal>Shuffle &amp; deal</button>
            <button type="button" class="btn btn-ghost" data-reveal>Reveal all</button>
            <button type="button" class="btn btn-ghost" data-share><span class="share-label">Share</span></button>
            <label class="toggle"><input type="checkbox" data-order checked> <span>Numbers</span></label>
          </div>
        </div>
        <aside class="reading" aria-labelledby="reading-h">
          <div class="reading-head"><h2 id="reading-h"></h2><a class="reading-study" href="#"></a></div>
          <div class="reading-body"></div>
          <p class="fine reading-foot"><button type="button" class="linkish" data-copy-link>Copy a link to this reading</button><br>Draft mechanics. Edge values are prompts, not verdicts — no average, majority or automatic winner. A turn is not a reversal.</p>
        </aside>
      </div>`;

    const boardHost = $('.felt-board', node);
    const board = new Board(boardHost, { deck: s.deck, interactive: true, maxR: 150, pad: 22, thumb: true, onCard, onCell });

    function onCard(i) {
      const c = s.cards[i];
      if (!c.faceUp) {
        c.faceUp = true;
        s.selected = -1;
        announce(`${i + 1}, ${c.role}: ${bySlug[c.slug].name}. Top edge ${H.top(c.steps)}, ${H.WORDS[H.top(c.steps)]}.`);
      } else {
        s.selected = s.selected === i ? -1 : i;
      }
      sync();
    }
    function onCell(cell) {
      if (s.spread !== 'open') return;
      const used = new Set(s.cards.map(c => c.slug));
      const pool = cards.filter(c => !used.has(c.slug));
      if (!pool.length) return;
      const pick = pool[rand(pool.length)];
      s.cards.push({ slug: pick.slug, steps: s.orient === 'upright' ? 0 : rand(6), faceUp: true, q: cell.q, r: cell.r, role: `Card ${s.cards.length + 1}` });
      s.selected = -1;
      const c = s.cards[s.cards.length - 1];
      announce(`Card ${s.cards.length}: ${pick.name}. Top edge ${H.top(c.steps)}.`);
      sync({ deal: true });
    }

    function deal() {
      s.selected = -1;
      if (s.spread === 'open') { s.cards = []; sync(); return; }
      const pos = positionsFor(s.spread);
      const drawn = shuffle(cards).slice(0, pos.length);
      s.cards = pos.map((p, i) => ({ slug: drawn[i].slug, steps: s.orient === 'upright' ? 0 : rand(6), faceUp: false, q: p.q, r: p.r, role: p.role }));
      board.set([]);
      sync({ deal: true });
      announce(`${pos.length} card${pos.length > 1 ? 's' : ''} dealt face down. Select each to reveal it.`);
    }

    function sync(opt = {}) {
      board.opts.deck = s.deck;
      board.setCells(s.spread === 'open' ? OPEN_CELLS : []);
      board.set(s.cards.map((c, i) => ({ ...c, selected: i === s.selected })), opt);
      node.classList.toggle('hide-order', !$('[data-order]', node).checked);
      $('.felt-empty', node).hidden = !(s.spread === 'open' && !s.cards.length);
      const down = s.cards.filter(c => !c.faceUp).length;
      const hint = $('.felt-hint', node);
      hint.hidden = !down || s.selected >= 0;
      hint.textContent = down === s.cards.length ? 'Tap a card to turn it over' : (down ? `${down} still face down` : '');
      if (!down && s.cards.length > 1 && s.selected < 0 && s.spread !== 'open') { hint.hidden = false; hint.textContent = 'Tap a card to select and turn it'; }
      $('[data-reveal]', node).hidden = !s.cards.some(c => !c.faceUp);
      $('[data-deal]', node).innerHTML = s.spread === 'open' ? 'Clear<span class="long"> the table</span>' : (s.cards.length ? '<span class="long">Shuffle &amp; deal again</span><span class="short">Deal again</span>' : '<span class="long">Shuffle &amp; deal</span><span class="short">Deal</span>');
      $$('[data-orient]', node).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.orient === s.orient)));
      $$('[data-spread]', node).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.spread === s.spread)));
      $$('[data-deck-pick]', node).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.deckPick === s.deck)));
      node.dataset.deck = s.deck;
      const tools = $('.felt-tools', node);
      tools.hidden = s.selected < 0;
      if (s.selected >= 0) {
        const c = s.cards[s.selected];
        $('.sel-name', node).innerHTML = `<b>${s.selected + 1}</b> ${esc(bySlug[c.slug].name)} · <b>${H.top(c.steps)}</b> on top`;
      }
      renderReading();
      const hash = encode(s);
      if (location.hash !== hash) history.replaceState(null, '', hash);
    }

    function renderReading() {
      $('#reading-h', node).textContent = s.spread === 'open' ? 'Open table' : LAYOUTS[s.spread].title;
      const study = $('.reading-study', node);
      if (s.spread === 'open') { study.hidden = true; } else { study.hidden = false; study.href = `#/learn/${s.spread}`; study.textContent = 'Read the study →'; }
      const body = $('.reading-body', node);
      const q = s.question.trim();
      let html = q ? `<p class="reading-q">“${esc(q)}”</p>` : '';
      if (!s.cards.length) {
        html += s.spread === 'open'
          ? '<p class="muted">Draw cards anywhere on the grid. Each card you place beside another creates a seam, read from the earlier card (Anchor) to the later one (Force).</p>'
          : '<p class="muted">Shuffle and deal to begin. Cards land face down; turn them over in any order.</p>';
        body.innerHTML = html; return;
      }
      html += '<h3>Cards</h3><ol class="read-cards">' + s.cards.map((c, i) => {
        const card = bySlug[c.slug], t = H.top(c.steps);
        if (!c.faceUp) return `<li class="is-down"><span class="num">${i + 1}</span><div><p class="rc-role">${esc(c.role)}</p><p class="muted">Face down</p></div></li>`;
        return `<li class="${i === s.selected ? 'is-sel' : ''}" data-pick="${i}"><span class="num">${i + 1}</span><div><p class="rc-role">${esc(c.role)}</p><p class="rc-name">${esc(card.name)}</p><p class="rc-top"><span class="edge edge-${H.VALUE[t]}">${t}</span> ${H.WORDS[t]}${c.steps ? ` <small>· turned ${H.mod(c.steps) * 60}°</small>` : ''}</p><p class="rc-keys">${esc(card.keywords)}</p><p class="rc-prompt">${esc(card.prompt)}</p><button type="button" class="linkish" data-view-card="${card.index}">View card</button></div></li>`;
      }).join('') + '</ol>';
      const visible = s.cards.map((c, i) => ({ ...c, i })).filter(c => c.faceUp);
      const seams = H.contacts(visible).map(x => ({ ...x, anchor: visible[x.anchor].i, force: visible[x.force].i }));
      const total = H.contacts(s.cards).length;
      if (total) {
        html += `<h3>Seams <small>${seams.length} of ${total} revealed</small></h3>`;
        html += seams.length ? '<ol class="read-seams">' + seams.map(x => {
          const named = H.interpretation(x.a, x.b);
          return `<li class="${named ? 'is-named' : ''}"><p class="rs-pair"><span class="num">${x.anchor + 1}</span><b>${x.a}</b><i>→</i><b>${x.b}</b><span class="num">${x.force + 1}</span></p><p class="rs-who">${esc(s.cards[x.anchor].role)} meets ${esc(s.cards[x.force].role)}</p><p class="rs-name">${named ? esc(named.title) : 'Open pair'}</p><p>${named ? esc(named.text) : 'No fixed verdict. Read both cards, the direction and your question together.'}</p></li>`;
        }).join('') + '</ol>' : '<p class="muted">Reveal neighbouring cards to read their seams.</p>';
      } else if (s.cards.length > 1) {
        html += '<h3>Seams</h3><p class="muted">No two cards share a full side here. Gaps and corners are not seams — each card stands on its own top edge.</p>';
      }
      if (s.cards.length && s.cards.every(c => c.faceUp)) {
        html += `<div class="ks-card ks-card-reading"><div><p class="kicker">Coming to Kickstarter</p><p class="ks-line">Read with real cards. <strong>Feline Foresight</strong> is launching on Kickstarter.</p></div>${ksButton('Follow on Kickstarter', 'btn btn-brass btn-ks', 'table-reading')}</div>`;
      }
      body.innerHTML = html;
      $$('[data-view-card]', body).forEach(b => b.addEventListener('click', e => { e.stopPropagation(); window.Views.openCard(s.deck, +b.dataset.viewCard); }));
      $$('[data-pick]', body).forEach(li => li.addEventListener('click', () => { const i = +li.dataset.pick; s.selected = s.selected === i ? -1 : i; sync(); }));
    }

    /* Wiring. */
    $('.question input', node).value = s.question;
    $('.question input', node).addEventListener('input', e => { s.question = e.target.value; renderReading(); });
    $$('[data-deck-pick]', node).forEach(b => b.addEventListener('click', () => { s.deck = b.dataset.deckPick; prefs.deck = s.deck; sync(); }));
    $$('[data-spread]', node).forEach(b => b.addEventListener('click', () => {
      if (s.spread === b.dataset.spread) return;
      s.spread = b.dataset.spread; s.orient = defaultOrient(s.spread); s.cards = []; s.selected = -1;
      board.set([]);
      if (s.spread === 'open') sync(); else deal();
    }));
    $$('[data-orient]', node).forEach(b => b.addEventListener('click', () => {
      s.orient = b.dataset.orient;
      if (s.orient === 'upright') s.cards.forEach(c => { c.steps = 0; });
      else if (s.cards.length) s.cards.forEach(c => { c.steps = rand(6); });
      sync();
    }));
    $('[data-deal]', node).addEventListener('click', deal);
    $('[data-reveal]', node).addEventListener('click', () => { s.cards.forEach(c => { c.faceUp = true; }); sync(); announce('All cards revealed.'); });
    $('[data-order]', node).addEventListener('change', () => sync());
    $$('[data-sel-turn]', node).forEach(b => b.addEventListener('click', () => turnSelected(+b.dataset.selTurn)));
    $('[data-sel-close]', node).addEventListener('click', () => { s.selected = -1; sync(); });
    $('[data-share]', node).addEventListener('click', async e => {
      const btn = e.currentTarget;
      const shown = s.cards.filter(c => c.faceUp);
      if (!shown.length) { announce('Reveal a card first.'); return; }
      btn.disabled = true;
      try {
        const title = s.spread === 'open' ? 'Open table' : LAYOUTS[s.spread].title;
        const lines = shown.length === 1
          ? [[`${H.top(shown[0].steps)} — ${H.WORDS[H.top(shown[0].steps)]}`, '#c2a56d'], [bySlug[shown[0].slug].name, '#f2ede3']]
          : [[shown.map(c => bySlug[c.slug].name).slice(0, 4).join(' · ') + (shown.length > 4 ? ' …' : ''), 'rgba(242,237,227,.75)']];
        await window.FE_SHARE.share({ deck: s.deck, cards: shown.map(c => ({ q: c.q, r: c.r, slug: c.slug, steps: c.steps })), question: s.question.trim(), kicker: 'A reading', title, lines });
      } finally { btn.disabled = false; }
    });
    $('[data-copy-link]', node).addEventListener('click', async e => {
      const url = location.href.split('#')[0] + encode(s);
      const btn = e.currentTarget;
      try { await navigator.clipboard.writeText(url); btn.textContent = 'Link copied'; }
      catch (err) { window.prompt('Copy this link', url); }
      setTimeout(() => { btn.textContent = 'Copy a link to this reading'; }, 1800);
    });
    function turnSelected(n) {
      if (s.selected < 0) return;
      const c = s.cards[s.selected];
      c.steps += n;
      sync();
      announce(`Top edge ${H.top(c.steps)}, ${H.WORDS[H.top(c.steps)]}.`);
    }
    const onKey = e => {
      if (e.target.closest('input,textarea,select') || document.querySelector('dialog[open]')) return;
      if (e.key.toLowerCase() === 'r' && s.selected >= 0) { e.preventDefault(); turnSelected(e.shiftKey ? -1 : 1); }
      else if (e.key === 'Escape' && s.selected >= 0) { s.selected = -1; sync(); }
    };
    document.addEventListener('keydown', onKey);

    /* Initial state: from the URL if present, otherwise a fresh deal. */
    const restored = decode(params, s.spread);
    if (restored) { s.cards = restored; sync(); }
    else if (s.spread === 'open') sync();
    else deal();

    return { node, destroy: () => { board.destroy(); document.removeEventListener('keydown', onKey); } };
  }

  window.Views.table = table;
})();
