/* Faceted Eye v3 — page views. Each view returns { node, destroy? }. */
(function () {
  'use strict';
  const { esc, $, $$, el, hexCard, setCard, Board, prefs, announce, shuffle, rand, reducedMotion, lessonSlug, ksButton, cards, DECKS, bySlug } = window.UI;
  const H = window.Hex;
  const C = window.FE_CONTENT;
  const LAYOUTS = Object.fromEntries(window.READING_LAYOUTS.map(l => [l.id, l]));

  const ladderHTML = (active) => `<ol class="ladder" aria-label="Top-edge answer scale">${H.LADDER.map(n => `<li data-n="${n}"${n === active ? ' class="is-on" aria-current="true"' : ''}><b>${n}</b><span>${H.WORDS[n]}</span></li>`).join('')}</ol>`;
  const deckToggle = (current, label = 'Deck') => `<div class="seg" role="group" aria-label="${label}">${Object.values(DECKS).map(d => `<button type="button" data-deck-pick="${d.id}" aria-pressed="${d.id === current}">${esc(d.short)}</button>`).join('')}</div>`;
  const suitLabel = c => c.arcana === 'major' ? `Major Arcana · ${toRoman(c.number)}` : `${c.suit[0].toUpperCase() + c.suit.slice(1)} · Minor Arcana`;
  function toRoman(n) { if (n === 0) return '0'; const m = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let s = ''; for (const [v, r] of m) while (n >= v) { s += r; n -= v; } return s; }

  function deckTile(d) {
    const fool = bySlug['the-fool'];
    return `<a class="deck-tile deck-tile-${d.id}" href="#/decks/${d.id}">
      <span class="deck-tile-art"><span class="dt-front">${hexCard({ deck: d.id, slug: 'the-fool', thumb: true }).outerHTML}</span><span class="dt-back">${hexCard({ deck: d.id, slug: 'the-fool', faceUp: false, thumb: true }).outerHTML}</span></span>
      <span class="deck-tile-copy"><span class="kicker">${esc(d.status)}</span><span class="deck-tile-name">${esc(d.name)}</span><span class="deck-tile-tag">${esc(d.tagline)}</span><span class="deck-tile-cta">Browse all 78 <span aria-hidden="true">→</span></span></span>
    </a>`;
  }

  /* ================= DECKS INDEX ================= */
  function decks() {
    const node = el('div', { class: 'view view-decks' });
    node.innerHTML = `<section class="page-head"><p class="kicker">The decks</p><h1>Two worlds, one geometry.</h1><p class="lede">Every Faceted Eye deck shares the same hexagonal frame and numbered edges, and every back carries a hexafoil that looks the same under any sixty-degree turn — so a face-down card never gives its orientation away.</p></section>
      <div class="deck-duo deck-duo-page">${Object.values(DECKS).map(d => deckTile(d)).join('')}</div>`;
    return { node };
  }

  /* ================= DECK ================= */
  function deck(id, params) {
    const d = DECKS[id];
    if (!d) return notFound();
    prefs.deck = id;
    const lead = id === (window.FE_CONFIG.LEAD_DECK || 'feline');
    const node = el('div', { class: `view view-deck deck-${id}` });
    const filters = [['all', 'All 78'], ['major', 'Major'], ['wands', 'Wands'], ['cups', 'Cups'], ['swords', 'Swords'], ['pentacles', 'Pentacles']];
    node.innerHTML = `
      <section class="deck-hero">
        <div class="deck-hero-art"><div class="deck-hero-card"></div><div class="deck-hero-back"></div></div>
        <div class="deck-hero-copy">
          <a class="crumb" href="#/decks">← All decks</a>
          <p class="kicker">${esc(d.status)}</p>
          <h1>${esc(d.name)}</h1>
          <p class="deck-tag">${esc(d.tagline)}</p>
          <p>${esc(d.blurb)}</p>
          <div class="hero-actions">${ksButton(lead ? 'Follow on Kickstarter' : 'Follow the studio on Kickstarter', 'btn btn-brass btn-ks', 'deck-hero-' + id)}<a class="btn btn-ghost" href="#/table?deck=${id}&spread=past-present-future">Try it on the table</a></div>
          <p class="fine">${lead ? 'Launching on Kickstarter. Following is free — you’ll be told the day it goes live.' : 'In development after Feline Foresight. Follow the studio to hear when it’s next.'}</p>
        </div>
      </section>

      <section class="deck-band flip" aria-labelledby="flip-h">
        <div class="flip-inner">
          <div class="flip-copy"><p class="kicker">Flip through</p><h2 id="flip-h">A few of the seventy-eight.</h2><p>${esc(lead ? 'Every archetype is played by a cat — engraved in black and white, with a sly sense of mischief.' : 'Cobalt temples, waterfalls and eclipses, framed in carved terracotta.')}</p>
            <div class="flip-controls"><button type="button" class="round" data-flip-step="-1" aria-label="Previous card">←</button><button type="button" class="round" data-flip-play aria-label="Pause flip-through">❚❚</button><button type="button" class="round" data-flip-step="1" aria-label="Next card">→</button><span class="flip-name" aria-live="polite"></span></div>
          </div>
          <div class="flip-stage"><div class="flip-card"></div></div>
        </div>
      </section>

      <section class="deck-band geo" aria-labelledby="geo-h">
        <div class="geo-inner">
          <p class="kicker">What makes it different</p>
          <h2 id="geo-h">Tarot with the geometry of a die.</h2>
          <div class="geo-grid">
            <div><b>6</b><h3>Six numbered edges</h3><p>I, II, IV, VI, V, III, clockwise from the top. Opposite edges add up to seven, like the faces of a die.</p></div>
            <div><b>↻</b><h3>The turn answers</h3><p>Whichever numeral lands on top gives a yes-or-no answer, from I — Yes! to VI — No! The image keeps its traditional meaning.</p></div>
            <div><b>⬡⬡</b><h3>Edges that touch</h3><p>Cards laid side by side meet on full edges. Each pair of touching numerals adds a voice to the reading.</p></div>
          </div>
        </div>
      </section>

      <section class="deck-band box" aria-labelledby="box-h">
        <div class="box-inner">
          <div><p class="kicker">In the deck</p><h2 id="box-h">The full tarot, reshaped.</h2>
            <ul class="box-list"><li><b>78</b> cards — 22 Major Arcana and 14 in each suit</li><li><b>Hexagonal</b> cards with six numbered edges</li><li><b>A hexafoil back</b> that looks the same at every turn, so a face-down card never gives its orientation away</li><li><b>Traditional symbolism</b> you already know</li></ul>
            <p class="fine">Box, guidebook, card size and pricing will be announced with the campaign. Artwork shown is the current design.</p>
          </div>
          <div class="box-art"><span class="box-back"></span><span class="box-front"></span></div>
        </div>
      </section>

      <section class="deck-browse" aria-labelledby="browse-h">
        <div class="browse-head"><h2 id="browse-h">The cards</h2><div class="chips" role="group" aria-label="Filter cards">${filters.map(([k, l], i) => `<button type="button" data-filter="${k}" aria-pressed="${i === 0}">${l}</button>`).join('')}</div></div>
        <ul class="card-grid" role="list"></ul>
      </section>

      <section class="deck-band deck-faq" aria-labelledby="faq-h">
        <div class="faq-inner">
          <h2 id="faq-h">Questions</h2>
          <details><summary>When can I get it?</summary><p>${lead ? 'Feline Foresight is launching on Kickstarter. Follow the campaign and Kickstarter will email you the day it goes live.' : 'Maya-inspired Horror is in development and will follow Feline Foresight. No date has been set.'}</p></details>
          <details><summary>Do I need to learn a new system?</summary><p>No. The cards carry their familiar meanings, so you can read them like any tarot deck. The edges are an extra layer you can use when you want to.</p></details>
          <details><summary>Is a turned card the same as a reversed card?</summary><p>No. Turning a card changes which numbered edge is on top and which edges touch its neighbours. It doesn’t prescribe a traditional reversed meaning.</p></details>
          <details><summary>How is the artwork made?</summary><p>The illustrations are AI-generated, guided by Jon’s creative direction, combined with a reusable frame and typography, and reviewed for symbolism and consistency.</p></details>
        </div>
        <div class="ks-card ks-card-wide"><div><p class="kicker">${lead ? 'Coming to Kickstarter' : 'From the same studio'}</p><p class="ks-line">${lead ? 'Be there on launch day. <strong>Follow Feline Foresight on Kickstarter.</strong>' : 'Feline Foresight launches first. <strong>Follow it on Kickstarter</strong> to hear about this deck too.'}</p></div>${ksButton('Follow on Kickstarter', 'btn btn-brass btn-ks', 'deck-footer-' + id)}</div>
      </section>`;
    const heroCard = hexCard({ deck: id, slug: 'the-fool', thumb: false, lift: true });
    $('.deck-hero-card', node).append(heroCard);
    const back = hexCard({ deck: id, slug: 'the-fool', faceUp: false, thumb: true });
    $('.deck-hero-back', node).append(back, el('span', { class: 'cap' }, 'The back'));
    $('.deck-hero-back', node).setAttribute('aria-label', d.backAlt);
    $('.deck-hero-back', node).setAttribute('role', 'img');

    const grid = $('.card-grid', node);
    cards.forEach(c => {
      const li = el('li', { 'data-group': c.arcana === 'major' ? 'major' : c.suit });
      const b = el('button', { type: 'button', class: 'grid-card', 'aria-label': `${c.name} — open` });
      b.append(hexCard({ deck: id, slug: c.slug }), el('span', { class: 'grid-name' }, esc(c.name)));
      b.addEventListener('click', () => openCard(id, c.index));
      li.append(b); grid.append(li);
    });
    $$('[data-filter]', node).forEach(btn => btn.addEventListener('click', () => {
      $$('[data-filter]', node).forEach(x => x.setAttribute('aria-pressed', String(x === btn)));
      const f = btn.dataset.filter;
      $$('li', grid).forEach(li => { li.hidden = f !== 'all' && li.dataset.group !== f; });
      announce(`${$$('li:not([hidden])', grid).length} cards shown`);
    }));

    /* The hero card turns slowly through its six orientations. */
    const timers = [];
    let s = 0;
    if (!reducedMotion()) timers.push(setInterval(() => { if (!document.hidden) setCard(heroCard, { steps: ++s }); }, 2600));

    /* Flip-through: a curated run of cards, flipping like a deck being shown. */
    const FLIP = ['the-fool', 'the-magician', 'the-high-priestess', 'the-lovers', 'strength', 'the-hermit', 'death', 'the-devil', 'the-star', 'the-moon', 'the-sun', 'the-world', 'queen-of-cups', 'king-of-wands', 'ace-of-swords', 'nine-of-pentacles'];
    let fi = 0, playing = !reducedMotion();
    const flipCard = hexCard({ deck: id, slug: FLIP[0], thumb: false, lift: true });
    $('.flip-card', node).append(flipCard);
    const flipName = $('.flip-name', node);
    flipName.textContent = bySlug[FLIP[0]].name;
    const showFlip = n => {
      fi = (fi + n + FLIP.length) % FLIP.length;
      setCard(flipCard, { faceUp: false });
      setTimeout(() => { setCard(flipCard, { slug: FLIP[fi], thumb: false, faceUp: true }); flipName.textContent = bySlug[FLIP[fi]].name; }, reducedMotion() ? 0 : 380);
    };
    const playBtn = $('[data-flip-play]', node);
    const setPlay = p => { playing = p; playBtn.textContent = p ? '❚❚' : '▶'; playBtn.setAttribute('aria-label', p ? 'Pause flip-through' : 'Play flip-through'); };
    setPlay(playing);
    timers.push(setInterval(() => { if (playing && !document.hidden) showFlip(1); }, 2400));
    playBtn.addEventListener('click', () => setPlay(!playing));
    $$('[data-flip-step]', node).forEach(b => b.addEventListener('click', () => { setPlay(false); showFlip(+b.dataset.flipStep); }));
    $('.flip-stage', node).addEventListener('click', () => { setPlay(false); showFlip(1); });

    $('.box-back', node).append(hexCard({ deck: id, slug: 'the-fool', faceUp: false }));
    $('.box-front', node).append(hexCard({ deck: id, slug: 'the-star', steps: 1 }));

    if (params.card != null) setTimeout(() => openCard(id, +params.card), 50);
    return { node, destroy: () => timers.forEach(t => clearInterval(t)) };
  }

  /* ================= CARD MODAL ================= */
  function openCard(deckId, index) {
    const modal = $('#modal');
    let d = DECKS[deckId], i = index, steps = 0, faceUp = true;
    modal.className = `modal modal-card deck-${deckId}`;
    modal.innerHTML = `<div class="modal-bar"><span class="kicker modal-deck"></span><button type="button" class="close" data-close aria-label="Close">Close ×</button></div>
      <div class="cardview">
        <div class="cardview-art"><div class="cardview-card"></div>
          <div class="turn-row"><button type="button" class="round" data-t="-1" aria-label="Turn counter-clockwise">↺</button><output class="turn-readout"></output><button type="button" class="round" data-t="1" aria-label="Turn clockwise">↻</button></div>
        </div>
        <div class="cardview-copy">
          <p class="kicker cv-suit"></p><h2 id="modal-title" tabindex="-1"></h2>
          <p class="cv-keys"></p><p class="cv-prompt"></p>
          <p class="fine">Turning a card changes which edge is on top — it is not a reversal. Keywords are traditional upright associations, offered as a starting point.</p>
          <div class="cv-actions">${deckToggle(deckId, 'Show this card in')}<button type="button" class="btn btn-ghost btn-sm" data-flip>Show back</button></div>
          <div class="cv-nav"><button type="button" class="btn btn-ghost btn-sm" data-step="-1">← Previous</button><span class="cv-count"></span><button type="button" class="btn btn-ghost btn-sm" data-step="1">Next →</button></div>
        </div>
      </div>`;
    const node = hexCard({ deck: deckId, slug: cards[i].slug, thumb: false, lift: true });
    $('.cardview-card', modal).append(node);
    const render = () => {
      const c = cards[i];
      setCard(node, { deck: d.id, slug: c.slug, steps, faceUp, thumb: false });
      modal.className = `modal modal-card deck-${d.id}`;
      $('.modal-deck', modal).textContent = d.name;
      $('.cv-suit', modal).textContent = suitLabel(c);
      $('#modal-title', modal).textContent = c.name;
      $('.cv-keys', modal).textContent = c.keywords;
      $('.cv-prompt', modal).textContent = c.prompt;
      $('.cv-count', modal).textContent = `${i + 1} / 78`;
      const t = H.top(steps);
      $('.turn-readout', modal).innerHTML = `<b>${t}</b> on top · ${H.WORDS[t]}`;
      $('[data-flip]', modal).textContent = faceUp ? 'Show back' : 'Show front';
      $$('[data-deck-pick]', modal).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.deckPick === d.id)));
    };
    const step = n => { i = (i + n + 78) % 78; steps = 0; faceUp = true; render(); announce(cards[i].name); };
    $$('[data-t]', modal).forEach(b => b.addEventListener('click', () => { steps += +b.dataset.t; render(); }));
    $$('[data-step]', modal).forEach(b => b.addEventListener('click', () => step(+b.dataset.step)));
    $('[data-flip]', modal).addEventListener('click', () => { faceUp = !faceUp; render(); });
    $$('[data-deck-pick]', modal).forEach(b => b.addEventListener('click', () => { d = DECKS[b.dataset.deckPick]; render(); }));
    $('[data-close]', modal).addEventListener('click', () => modal.close());
    modal.onkeydown = e => {
      if (e.target.closest('input,select,textarea')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      else if (e.key.toLowerCase() === 'r') { steps += e.shiftKey ? -1 : 1; render(); }
    };
    /* Swipe between cards on touch screens. */
    let sx = null;
    $('.cardview-art', modal).addEventListener('pointerdown', e => { sx = e.clientX; });
    $('.cardview-art', modal).addEventListener('pointerup', e => { if (sx != null && Math.abs(e.clientX - sx) > 60) step(e.clientX < sx ? 1 : -1); sx = null; });
    render();
    const opener = document.activeElement;
    modal.onclose = () => { if (opener && opener.focus) opener.focus(); };
    modal.showModal();
    $('#modal-title', modal).focus();
  }

  /* ================= LEARN ================= */
  function learn() {
    const deckId = prefs.deck;
    const node = el('div', { class: 'view view-learn' });
    node.innerHTML = `<section class="page-head"><p class="kicker">The Reading Lab</p><h1>Learn to read the edges.</h1>
      <p class="lede">Ten draft studies. The first three stay upright; rotation enters at four cards. Positions come from familiar spreads, rearranged so the cards meet on full sides.</p>
      <div class="head-tools"><span class="fine">Illustrate with</span>${deckToggle(deckId)}<a class="btn btn-ghost btn-sm" href="#/learn/cheat-sheet">One-page cheat sheet</a></div></section>
      <ol class="lesson-list"></ol>
      <section class="primer" aria-labelledby="primer-h"><h2 id="primer-h">The rules, so far</h2>
        <div class="primer-grid">
          <div><h3>Top edge</h3><p>The numeral on top answers a yes-or-no question on a six-step scale.</p>${ladderHTML('')}</div>
          <div><h3>Anchor → Force</h3><p>When two cards share a full side, read the earlier card’s edge, then the later card’s. Corners and gaps don’t count.</p></div>
          <div><h3>Named pairs</h3><p><b>I · I</b> — emphatic affirmation. <b>VI · VI</b> — Critical Block. <b>I → VI</b> — a yes meets resistance. <b>VI → I</b> — a no is challenged. Every other pair is read in context.</p></div>
          <div><h3>Not a reversal</h3><p>Turning a card changes its edges, not its meaning. There is no average, majority vote or automatic winner.</p></div>
        </div>
        <p class="fine">Draft mechanics. How a physical draw preserves its rotation is still being developed.</p>
      </section>`;
    const list = $('.lesson-list', node);
    const boards = [];
    const build = dId => {
      boards.forEach(b => b.destroy()); boards.length = 0; list.replaceChildren();
      C.lessonOrder.forEach((lid, n) => {
        const l = LAYOUTS[lid];
        const li = el('li');
        li.innerHTML = `<a class="lesson-tile" href="#/learn/${lid}"><span class="lt-board"></span><span class="lt-copy"><span class="lt-num">${String(n + 1).padStart(2, '0')}</span><span class="lt-title">${esc(l.title)}</span><span class="lt-sum">${esc(l.summary)}</span><span class="lt-meta">${l.boards[0].cards.length} card${l.boards[0].cards.length > 1 ? 's' : ''}${l.boards[0].cards.some(c => c.steps) ? ' · turned' : ' · upright'}</span></span></a>`;
        list.append(li);
        const b = new Board($('.lt-board', li), { deck: dId, maxR: 60, pad: 6 });
        b.set(l.boards[0].cards.map(c => ({ ...c, slug: lessonSlug(c.art) })));
        boards.push(b);
      });
    };
    build(deckId);
    $$('[data-deck-pick]', node).forEach(b => b.addEventListener('click', () => { prefs.deck = b.dataset.deckPick; $$('[data-deck-pick]', node).forEach(x => x.setAttribute('aria-pressed', String(x === b))); build(b.dataset.deckPick); }));
    return { node, destroy: () => boards.forEach(b => b.destroy()) };
  }

  /* ================= LESSON ================= */
  function lesson(id) {
    if (id === 'cheat-sheet') return cheatSheet();
    const l = LAYOUTS[id];
    if (!l) return notFound();
    const deckId = prefs.deck;
    const n = C.lessonOrder.indexOf(id);
    const next = C.lessonOrder[n + 1];
    const node = el('div', { class: 'view view-lesson' });
    node.innerHTML = `<section class="story-head"><a class="crumb" href="#/learn">← All studies</a><div class="story-title"><p class="kicker">Study ${String(n + 1).padStart(2, '0')} of ${C.lessonOrder.length}</p><h1>${esc(l.title)}</h1></div>${deckToggle(deckId, 'Illustrate with')}</section>
      <div class="story" aria-roledescription="carousel" aria-label="${esc(l.title)} — steps">
        <div class="story-bars" aria-hidden="true"></div>
        <div class="story-track" tabindex="0"></div>
        <div class="story-nav"><button type="button" class="round" data-story="-1" aria-label="Previous step">←</button><span class="story-count" aria-live="polite"></span><button type="button" class="round" data-story="1" aria-label="Next step">→</button></div>
      </div>`;
    const track = $('.story-track', node), bars = $('.story-bars', node), count = $('.story-count', node);
    const boards = [];
    const slide = (cls, html) => { const s = el('section', { class: `story-slide ${cls}` }, html); track.append(s); return s; };
    const addBoard = (host, list, dId) => { const b = new Board(host, { deck: dId, maxR: 120, pad: 12, thumb: list.length > 4 }); b.set(list); boards.push(b); };

    const build = dId => {
      boards.forEach(b => b.destroy()); boards.length = 0; track.replaceChildren();
      const first = l.boards[0].cards.map(c => ({ ...c, slug: lessonSlug(c.art) }));
      const s0 = slide('slide-intro', `<div class="slide-board"></div><div class="slide-text"><p class="slide-big">${esc(l.summary)}</p><p class="fine">${first.length} card${first.length > 1 ? 's' : ''} · ${first.some(c => c.steps) ? 'turned' : 'upright'} · swipe to continue</p></div>`);
      addBoard($('.slide-board', s0), first, dId);
      l.paragraphs.forEach(p => slide('slide-para', `<p class="slide-big">${esc(p)}</p>`));
      if (l.positions) slide('slide-positions', `<h2>The positions</h2><dl class="positions">${l.positions.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`);
      l.boards.forEach(board => {
        const list = board.cards.map(c => ({ ...c, slug: lessonSlug(c.art) }));
        const seams = H.contacts(list);
        const s = slide('slide-read', `<h2>${esc(board.title)}</h2><div class="slide-board"></div>
          <ol class="read-list">${list.map((c, i) => `<li><span class="num">${i + 1}</span><span><b>${esc(c.role)}</b> — ${esc(bySlug[c.slug].name)}<br><small>${c.steps ? H.mod(c.steps) * 60 + '° turned' : 'Upright'} · top ${H.top(c.steps)} — ${H.WORDS[H.top(c.steps)]}</small></span></li>`).join('')}</ol>
          ${seams.length ? `<h3>Touching edges</h3><ol class="read-list seams">${seams.map(x => { const named = H.interpretation(x.a, x.b); return `<li><span class="num pair">${x.anchor + 1}→${x.force + 1}</span><span><b>${x.a} → ${x.b}</b>${named ? ` · ${esc(named.title)}` : ''}<br><small>${named ? esc(named.text) : 'Open pair — read in context.'}</small></span></li>`; }).join('')}</ol>` : `<p class="fine">${list.length === 1 ? 'One card gives a baseline, not a pair.' : 'No full sides touch — corners and gaps don’t count.'}</p>`}`);
        addBoard($('.slide-board', s), list, dId);
      });
      if (l.example) slide('slide-para', `<h2>An example</h2><p class="slide-mid">${esc(l.example)}</p>${l.geometry ? `<p class="fine">${esc(l.geometry)}</p>` : ''}`);
      slide('slide-end', `<p class="kicker">Your turn</p><h2>Try ${esc(l.title)} with your own cards.</h2>
        <div class="slide-actions"><a class="btn btn-brass" href="#/table?spread=${id}&deck=${dId}">Deal it on the table →</a>${next ? `<a class="btn btn-ghost" href="#/learn/${next}">Next: ${esc(LAYOUTS[next].title)}</a>` : `<a class="btn btn-ghost" href="#/learn/cheat-sheet">Open the cheat sheet</a>`}</div>
        ${l.open ? `<p class="fine">${esc(l.open)}</p>` : ''}${l.source ? `<p class="fine">${esc(l.source)}</p>` : ''}<p class="fine">Shown with ${esc(DECKS[dId].name)}. The source notes call Pentacles “Coins.”</p>`);
      const total = track.children.length;
      bars.innerHTML = Array.from({ length: total }, () => '<span></span>').join('');
      track.scrollLeft = 0;
      update();
    };
    let current = 0;
    function update() {
      const w = track.clientWidth || 1;
      current = Math.round(track.scrollLeft / w);
      const total = track.children.length;
      $$('span', bars).forEach((b, i) => b.classList.toggle('is-done', i <= current));
      count.textContent = `${current + 1} / ${total}`;
      $('[data-story="-1"]', node).disabled = current === 0;
      $('[data-story="1"]', node).disabled = current >= total - 1;
    }
    const go = d => track.scrollTo({ left: (current + d) * track.clientWidth, behavior: reducedMotion() ? 'auto' : 'smooth' });
    track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    $$('[data-story]', node).forEach(b => b.addEventListener('click', () => go(+b.dataset.story)));
    track.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); go(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); } });
    build(deckId);
    $$('[data-deck-pick]', node).forEach(b => b.addEventListener('click', () => { prefs.deck = b.dataset.deckPick; $$('[data-deck-pick]', node).forEach(x => x.setAttribute('aria-pressed', String(x === b))); build(b.dataset.deckPick); }));
    return { node, destroy: () => boards.forEach(b => b.destroy()) };
  }

  /* ================= CHEAT SHEET (printable) ================= */
  function cheatSheet() {
    const node = el('div', { class: 'view view-cheat' });
    node.innerHTML = `<section class="page-head"><a class="crumb" href="#/learn">← The Reading Lab</a><p class="kicker">Cheat sheet</p><h1>The Faceted Eye, on one page.</h1>
      <div class="head-tools"><button type="button" class="btn btn-ghost btn-sm" data-print>Print or save as PDF</button></div></section>
      <div class="cheat">
        <section><h2>1 · The edges</h2><p>Clockwise from the upright top: <b>I, II, IV, VI, V, III</b>. Opposite edges add up to seven, like the faces of a die.</p></section>
        <section><h2>2 · The top answers</h2>${ladderHTML('')}<p>Read the numeral on top for a yes-or-no question. The card keeps its usual meaning.</p></section>
        <section><h2>3 · Touching edges</h2><p>When two cards share a full side, read the earlier card’s edge, then the later card’s: <b>Anchor → Force</b>. Corners and gaps don’t count.</p></section>
        <section><h2>4 · Named pairs</h2><dl class="positions"><dt>I · I</dt><dd>Fuck yes — emphatic affirmation, not certainty.</dd><dt>VI · VI</dt><dd>Critical Block — maximal resistance.</dd><dt>I → VI</dt><dd>A yes meets resistance.</dd><dt>VI → I</dt><dd>A no is challenged.</dd><dt>Others</dt><dd>Read in context — no average, vote or automatic winner.</dd></dl></section>
        <section><h2>5 · Not a reversal</h2><p>Turning a card changes its edges, not its meaning. Start upright with one to three cards; rotation enters at four.</p></section>
        <section><h2>6 · Ten studies</h2><ol class="cheat-list">${C.lessonOrder.map(lid => `<li><b>${esc(LAYOUTS[lid].title)}</b> — ${esc(LAYOUTS[lid].summary)}</li>`).join('')}</ol></section>
      </div>
      <p class="fine cheat-foot">The Faceted Eye · ${esc((window.FE_CONFIG.SITE_URL || '').replace(/^https?:\/\//, ''))} · Draft mechanics.</p>`;
    $('[data-print]', node).addEventListener('click', () => window.print());
    return { node };
  }

  /* ================= GOODS ================= */
  function goods(id) {
    const node = el('div', { class: 'view view-goods' });
    node.innerHTML = `<section class="page-head"><p class="kicker">Goods</p><h1>A little attitude, in cotton.</h1><p class="lede">Shirt designs from the Faceted Eye studio, shown as Printify-generated mockups — digital previews, not photographs of manufactured samples. Nothing here is for sale.</p></section>
      <div class="goods-list">${C.goods.map(g => `<article class="good" id="good-${g.id}" aria-labelledby="gh-${g.id}">
        <div class="good-gallery"><img class="good-main" src="assets/goods/${g.id}/${g.views[0][0]}" alt="${esc(g.views[0][2])}" width="1200" height="1200">
          <div class="good-thumbs" role="group" aria-label="${esc(g.name)} views">${g.views.map((v, i) => `<button type="button" data-view="${i}" aria-pressed="${i === 0}" aria-label="${esc(v[1])}"><img src="assets/goods/${g.id}/${v[0]}" alt="" loading="lazy" width="1200" height="1200"></button>`).join('')}</div></div>
        <div class="good-copy"><p class="kicker">Design preview · not for sale</p><h2 id="gh-${g.id}">${esc(g.name)}</h2><p class="good-line-lg">${esc(g.line)}</p><p>${esc(g.description)}</p><p class="good-view" aria-live="polite">${esc(g.views[0][1])}</p></div>
      </article>`).join('')}</div>`;
    C.goods.forEach(g => {
      const art = $(`#good-${g.id}`, node);
      $$('[data-view]', art).forEach(b => b.addEventListener('click', () => {
        const v = g.views[+b.dataset.view];
        const main = $('.good-main', art); main.src = `assets/goods/${g.id}/${v[0]}`; main.alt = v[2];
        $('.good-view', art).textContent = v[1];
        $$('[data-view]', art).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      }));
    });
    if (id) setTimeout(() => { const t = $(`#good-${id}`, node); if (t) t.scrollIntoView({ block: 'start' }); }, 30);
    return { node };
  }

  /* ================= ABOUT ================= */
  function about() {
    const node = el('div', { class: 'view view-about' });
    node.innerHTML = `<section class="page-head about-head"><img src="assets/brand/faceted-eye-ivory.svg" width="200" height="100" alt="" aria-hidden="true"><p class="kicker">About</p><h1>You know the cards. Now challenge the way you read them.</h1></section>
      <div class="prose">
        <p class="lede">You’ve learned their meanings. You have your favorite spreads. But familiar doesn’t have to mean finished.</p>
        <p>Turn a card. Change what touches it. Watch a familiar reading ask something new of you.</p>
        <p>This isn’t a shortcut, and it isn’t a beginner’s deck. It asks for attention, curiosity, and a willingness to question your first impression.</p>
        <p><strong>Bring what you know. See where it takes you.</strong></p>
        <h2>Why a faceted eye?</h2>
        <p>An insect’s compound eye is built from hexagonal facets, each catching a slightly different view of the same world. These cards work the same way: one familiar image, six edges, and a reading that depends on the angle you hold it at and what sits beside it. Every deck back carries a hexafoil — six petals around a centre — designed to look identical under every sixty-degree turn.</p>
        <h2>Questions</h2>
        <details open><summary>How is the artwork made?</summary><p>The illustrations are AI-generated, guided by Jon’s creative direction. Each deck combines those images with a reusable frame and typography, with symbolism and visual consistency reviewed during development.</p></details>
        <details><summary>Can I buy a deck or a shirt?</summary><p>Not yet. Feline Foresight is coming to Kickstarter — follow the campaign to hear the day it launches. Nothing is sold on this site; pricing and details will come with the campaign.</p></details>
        <details><summary>Do you track me?</summary><p>Only an anonymous visitor count, with no cookies and no personal data. Your question never leaves your device, and your daily-card streak is stored only in your browser.</p></details>
        <details><summary>Is a turned card the same as a reversed card?</summary><p>No. Turning a card changes which numbered edge is on top and which edges touch its neighbours. It does not prescribe a traditional reversed meaning.</p></details>
        <details><summary>Are the rules final?</summary><p>No. The Reading Lab is a working draft. The top-edge scale and the named pairs are established; everything else is read in context, with no average, vote or automatic winner. How a physical draw preserves its rotation is still being developed.</p></details>
      </div>`;
    return { node };
  }

  /* ================= MORE ================= */
  function more() {
    const node = el('div', { class: 'view view-more' });
    node.innerHTML = `<section class="page-head"><p class="kicker">More</p><h1>Everything else.</h1></section>
      <ul class="more-list">
        <li><a href="#/about"><span class="more-name">About</span><span class="more-line">Why a faceted eye, how the artwork is made, and questions.</span></a></li>
        <li><a href="#/goods"><span class="more-name">Goods</span><span class="more-line">Two shirt designs in preview.</span></a></li>
        <li><a href="#/learn/cheat-sheet"><span class="more-name">Cheat sheet</span><span class="more-line">The whole system on one printable page.</span></a></li>
        <li><a href="#/table?spread=open"><span class="more-name">Open table</span><span class="more-line">Place cards anywhere on a grid of facets and read what touches.</span></a></li>
        <li><a href="https://jonbold11.github.io/faceted-eye-v2/"><span class="more-name">Version 2</span><span class="more-line">The previous version of this site.</span></a></li>
        <li><a href="https://jonbold11.github.io/faceted-eye/"><span class="more-name">Version 1</span><span class="more-line">The original design preview.</span></a></li>
      </ul>
      <div class="more-ks"><div class="ks-card ks-card-wide"><div><p class="kicker">Coming to Kickstarter</p><p class="ks-line"><strong>Feline Foresight</strong> — follow the campaign to hear the day it launches.</p></div>${ksButton('Follow on Kickstarter', 'btn btn-brass btn-ks', 'more')}</div></div>`;
    return { node };
  }

  function notFound() {
    const node = el('div', { class: 'view view-404' });
    node.innerHTML = `<section class="page-head"><p class="kicker">Lost between facets</p><h1>That page isn’t on the table.</h1><p><a class="btn btn-brass" href="#/">Return home</a></p></section>`;
    return { node };
  }

  window.Views = { decks, deck, learn, lesson, goods, about, more, notFound, openCard, ladderHTML, deckToggle };
})();
