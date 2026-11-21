/* Regular flat-top geometry. Maya art: 1536px source canvas, center 768, outer hex radius 640.
   Positive SVG rotation is clockwise. Numerals follow the printed frame, not deal order. */
(function(root){
  'use strict';
  const EDGES=['I','II','IV','VI','V','III'];
  const WORDS={I:'Yes!',II:'Yes',III:'Sort of yes',IV:'Leaning no',V:'No',VI:'No!'};
  const SIDES=['top','upper-right','lower-right','bottom','lower-left','upper-left'];
  const mod=n=>(n%6+6)%6, R=100, H=Math.sqrt(3)*R/2;
  const center=c=>[1.5*R*c.q,Math.sqrt(3)*R*(c.r+c.q/2)];
  const vertices=c=>{const[x,y]=center(c);return [[-R/2,-H],[R/2,-H],[R,0],[R/2,H],[-R/2,H],[-R,0]].map(([a,b])=>[x+a,y+b]);};
  const edgeAt=(slot,steps)=>EDGES[mod(slot-steps)];
  function contacts(cards){
    const result=[];
    cards.forEach((a,i)=>cards.slice(i+1).forEach((b,j)=>{
      const [ax,ay]=center(a),[bx,by]=center(b),dx=bx-ax,dy=by-ay;
      if(Math.abs(Math.hypot(dx,dy)-Math.sqrt(3)*R)>1e-7)return;
      const slot=mod(Math.round((Math.atan2(dy,dx)+Math.PI/2)/(Math.PI/3))),other=mod(slot+3);
      result.push({anchor:i+1,force:i+j+2,slot,other,a:edgeAt(slot,a.steps),b:edgeAt(other,b.steps),line:[vertices(a)[slot],vertices(a)[mod(slot+1)]]});
    }));
    return result.sort((a,b)=>a.force-b.force||a.anchor-b.anchor);
  }
  function interpretation(a,b){
    if(a==='I'&&b==='I')return 'Fuck yes — emphatic symbolic affirmation, not certainty.';
    if(a==='VI'&&b==='VI')return 'Critical Block — intensified maximal resistance; context still matters.';
    if(a==='I'&&b==='VI')return 'An existing yes meets major resistance. Working through it or a stalemate are both possible readings; overcoming is not guaranteed.';
    if(a==='VI'&&b==='I')return 'An existing no is challenged by strong affirmation. Read the challenge in context, without an automatic winner.';
    if(a==='I'&&b==='IV')return 'Jon’s earlier I/IV example reads as yes. This specific example does not establish a universal combining formula.';
    return 'No fixed combined verdict is assigned to this pair. Read the cards, direction, question and context together.';
  }
  const ART = {
  "ace-of-coins": {
    "image": "assets/maya-v2/fronts/64-ace-of-pentacles.webp",
    "name": "Ace of Pentacles"
  },
  "ace-of-cups": {
    "image": "assets/maya-v2/fronts/36-ace-of-cups.webp",
    "name": "Ace of Cups"
  },
  "eight-of-coins": {
    "image": "assets/maya-v2/fronts/71-eight-of-pentacles.webp",
    "name": "Eight of Pentacles"
  },
  "eight-of-swords": {
    "image": "assets/maya-v2/fronts/57-eight-of-swords.webp",
    "name": "Eight of Swords"
  },
  "five-of-cups": {
    "image": "assets/maya-v2/fronts/40-five-of-cups.webp",
    "name": "Five of Cups"
  },
  "five-of-swords": {
    "image": "assets/maya-v2/fronts/54-five-of-swords.webp",
    "name": "Five of Swords"
  },
  "five-of-wands": {
    "image": "assets/maya-v2/fronts/26-five-of-wands.webp",
    "name": "Five of Wands"
  },
  "fool": {
    "image": "assets/maya-v2/fronts/00-the-fool.webp",
    "name": "The Fool"
  },
  "hermit": {
    "image": "assets/maya-v2/fronts/09-the-hermit.webp",
    "name": "The Hermit"
  },
  "hierophant": {
    "image": "assets/maya-v2/fronts/05-the-hierophant.webp",
    "name": "The Hierophant"
  },
  "lovers": {
    "image": "assets/maya-v2/fronts/06-the-lovers.webp",
    "name": "The Lovers"
  },
  "nine-of-cups": {
    "image": "assets/maya-v2/fronts/44-nine-of-cups.webp",
    "name": "Nine of Cups"
  },
  "queen-of-cups": {
    "image": "assets/maya-v2/fronts/48-queen-of-cups.webp",
    "name": "Queen of Cups"
  },
  "queen-of-swords": {
    "image": "assets/maya-v2/fronts/62-queen-of-swords.webp",
    "name": "Queen of Swords"
  },
  "seven-of-cups": {
    "image": "assets/maya-v2/fronts/42-seven-of-cups.webp",
    "name": "Seven of Cups"
  },
  "six-of-coins": {
    "image": "assets/maya-v2/fronts/69-six-of-pentacles.webp",
    "name": "Six of Pentacles"
  },
  "six-of-cups": {
    "image": "assets/maya-v2/fronts/41-six-of-cups.webp",
    "name": "Six of Cups"
  },
  "star": {
    "image": "assets/maya-v2/fronts/17-the-star.webp",
    "name": "The Star"
  },
  "three-of-swords": {
    "image": "assets/maya-v2/fronts/52-three-of-swords.webp",
    "name": "Three of Swords"
  },
  "three-of-wands": {
    "image": "assets/maya-v2/fronts/24-three-of-wands.webp",
    "name": "Three of Wands"
  },
  "two-of-coins": {
    "image": "assets/maya-v2/fronts/65-two-of-pentacles.webp",
    "name": "Two of Pentacles"
  },
  "two-of-cups": {
    "image": "assets/maya-v2/fronts/37-two-of-cups.webp",
    "name": "Two of Cups"
  },
  "world": {
    "image": "assets/maya-v2/fronts/21-the-world.webp",
    "name": "The World"
  }
};
  const art=id=>ART[id].image;
  const name=id=>ART[id].name;
  let drawingId=0;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function svg(board){
    const all=board.cards.flatMap(vertices),xs=all.map(p=>p[0]),ys=all.map(p=>p[1]);
    const minX=Math.min(...xs)-22,minY=Math.min(...ys)-22,w=Math.max(...xs)-minX+22,h=Math.max(...ys)-minY+22;
    const size=1536/640*R,offset=size/2,clipId=`reading-face-${++drawingId}`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${w} ${h}" role="img" aria-label="${esc(board.title)}. ${board.cards.length} cards. Circles show deal order; gold lines show full-side contacts."><defs><clipPath id="${clipId}" clipPathUnits="userSpaceOnUse"><polygon points="${vertices({q:0,r:0}).map(p=>p.join(',')).join(' ')}"/></clipPath></defs><g>${board.cards.map((c,i)=>{
      const[x,y]=center(c);return `<g data-deal="${i+1}" data-rotation="${c.steps*60}" data-top="${edgeAt(0,c.steps)}"><title>${i+1}. ${esc(name(c.art))}, ${esc(c.role)}, ${c.steps*60} degrees clockwise. Top ${edgeAt(0,c.steps)}.</title><image clip-path="url(#${clipId})" href="${art(c.art)}" x="${-offset}" y="${-offset}" width="${size}" height="${size}" transform="translate(${x} ${y}) rotate(${c.steps*60})"/><circle cx="${x}" cy="${y}" r="12" fill="#f5e8cf" stroke="#661e2a" stroke-width="2"/><text x="${x}" y="${y+4.5}" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="700" fill="#421622">${i+1}</text></g>`;
    }).join('')}${contacts(board.cards).map(c=>`<path d="M${c.line[0].join(' ')} L${c.line[1].join(' ')}" fill="none" stroke="#e5bc78" stroke-width="2" pointer-events="none"><title>${c.anchor} Anchor ${c.a} → ${c.force} Force ${c.b}</title></path>`).join('')}</g></svg>`;
  }
  function element(tag,text,className){const e=document.createElement(tag);if(text)e.textContent=text;if(className)e.className=className;return e;}
  function thumbnail(host,layout){host.innerHTML=svg(layout.boards[0]);host.setAttribute('aria-hidden','true');}
  function render(host,layout){
    host.replaceChildren();
    host.append(element('p','Circled numbers show example deal order. Roman numerals belong to the edges. Gold lines mark full-side contacts.','diagram-key'));
    layout.boards.forEach((board,index)=>{
      const section=element('section',null,'reading-example');section.append(element('h3',board.title));
      const figure=element('div',null,'reading-board');figure.innerHTML=svg(board);section.append(figure);
      if(index===0){const intro=element('div',null,'reading-intro');layout.paragraphs.forEach(text=>intro.append(element('p',text)));section.append(intro);}
      if(board.note)section.append(element('p',board.note,'diagram-key'));
      section.append(element('h4','Top-edge baselines'));
      const list=element('ol',null,'baseline-list');
      board.cards.forEach((c,i)=>{const li=element('li');li.append(element('strong',`${i+1} · ${c.role} — ${name(c.art)}`),element('span',`${c.steps?c.steps*60+'° clockwise':'Upright'} · Top ${edgeAt(0,c.steps)} — ${WORDS[edgeAt(0,c.steps)]}`));list.append(li);});section.append(list);
      const seams=contacts(board.cards);section.append(element('h4',seams.length?'Contact readings · in deal order':'No contacting edges'));
      if(seams.length){
        const list=element('ol',null,'contact-list');
        seams.forEach(c=>{const item=element('li');item.dataset.pair=`${c.anchor}-${c.force}`;item.dataset.values=`${c.a}-${c.b}`;item.append(element('strong',`${c.anchor} Anchor ${c.a} → ${c.force} Force ${c.b}`),element('span',`${SIDES[c.slot]} edge of ${c.anchor} meets ${SIDES[c.other]} edge of ${c.force}.`),element('p',interpretation(c.a,c.b)));list.append(item);});section.append(list);
      }else section.append(element('p',board.cards.length===1?'One card supplies a baseline, not a paired result.':'The gaps are intentional. A corner or a gap is not a shared side.'));
      host.append(section);
    });
    if(layout.pairNotes){
      const section=element('section',null,'pair-notes');section.append(element('h3','Other established pair prompts'));
      [['I / I','“Fuck yes” is an emphatic symbolic affirmation. It is not the single-card label. Two upright cards cannot meet I to I; this is a textual introduction, demonstrated with rotation at Crossroads.'],['VI / VI','Critical Block: intensified maximal resistance. This is contextual language, not a claim about a certain real-world result.'],['I → IV','Jon’s earlier example reads as yes. That particular result does not define how every other pair must work.']].forEach(([title,text])=>{section.append(element('h4',title),element('p',text));});host.append(section);
    }
    host.append(element('p','A negative value may suggest resistance. These are interpretive prompts: no global average, majority vote, automatic winner or complete pair matrix. Turning an image here does not prescribe a traditional reversed-card meaning.','mechanics-note'));
  }
  const api={EDGES,WORDS,SIDES,R,center,vertices,edgeAt,contacts,interpretation,art,svg,thumbnail,render};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.HexReading=api;
})(typeof window!=='undefined'?window:globalThis);
