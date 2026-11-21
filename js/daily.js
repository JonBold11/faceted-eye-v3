/* Faceted Eye v3 — Daily: one card a day, the same card and turn for everyone. */
(function () {
  'use strict';
  const { esc, $, $$, el, hexCard, setCard, prefs, store, announce, reducedMotion, ksButton, dayKey, dailyCard, DECKS } = window.UI;
  const H = window.Hex;

  /* Consecutive-day streak, stored only on this device. */
  function visit() {
    const today = dayKey();
    const last = store.get('daily.last', null);
    let streak = store.get('daily.streak', 0);
    if (last !== today) {
      const y = new Date(); y.setDate(y.getDate() - 1);
      streak = last === dayKey(y) ? streak + 1 : 1;
      store.set('daily.last', today); store.set('daily.streak', streak);
    }
    return streak;
  }

  function daily() {
    let deck = prefs.deck;
    const { card, steps, key } = dailyCard();
    const revealedKey = 'daily.revealed';
    const already = store.get(revealedKey, '') === key;
    const streak = visit();
    const date = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    const t = H.top(steps);
    const node = el('div', { class: 'view view-daily' });
    node.innerHTML = `
      <section class="daily">
        <div class="daily-head"><p class="kicker">Daily card · ${esc(date)}</p>${deckToggleHTML(deck)}</div>
        <h1 class="daily-title">Today’s card is the same for everyone.</h1>
        <p class="lede daily-lede">Draw it, then compare with a friend. A new card arrives at midnight.</p>
        <div class="daily-stage"><button type="button" class="daily-card" aria-label="Reveal today’s card"></button><p class="ask-tap" aria-hidden="true"><span>${already ? '' : 'Tap to reveal'}</span></p></div>
        <div class="daily-result" ${already ? '' : 'hidden'}>
          <p class="answer"><span class="answer-edge edge-${H.VALUE[t]}">${t}</span><span class="answer-word">${H.WORDS[t]}</span></p>
          <h2 class="answer-card">${esc(card.name)}</h2>
          <p class="answer-keys">${esc(card.keywords)}</p>
          <p class="answer-prompt">${esc(card.prompt)}</p>
          <p class="daily-note">${steps ? `It landed turned ${steps * 60}°, with edge ${t} on top` : `It landed upright, with edge ${t} on top`} — a ${H.WORDS[t].toLowerCase().replace('!', '')} kind of day. Carry the question with you.</p>
          <div class="answer-actions"><button type="button" class="btn btn-brass" data-share-daily>Share today’s card</button><a class="btn btn-ghost" href="#/">Ask your own question →</a></div>
        </div>
        <div class="daily-meta">
          <div class="streak"><b>${streak}</b><span>${streak === 1 ? 'day' : 'days in a row'}</span></div>
          <div class="countdown"><span>Next card in</span><b data-countdown></b></div>
        </div>
        <div class="ks-card ks-card-wide"><div><p class="kicker">Coming to Kickstarter</p><p class="ks-line">Want these cards in your hands? <strong>Feline Foresight</strong> is launching on Kickstarter.</p></div>${ksButton('Follow on Kickstarter', 'btn btn-brass btn-ks', 'daily')}</div>
      </section>`;

    const big = hexCard({ deck, slug: card.slug, steps: already ? steps : 0, faceUp: already, thumb: false, lift: true });
    $('.daily-card', node).append(big);
    let revealed = already;
    $('.daily-card', node).addEventListener('click', () => {
      if (revealed) return;
      revealed = true;
      store.set(revealedKey, key);
      setCard(big, { faceUp: true });
      setTimeout(() => setCard(big, { steps }), reducedMotion() ? 0 : 750);
      setTimeout(() => { $('.daily-result', node).hidden = false; $('.ask-tap span', node).textContent = ''; announce(`${card.name}. Edge ${t}: ${H.WORDS[t]}`); }, reducedMotion() ? 0 : 1300);
      window.FE_TRACK && window.FE_TRACK.event('daily-reveal');
    });
    $('[data-share-daily]', node).addEventListener('click', () => window.FE_SHARE.share({ deck, cards: [{ q: 0, r: 0, slug: card.slug, steps }], kicker: `Daily card · ${date}`, title: `${t} — ${H.WORDS[t]}`, lines: [[card.name, '#f2ede3'], [card.keywords, '#c2a56d']] }, `faceted-eye-daily-${key}.png`));
    $$('[data-deck-pick]', node).forEach(b => b.addEventListener('click', () => {
      deck = b.dataset.deckPick; prefs.deck = deck;
      $$('[data-deck-pick]', node).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      setCard(big, { deck, slug: card.slug, thumb: false });
    }));

    const cd = $('[data-countdown]', node);
    const tick = () => {
      const now = new Date(), next = new Date(now); next.setHours(24, 0, 0, 0);
      const s = Math.max(0, Math.floor((next - now) / 1000));
      cd.textContent = `${Math.floor(s / 3600)}h ${String(Math.floor(s / 60) % 60).padStart(2, '0')}m`;
      if (s === 0) location.reload();
    };
    tick();
    const timer = setInterval(tick, 30000);
    return { node, destroy: () => clearInterval(timer) };
  }

  function deckToggleHTML(deck) { return window.Views.deckToggle(deck, 'Deck'); }
  window.Views.daily = daily;
})();
