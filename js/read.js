/* Faceted Eye v3 — "Read": the guided first reading that opens the site.
   Ask → tap → the card flips and turns → answer → share / go deeper / Kickstarter. */
(function () {
  'use strict';
  const { esc, $, $$, el, hexCard, setCard, prefs, store, announce, rand, reducedMotion, ksButton, cards, DECKS, bySlug } = window.UI;
  const H = window.Hex;
  const EXAMPLES = ['Should I take the new job?', 'Is this relationship good for me?', 'Should I spend the money?', 'Is now the time to start?'];

  function read() {
    let deck = prefs.deck;
    const node = el('div', { class: 'view view-read' });
    node.innerHTML = `
      <section class="ask" aria-labelledby="ask-h">
        <div class="ask-copy">
          <div class="ask-top"><p class="kicker">Hexagonal tarot</p>${window.Views.deckToggle(deck, 'Deck')}</div>
          <h1 id="ask-h" class="ask-title">Ask a yes-or-no question.<br><em>Then tap the card.</em></h1>
          <label class="question ask-question"><span class="sr-only">Your question</span><input type="text" maxlength="140" placeholder="Type it here — or just hold it in mind" autocomplete="off"></label>
          <div class="ask-examples" role="group" aria-label="Example questions">${EXAMPLES.map(q => `<button type="button" data-example>${esc(q)}</button>`).join('')}</div>
        </div>
        <div class="ask-stage">
          <button type="button" class="ask-card" aria-label="Draw a card"></button>
          <p class="ask-tap" aria-hidden="true"><span>Tap to draw</span></p>
        </div>
        <div class="ask-result" hidden tabindex="-1" aria-live="polite">
          <p class="answer"><span class="answer-edge"></span><span class="answer-word"></span></p>
          <p class="answer-note"></p>
          <h2 class="answer-card"></h2>
          <p class="answer-keys"></p>
          <p class="answer-prompt"></p>
          <div class="answer-actions">
            <button type="button" class="btn btn-brass" data-share-reading><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5M5 12v8h14v-8"/></svg>Share this reading</button>
            <a class="btn btn-ghost" data-deeper href="#/table?spread=past-present-future">Draw two more →</a>
            <button type="button" class="btn btn-quiet" data-again>Ask again</button>
          </div>
          <div class="ks-card">
            <div><p class="kicker">Coming to Kickstarter</p><p class="ks-line"><strong>Feline Foresight</strong> — all 78 cards, cut as hexagons. Follow the campaign to hear the day it launches.</p></div>
            ${ksButton('Follow on Kickstarter', 'btn btn-brass btn-ks', 'read-result')}
          </div>
        </div>
      </section>

      <section class="how" aria-labelledby="how-h">
        <div class="how-inner">
          <p class="kicker">How it works</p>
          <h2 id="how-h">Tarot with the geometry of a die.</h2>
          <ol class="how-steps">
            <li><span class="how-art how-art-1"></span><h3>Six edges</h3><p>Every card has six numbered sides. Like the faces of a die, opposite edges always add up to seven.</p></li>
            <li><span class="how-art how-art-2"></span><h3>The top answers</h3><p>Whichever numeral lands on top answers your question, from <b>I — Yes!</b> to <b>VI — No!</b> The picture keeps its meaning.</p></li>
            <li><span class="how-art how-art-3"></span><h3>Touching edges talk</h3><p>Lay cards side by side and the numerals that meet form a pair — read from the first card to the next.</p></li>
          </ol>
          <div class="how-actions"><a class="btn btn-ghost" href="#/learn">Learn the system</a><a class="btn btn-ghost" href="#/table">Open the full table</a></div>
        </div>
      </section>`;

    const stage = $('.ask-card', node);
    let card = hexCard({ deck, slug: 'the-fool', faceUp: false, thumb: false, lift: true });
    stage.append(card);
    const input = $('.ask-question input', node);
    const result = $('.ask-result', node);
    let drawn = null, busy = false;
    const timers = [];

    $$('[data-example]', node).forEach(b => b.addEventListener('click', () => { input.value = b.textContent; input.focus({ preventScroll: true }); }));

    function draw() {
      if (busy) return;
      if (drawn) { again(); return; }
      busy = true;
      const pick = cards[rand(78)];
      drawn = { slug: pick.slug, steps: rand(6) };
      node.classList.add('is-drawn');
      setCard(card, { slug: drawn.slug, thumb: false, faceUp: true });
      const turnDelay = reducedMotion() ? 0 : 750;
      timers.push(setTimeout(() => setCard(card, { steps: drawn.steps }), turnDelay));
      timers.push(setTimeout(() => { showResult(); busy = false; }, reducedMotion() ? 0 : turnDelay + 650));
      store.set('readings', store.get('readings', 0) + 1);
      window.FE_TRACK && window.FE_TRACK.event('reading-complete', 'single card');
    }
    function showResult() {
      const c = bySlug[drawn.slug], t = H.top(drawn.steps);
      $('.answer-edge', node).textContent = t;
      $('.answer-edge', node).className = `answer-edge edge-${H.VALUE[t]}`;
      $('.answer-word', node).textContent = H.WORDS[t];
      $('.answer-note', node).textContent = drawn.steps ? `The card landed turned ${drawn.steps * 60}°, so edge ${t} is on top.` : `The card landed upright, so edge ${t} is on top.`;
      $('.answer-card', node).textContent = c.name;
      $('.answer-keys', node).textContent = c.keywords;
      $('.answer-prompt', node).textContent = c.prompt;
      const q = input.value.trim();
      $('[data-deeper]', node).href = `#/table?deck=${deck}&spread=past-present-future${q ? '&q=' + encodeURIComponent(q) : ''}`;
      result.hidden = false;
      $('.ask-tap span', node).textContent = 'Tap to ask again';
      announce(`${c.name}. Edge ${t} on top: ${H.WORDS[t]}`);
      if (matchMedia('(max-width: 900px)').matches) result.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    }
    function again() {
      drawn = null;
      result.hidden = true;
      node.classList.remove('is-drawn');
      setCard(card, { faceUp: false });
      timers.push(setTimeout(() => setCard(card, { steps: 0 }), reducedMotion() ? 0 : 400));
      $('.ask-tap span', node).textContent = 'Tap to draw';
      if (matchMedia('(max-width: 900px)').matches) node.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' });
      input.focus({ preventScroll: true });
    }
    stage.addEventListener('click', draw);
    $('[data-again]', node).addEventListener('click', again);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); input.blur(); if (!drawn) draw(); } });
    $('[data-share-reading]', node).addEventListener('click', async e => {
      const btn = e.currentTarget; btn.disabled = true;
      const c = bySlug[drawn.slug], t = H.top(drawn.steps);
      try {
        const how = await window.FE_SHARE.share({ deck, cards: [{ q: 0, r: 0, slug: drawn.slug, steps: drawn.steps }], question: input.value.trim(), kicker: 'One-card reading', title: `${t} — ${H.WORDS[t]}`, lines: [[c.name, '#f2ede3'], [c.keywords, '#c2a56d']] });
        if (how === 'downloaded') announce('Reading image saved.');
      } finally { btn.disabled = false; }
    });
    $$('[data-deck-pick]', node).forEach(b => b.addEventListener('click', () => {
      deck = b.dataset.deckPick; prefs.deck = deck;
      $$('[data-deck-pick]', node).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      setCard(card, { deck, thumb: false, slug: drawn ? drawn.slug : 'the-fool' });
      node.dataset.deck = deck;
    }));
    node.dataset.deck = deck;

    /* "How it works" art, rebuilt when the deck changes. */
    let turning, s = 0;
    function fillHow() {
      $('.how-art-1', node).replaceChildren(hexCard({ deck, slug: 'the-star' }));
      turning = hexCard({ deck, slug: 'the-sun', steps: s });
      $('.how-art-2', node).replaceChildren(turning);
      $('.how-art-3', node).replaceChildren(hexCard({ deck, slug: 'two-of-cups' }), hexCard({ deck, slug: 'ace-of-cups', steps: 3 }));
    }
    fillHow();
    $$('[data-deck-pick]', node).forEach(b => b.addEventListener('click', fillHow));
    if (!reducedMotion()) timers.push(setInterval(() => { if (!document.hidden) setCard(turning, { steps: ++s }); }, 2200));

    return { node, destroy: () => timers.forEach(t => { clearTimeout(t); clearInterval(t); }) };
  }

  window.Views.read = read;
})();
