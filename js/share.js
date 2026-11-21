/* Faceted Eye v3 — shareable reading images, drawn on a canvas.
   Story format (1080 × 1920) with the turned card(s), the edge answer and the
   site address. Shares through the phone's share sheet when possible, else downloads. */
(function () {
  'use strict';
  const H = window.Hex;
  const { DECKS, bySlug } = window.FE_CARDS;
  const W = 1080, HGT = 1920;
  const SERIF = 'Georgia, "Times New Roman", serif';
  const SANS = '-apple-system, "Segoe UI", Roboto, Arial, sans-serif';
  const cache = new Map();

  function load(src) {
    if (!cache.has(src)) cache.set(src, new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }));
    return cache.get(src);
  }
  function hexPath(ctx, cx, cy, R) {
    ctx.beginPath();
    for (let k = 0; k < 6; k++) { const a = Math.PI / 3 * k; const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.closePath();
  }
  function drawCard(ctx, img, deck, cx, cy, R, steps) {
    const d = DECKS[deck];
    ctx.save();
    hexPath(ctx, cx, cy, R);
    ctx.fillStyle = deck === 'feline' ? '#f7f5f0' : '#0b0b0c';
    ctx.fill();
    ctx.clip();
    ctx.translate(cx, cy);
    ctx.rotate(steps * Math.PI / 3);
    const iw = 2 * R * d.scale, ih = iw * img.naturalHeight / img.naturalWidth;
    ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih);
    ctx.restore();
  }
  function wrap(ctx, text, maxW) {
    const words = text.split(/\s+/), lines = [];
    let line = '';
    for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
    if (line) lines.push(line);
    return lines;
  }
  function pill(ctx, x, y, text, named, size) {
    ctx.font = `${size}px ${SERIF}`;
    const w = ctx.measureText(text).width + size * 1.2, h = size * 1.6;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2);
    ctx.fillStyle = named ? '#f4dfae' : 'rgba(19,18,20,.92)'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = named ? '#f4dfae' : '#c2a56d'; ctx.stroke();
    ctx.fillStyle = named ? '#131214' : '#f2ede3'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y + 1);
  }

  /* cards: [{ slug, steps, q, r }] in deal order. */
  async function render({ deck, cards, question = '', kicker = 'A reading', title = '', lines = [] }) {
    const c = document.createElement('canvas');
    c.width = W; c.height = HGT;
    const ctx = c.getContext('2d');
    const bg = ctx.createRadialGradient(W / 2, HGT * .42, 80, W / 2, HGT * .42, HGT * .75);
    bg.addColorStop(0, deck === 'maya' ? '#1b2a55' : '#2b1a20'); bg.addColorStop(1, '#0d0c0e');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, HGT);

    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#c2a56d'; ctx.font = `600 30px ${SANS}`;
    ctx.fillText('T H E   F A C E T E D   E Y E', W / 2, 130);
    ctx.fillStyle = 'rgba(242,237,227,.6)'; ctx.font = `600 26px ${SANS}`;
    ctx.fillText(kicker.toUpperCase().split('').join(' '), W / 2, 185);

    let top = 240;
    if (question) {
      ctx.fillStyle = '#f2ede3'; ctx.font = `italic 50px ${SERIF}`;
      const qs = wrap(ctx, `“${question}”`, W - 160).slice(0, 3);
      qs.forEach((l, i) => ctx.fillText(l, W / 2, top + 50 + i * 64));
      top += 60 + qs.length * 64;
    }

    /* Fit the board into the art area. */
    const artTop = top + 30, artBottom = HGT - 560;
    const b = H.bounds(cards);
    const bw = b.maxX - b.minX, bh = b.maxY - b.minY;
    const R = Math.min(cards.length === 1 ? 430 : 300, (W - 120) / bw, (artBottom - artTop) / bh);
    const ox = W / 2 - (b.minX + bw / 2) * R, oy = (artTop + artBottom) / 2 - (b.minY + bh / 2) * R;
    const imgs = await Promise.all(cards.map(k => load(DECKS[deck].image(bySlug[k.slug]))));
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 20;
    cards.forEach(k => { const [x, y] = H.center(k); hexPath(ctx, ox + x * R, oy + y * R, R); ctx.fillStyle = '#000'; ctx.fill(); });
    ctx.restore();
    cards.forEach((k, i) => { const [x, y] = H.center(k); drawCard(ctx, imgs[i], deck, ox + x * R, oy + y * R, R, k.steps); });
    if (cards.length > 1) {
      H.contacts(cards).forEach(s => {
        const [[x1, y1], [x2, y2]] = s.line;
        ctx.beginPath(); ctx.moveTo(ox + x1 * R, oy + y1 * R); ctx.lineTo(ox + x2 * R, oy + y2 * R);
        ctx.strokeStyle = H.interpretation(s.a, s.b) ? '#f4dfae' : '#c2a56d'; ctx.lineWidth = 6; ctx.stroke();
        pill(ctx, ox + (x1 + x2) / 2 * R, oy + (y1 + y2) / 2 * R, `${s.a} · ${s.b}`, !!H.interpretation(s.a, s.b), Math.max(24, R * .13));
      });
    }

    /* Answer block. */
    let y = HGT - 470;
    if (title) { ctx.fillStyle = '#f2ede3'; ctx.font = `76px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(title, W / 2, y); y += 70; }
    ctx.font = `38px ${SERIF}`;
    lines.forEach(([text, color]) => { ctx.fillStyle = color || 'rgba(242,237,227,.75)'; wrap(ctx, text, W - 160).slice(0, 2).forEach(l => { ctx.fillText(l, W / 2, y); y += 52; }); y += 6; });

    ctx.fillStyle = 'rgba(242,237,227,.5)'; ctx.font = `600 28px ${SANS}`;
    ctx.fillText((window.FE_CONFIG.SITE_URL || '').replace(/^https?:\/\//, '').replace(/\/$/, ''), W / 2, HGT - 90);
    return new Promise(res => c.toBlob(res, 'image/png'));
  }

  async function share(opts, filename = 'faceted-eye-reading.png') {
    const blob = await render(opts);
    const file = new File([blob], filename, { type: 'image/png' });
    window.FE_TRACK && window.FE_TRACK.event('share', opts.kicker);
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'The Faceted Eye', text: opts.question || 'My Faceted Eye reading' }); return 'shared'; }
      catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return 'downloaded';
  }

  window.FE_SHARE = { render, share };
})();
