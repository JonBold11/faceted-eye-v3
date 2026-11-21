/* Faceted Eye v2 — hexagonal reading geometry.
   Flat-top regular hexagons on an axial grid. Positive rotation is clockwise in
   sixty-degree steps. Edge numerals follow the printed frame, clockwise from the
   upright top: I, II, IV, VI, V, III (opposite edges always sum to seven).
   Mechanics mirror the v1 Reading Lab engine; no new pair rules are invented. */
(function (root) {
  'use strict';
  const EDGES = ['I', 'II', 'IV', 'VI', 'V', 'III'];
  const VALUE = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6 };
  const WORDS = { I: 'Yes!', II: 'Yes', III: 'Sort of yes', IV: 'Leaning no', V: 'No', VI: 'No!' };
  const LADDER = ['I', 'II', 'III', 'IV', 'V', 'VI'];
  const SIDES = ['top', 'upper-right', 'lower-right', 'bottom', 'lower-left', 'upper-left'];
  const SQ3 = Math.sqrt(3);
  const mod = n => ((n % 6) + 6) % 6;

  /* Centre of an axial cell in units of the outer radius R = 1. */
  const center = c => [1.5 * c.q, SQ3 * (c.r + c.q / 2)];
  const CORNERS = [[-0.5, -SQ3 / 2], [0.5, -SQ3 / 2], [1, 0], [0.5, SQ3 / 2], [-0.5, SQ3 / 2], [-1, 0]];
  const vertices = c => { const [x, y] = center(c); return CORNERS.map(([a, b]) => [x + a, y + b]); };
  /* Which numeral sits on screen side `slot` once the card is turned `steps` clockwise. */
  const edgeAt = (slot, steps) => EDGES[mod(slot - steps)];
  const top = steps => edgeAt(0, steps);

  /* Neighbour offsets indexed by screen side (top, upper-right, ... upper-left). */
  const NEIGHBOURS = [[0, -1], [1, -1], [1, 0], [0, 1], [-1, 1], [-1, 0]];
  const neighbour = (c, slot) => ({ q: c.q + NEIGHBOURS[slot][0], r: c.r + NEIGHBOURS[slot][1] });

  /* Every full shared side, ordered by deal: earlier card = Anchor, later = Force. */
  function contacts(cards) {
    const out = [];
    cards.forEach((a, i) => {
      for (let slot = 0; slot < 6; slot++) {
        const n = neighbour(a, slot);
        const j = cards.findIndex((b, k) => k > i && b.q === n.q && b.r === n.r);
        if (j < 0) continue;
        const b = cards[j], other = mod(slot + 3);
        const v = vertices(a);
        out.push({
          anchor: i, force: j, slot, other,
          a: edgeAt(slot, a.steps), b: edgeAt(other, b.steps),
          line: [v[slot], v[mod(slot + 1)]]
        });
      }
    });
    return out.sort((x, y) => x.force - y.force || x.anchor - y.anchor);
  }

  /* Only the pair prompts established in the source notes. Everything else is open. */
  function interpretation(a, b) {
    if (a === 'I' && b === 'I') return { title: 'Fuck yes', text: 'Emphatic symbolic affirmation — not certainty.' };
    if (a === 'VI' && b === 'VI') return { title: 'Critical Block', text: 'Intensified, maximal resistance. Context still matters.' };
    if (a === 'I' && b === 'VI') return { title: 'Yes meets resistance', text: 'An existing yes meets major resistance. Working through it or a stalemate are both possible readings; overcoming is not guaranteed.' };
    if (a === 'VI' && b === 'I') return { title: 'No is challenged', text: 'An existing no is challenged by strong affirmation. Read the challenge in context, without an automatic winner.' };
    if (a === 'I' && b === 'IV') return { title: 'Reads as yes', text: 'The source example reads I → IV as yes. It does not establish a universal combining formula.' };
    return null;
  }

  function bounds(cards) {
    const pts = cards.flatMap(vertices);
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
  }

  /* Ring of axial cells of a given radius around the origin (radius 0 = centre). */
  function spiral(radius) {
    const cells = [{ q: 0, r: 0 }];
    for (let k = 1; k <= radius; k++) {
      let c = { q: 0, r: -k };
      for (let side = 2; side < 8; side++) {
        for (let s = 0; s < k; s++) { cells.push(c); c = neighbour(c, mod(side)); }
      }
    }
    return cells;
  }

  const api = { EDGES, VALUE, WORDS, LADDER, SIDES, SQ3, mod, center, vertices, edgeAt, top, neighbour, contacts, interpretation, bounds, spiral };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Hex = api;
})(typeof window !== 'undefined' ? window : globalThis);
