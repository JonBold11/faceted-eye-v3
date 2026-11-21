// End-to-end checks in a real browser. Usage:
//   python3 -m http.server 8791 --bind 127.0.0.1   (from the project root)
//   CHROME=/path/to/chrome node tests/browser.test.cjs
// Needs playwright-core (npm i -D playwright-core) or playwright.
let pw; try { pw = require('playwright'); } catch (e) { pw = require('playwright-core'); }
const BASE = process.env.BASE || 'http://127.0.0.1:8791/';
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m); } };

(async () => {
  const browser = await pw.chromium.launch(require('fs').existsSync(CHROME) ? { executablePath: CHROME } : {});
  for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const ctx = await browser.newContext({ viewport: vp });
    const page = await ctx.newPage();
    const errors = [], missing = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('response', r => { if (r.status() >= 400) missing.push(r.url()); });
    const tag = `[${vp.width}]`;

    // Every route renders an h1 without script errors and without horizontal overflow.
    for (const r of ['', '#/daily', '#/decks', '#/decks/feline', '#/decks/maya', '#/table', '#/learn', '#/learn/cheat-sheet', '#/more', '#/goods', '#/about', '#/nope',
      ...['one', 'two', 'past-present-future', 'crossroads', 'cuban-cross', 'end-of-day', 'split-hexagram', 'ring', 'lane', 'three'].map(l => '#/learn/' + l)]) {
      await page.goto(BASE + r); await page.waitForTimeout(350);
      ok(await page.locator('#view h1').count() >= 1, `${tag} h1 on ${r}`);
      const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
      ok(sw <= iw, `${tag} no horizontal overflow on ${r} (${sw} > ${iw})`);
    }

    // Navigation: Read is selected on first load; every route highlights its tab.
    await page.goto(BASE); await page.waitForTimeout(300);
    ok(await page.locator('.nav a.is-on[data-nav="read"]').count() === 1, `${tag} Read tab active on load`);
    for (const [r, key] of [['#/table', 'read'], ['#/daily', 'daily'], ['#/decks/maya', 'decks'], ['#/learn/ring', 'learn'], ['#/learn/cheat-sheet', 'learn'], ['#/goods', 'more'], ['#/about', 'more'], ['#/more', 'more']]) {
      await page.goto(BASE + r); await page.waitForTimeout(200);
      ok(await page.locator(`[data-nav="${key}"].is-on`).count() === 1, `${tag} ${key} highlighted on ${r}`);
    }

    // Read: Feline leads; tapping draws, flips and turns a card; the answer matches the card's top edge.
    await page.evaluate(() => localStorage.clear());
    await page.goto(BASE); await page.waitForTimeout(400);
    ok(await page.locator('.ask [data-deck-pick="feline"][aria-pressed="true"]').count() === 1, `${tag} Feline is the lead deck`);
    ok(await page.locator('.ask-result').isHidden(), `${tag} result hidden before draw`);
    await page.fill('.ask-question input', 'Should I move?');
    await page.click('.ask-card'); await page.waitForTimeout(1700);
    const drawn = await page.evaluate(() => {
      const hx = document.querySelector('.ask-card .hx');
      const steps = Math.round(parseFloat(hx.style.getPropertyValue('--turn')) / 60);
      return { up: !hx.classList.contains('is-down'), top: Hex.top(steps), shown: document.querySelector('.answer-edge').textContent, word: document.querySelector('.answer-word').textContent, name: document.querySelector('.answer-card').textContent, img: hx.querySelector('.hx-front img').alt };
    });
    ok(drawn.up && drawn.top === drawn.shown && drawn.name === drawn.img, `${tag} drawn answer matches card ${JSON.stringify(drawn)}`);
    ok(/q=Should%20I%20move/.test(await page.getAttribute('[data-deeper]', 'href')), `${tag} question carried to the table`);
    await page.click('[data-again]'); await page.waitForTimeout(500);
    ok(await page.locator('.ask-result').isHidden() && await page.locator('.ask-card .hx.is-down').count() === 1, `${tag} ask again resets`);

    // Kickstarter: with no URL configured, the button explains instead of linking out.
    await page.click('.ask-card'); await page.waitForTimeout(1700);
    await page.click('.ask-result [data-ks]'); await page.waitForTimeout(300);
    ok(await page.locator('#modal[open] .sheet').count() === 1, `${tag} Kickstarter coming-soon sheet`);
    await page.keyboard.press('Escape'); await page.waitForTimeout(200);

    // Share image renders a 1080×1920 PNG.
    const size = await page.evaluate(async () => { const b = await FE_SHARE.render({ deck: 'feline', cards: [{ q: 0, r: 0, slug: 'the-fool', steps: 2 }], title: 'x', lines: [] }); const i = await createImageBitmap(b); return [b.type, i.width, i.height]; });
    ok(size[0] === 'image/png' && size[1] === 1080 && size[2] === 1920, `${tag} share image ${size}`);

    // Daily: the same card for everyone today, revealed once and remembered.
    await page.goto(BASE + '#/daily'); await page.waitForTimeout(400);
    const expect = await page.evaluate(() => { const d = UI.dailyCard(); return [d.card.name, Hex.top(d.steps)]; });
    await page.click('.daily-card'); await page.waitForTimeout(1600);
    ok((await page.textContent('.daily-result .answer-card')) === expect[0] && (await page.textContent('.daily-result .answer-edge')) === expect[1], `${tag} daily card matches seed ${expect}`);
    ok(await page.evaluate(() => UI.dailyCard('2026-01-01').card.name === UI.dailyCard('2026-01-01').card.name && UI.dailyCard('2026-01-01').card.name !== undefined), `${tag} daily seed is deterministic`);
    await page.reload(); await page.waitForTimeout(400);
    ok(await page.locator('.daily-result').isVisible(), `${tag} daily stays revealed after reload`);

    // Lessons: story steps advance and end with a table link.
    await page.goto(BASE + '#/learn/crossroads'); await page.waitForTimeout(500);
    const steps = await page.locator('.story-slide').count();
    ok(steps >= 5, `${tag} crossroads has ${steps} steps`);
    await page.click('[data-story="1"]'); await page.waitForTimeout(700);
    ok(/^2 \//.test(await page.textContent('.story-count')), `${tag} story advances`);
    ok(await page.locator('.slide-end a[href*="#/table?spread=crossroads"]').count() === 1, `${tag} story ends with table link`);

    // Deck launch page: Kickstarter in hero and footer, flip-through runs.
    await page.goto(BASE + '#/decks/feline'); await page.waitForTimeout(400);
    ok(await page.locator('#view [data-ks]').count() >= 2, `${tag} deck page Kickstarter buttons`);
    const f1 = await page.textContent('.flip-name');
    await page.click('[data-flip-step="1"]'); await page.waitForTimeout(600);
    ok((await page.textContent('.flip-name')) !== f1, `${tag} flip-through advances`);

    // No analytics script is loaded while GoatCounter is unconfigured.
    ok(await page.evaluate(() => !document.querySelector('script[src*="goatcounter"], script[src*="gc.zgo.at"]')), `${tag} no analytics without config`);
    await page.goto(BASE + '#/table?spread=crossroads'); await page.waitForTimeout(400);
    ok(await page.locator('.felt-hint').isVisible(), `${tag} table shows first-use hint`);

    // Table: deal Crossroads, all face down, reveal, seams match the engine.
    await page.goto(BASE + '#/table?spread=crossroads&deck=maya'); await page.waitForTimeout(600);
    ok(await page.locator('.felt .board-card').count() === 4, `${tag} crossroads deals 4`);
    ok(await page.locator('.felt .hx.is-down').count() === 4, `${tag} dealt face down`);
    ok(/c=/.test(await page.evaluate(() => location.hash)), `${tag} reading encoded in URL`);
    await page.click('.felt .board-card >> nth=0');
    await page.waitForTimeout(200);
    ok(await page.locator('.felt .hx.is-down').count() === 3, `${tag} click reveals one`);
    await page.click('[data-reveal]'); await page.waitForTimeout(300);
    ok(await page.locator('.felt .hx.is-down').count() === 0, `${tag} reveal all`);
    const check = await page.evaluate(() => {
      const hash = location.hash; const c = new URLSearchParams(hash.split('?')[1]).get('c').split(',');
      const L = window.READING_LAYOUTS.find(l => l.id === 'crossroads').boards[0].cards;
      const cards = c.map((p, i) => ({ q: L[i].q, r: L[i].r, steps: +p.split('.')[1][0] }));
      const seams = Hex.contacts(cards);
      const pills = [...document.querySelectorAll('.felt .seam-pill')].map(p => p.textContent.replace('·', ' ').replace(/\s+/g, ' ').trim());
      const listed = [...document.querySelectorAll('.read-seams .rs-pair')].map(p => [...p.querySelectorAll('b')].map(b => b.textContent).join(' '));
      return { seams: seams.map(s => s.a + ' ' + s.b), pills, listed };
    });
    ok(check.seams.length === 3 && JSON.stringify(check.seams) === JSON.stringify(check.listed), `${tag} reading seams match engine ${JSON.stringify(check)}`);
    ok(JSON.stringify(check.seams.slice().sort()) === JSON.stringify(check.pills.slice().sort()), `${tag} board pills match engine ${JSON.stringify(check)}`);

    // Select a card and turn it with the toolbar and keyboard; top edge follows.
    await page.click('.felt .board-card >> nth=1'); await page.waitForTimeout(150);
    ok(await page.locator('.felt-tools').isVisible(), `${tag} selection toolbar shows`);
    const before = await page.evaluate(() => new URLSearchParams(location.hash.split('?')[1]).get('c').split(',')[1]);
    await page.click('[data-sel-turn="1"]'); await page.waitForTimeout(150);
    await page.keyboard.press('r'); await page.waitForTimeout(150);
    const after = await page.evaluate(() => new URLSearchParams(location.hash.split('?')[1]).get('c').split(',')[1]);
    ok(((+before.split('.')[1] + 2) % 6) === +after.split('.')[1], `${tag} turn twice: ${before} -> ${after}`);

    // Shared link restores the exact reading.
    const link = await page.evaluate(() => location.href);
    const p2 = await ctx.newPage(); await p2.goto(link); await p2.waitForTimeout(500);
    ok(await p2.evaluate(() => location.href) === link, `${tag} link round-trips`);
    ok(await p2.locator('.read-cards li:not(.is-down)').count() === 4, `${tag} restored reading revealed`);
    await p2.close();

    // Upright orientation zeroes every turn; spreads switch.
    await page.click('[data-orient="upright"]'); await page.waitForTimeout(200);
    ok(await page.evaluate(() => new URLSearchParams(location.hash.split('?')[1]).get('c').split(',').every(p => p.split('.')[1][0] === '0')), `${tag} upright resets turns`);
    await page.click('[data-spread="cuban-cross"]'); await page.waitForTimeout(400);
    ok(await page.locator('.felt .board-card').count() === 10, `${tag} cuban cross deals 10`);

    // Open table: draw into cells; cards are unique and seams appear for neighbours.
    await page.click('[data-spread="open"]'); await page.waitForTimeout(300);
    ok(await page.locator('.board-cell:not([hidden])').count() === 19, `${tag} open table has 19 facets`);
    await page.click('.board-cell[data-q="0"][data-r="0"]'); await page.waitForTimeout(250);
    await page.click('.board-cell[data-q="0"][data-r="-1"]'); await page.waitForTimeout(250);
    ok(await page.locator('.felt .board-card').count() === 2 && await page.locator('.read-seams li').count() === 1, `${tag} open table seam`);

    // Deck grid: 78 cards, filter, modal navigation and deck switch.
    await page.goto(BASE + '#/decks/maya'); await page.waitForTimeout(400);
    ok(await page.locator('.card-grid li').count() === 78, `${tag} 78 in grid`);
    await page.click('[data-filter="cups"]');
    ok(await page.locator('.card-grid li:not([hidden])').count() === 14, `${tag} cups filter 14`);
    await page.click('[data-filter="major"]');
    ok(await page.locator('.card-grid li:not([hidden])').count() === 22, `${tag} major filter 22`);
    await page.click('.grid-card >> nth=0'); await page.waitForTimeout(300);
    ok(await page.locator('#modal[open]').count() === 1 && (await page.textContent('#modal-title')) === 'The Fool', `${tag} modal opens`);
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(100);
    ok((await page.textContent('#modal-title')) === 'The Magician', `${tag} modal next`);
    await page.click('#modal [data-deck-pick="feline"]');
    ok(/feline/.test(await page.getAttribute('#modal .cardview-card .hx-front img', 'src')), `${tag} modal deck switch`);
    await page.keyboard.press('Escape'); await page.waitForTimeout(150);
    ok(await page.locator('#modal[open]').count() === 0, `${tag} modal closes`);

    // Every image on both deck pages actually decodes.
    for (const d of ['maya', 'feline']) {
      await page.goto(BASE + '#/decks/' + d);
      const bad = await page.evaluate(async () => {
        const imgs = [...document.querySelectorAll('#view img')];
        await Promise.all(imgs.map(i => { i.loading = 'eager'; return i.decode().catch(() => {}); }));
        return imgs.filter(i => !i.naturalWidth).map(i => i.src);
      });
      ok(bad.length === 0, `${tag} ${d} images decode ${bad.slice(0, 3)}`);
    }
    ok(errors.length === 0, `${tag} no console errors ${errors.slice(0, 3)}`);
    ok(missing.length === 0, `${tag} no 404s ${missing.slice(0, 3)}`);
    await ctx.close();
  }
  await browser.close();
  console.log(`${pass}/${pass + fail} browser checks pass`);
  process.exit(fail ? 1 : 0);
})();
