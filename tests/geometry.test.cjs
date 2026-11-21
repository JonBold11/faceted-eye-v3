// Cross-checks the v2 engine against the original v1 Reading Lab engine on every example board.
const path = require('path');
const v1 = require('./fixtures/v1-reading.js');
const v2 = require('../js/hex.js');
global.window = {}; require('../js/data/layouts.js');
let checks = 0, fails = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails++; console.log('FAIL', msg); } };
for (const l of window.READING_LAYOUTS) for (const b of l.boards) {
  const a = v1.contacts(b.cards), c = v2.contacts(b.cards);
  ok(a.length === c.length, `${l.id}/${b.title} contact count ${a.length} vs ${c.length}`);
  a.forEach((x, i) => { const y = c[i] || {}; ok(x.anchor === y.anchor + 1 && x.force === y.force + 1 && x.a === y.a && x.b === y.b && x.slot === y.slot, `${l.id} seam ${i}: v1 ${x.anchor}-${x.force} ${x.a}/${x.b} v2 ${y.anchor+1}-${y.force+1} ${y.a}/${y.b}`); });
  b.cards.forEach(card => ok(v1.edgeAt(0, card.steps) === v2.top(card.steps), `${l.id} top`));
}
// Opposite edges always sum to seven, and every rotation keeps that true.
for (let s = 0; s < 6; s++) for (let slot = 0; slot < 6; slot++) ok(v2.VALUE[v2.edgeAt(slot, s)] + v2.VALUE[v2.edgeAt((slot + 3) % 6, s)] === 7, 'sum seven');
// Spiral produces unique cells.
const sp = v2.spiral(2); ok(sp.length === 19 && new Set(sp.map(c => c.q + ',' + c.r)).size === 19, 'spiral');
// Interpretations match v1 coverage for every value pair.
for (const a of v2.EDGES) for (const b of v2.EDGES) ok(!!v2.interpretation(a, b) === !v1.interpretation(a, b).startsWith('No fixed'), `interp ${a}/${b}`);
console.log(`${checks - fails}/${checks} checks pass`); process.exit(fails ? 1 : 0);
