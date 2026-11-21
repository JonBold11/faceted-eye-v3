/* Faceted Eye v2 — canonical 78-card index shared by every deck.
   Keywords and prompts are short traditional (upright) associations written as
   editorial drafts. In this system a turned card is NOT a reversed card: rotation
   changes which numbered edge is on top and which edges touch, not the meaning. */
(function (root) {
  'use strict';

  const MAJORS = [
    ['the-fool', 'The Fool', 'Beginnings · Leap · Openness', 'What would you try if you did not need to know how it ends?'],
    ['the-magician', 'The Magician', 'Will · Skill · Focus', 'Which tools are already in your hands?'],
    ['the-high-priestess', 'The High Priestess', 'Intuition · Mystery · Stillness', 'What do you know that you have not said aloud?'],
    ['the-empress', 'The Empress', 'Abundance · Care · Growth', 'What are you nurturing, and is it nurturing you back?'],
    ['the-emperor', 'The Emperor', 'Structure · Authority · Order', 'Where would a clear boundary help?'],
    ['the-hierophant', 'The Hierophant', 'Tradition · Teaching · Belonging', 'Which inherited rule still serves you?'],
    ['the-lovers', 'The Lovers', 'Union · Choice · Values', 'What choice would align you with what you value?'],
    ['the-chariot', 'The Chariot', 'Drive · Direction · Control', 'Which opposing forces need one direction?'],
    ['strength', 'Strength', 'Courage · Patience · Gentleness', 'Where could softness be the stronger move?'],
    ['the-hermit', 'The Hermit', 'Solitude · Search · Inner light', 'What becomes clear when it gets quiet?'],
    ['wheel-of-fortune', 'Wheel of Fortune', 'Cycles · Turning point · Chance', 'What is turning, and what can you steer?'],
    ['justice', 'Justice', 'Fairness · Truth · Consequence', 'What would an honest accounting show?'],
    ['the-hanged-man', 'The Hanged Man', 'Pause · Surrender · New angle', 'What changes if you look at it upside down?'],
    ['death', 'Death', 'Ending · Transition · Release', 'What has run its course?'],
    ['temperance', 'Temperance', 'Balance · Blending · Moderation', 'What needs mixing rather than choosing?'],
    ['the-devil', 'The Devil', 'Attachment · Temptation · Shadow', 'What holds you, and how tightly do you hold it back?'],
    ['the-tower', 'The Tower', 'Upheaval · Revelation · Breaking open', 'What truth is shaking the structure?'],
    ['the-star', 'The Star', 'Hope · Renewal · Guidance', 'What is quietly restoring you?'],
    ['the-moon', 'The Moon', 'Illusion · Dream · Uncertainty', 'What might you be seeing only by moonlight?'],
    ['the-sun', 'The Sun', 'Joy · Clarity · Vitality', 'What is already going well?'],
    ['judgement', 'Judgement', 'Awakening · Reckoning · Calling', 'What is calling you to rise?'],
    ['the-world', 'The World', 'Completion · Integration · Wholeness', 'What cycle are you ready to close?']
  ];

  const RANKS = ['ace', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'page', 'knight', 'queen', 'king'];
  const RANK_NAMES = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King'];
  const SUITS = [
    { id: 'wands', name: 'Wands', element: 'Fire', domain: 'drive, creativity and action' },
    { id: 'cups', name: 'Cups', element: 'Water', domain: 'feeling, relationships and intuition' },
    { id: 'swords', name: 'Swords', element: 'Air', domain: 'thought, conflict and truth' },
    { id: 'pentacles', name: 'Pentacles', element: 'Earth', domain: 'work, body and material life' }
  ];

  const MINOR = {
    wands: [
      ['Spark · Inspiration · Potential', 'What idea wants to be lit?'],
      ['Planning · Horizon · Decision', 'Where are you looking beyond the wall?'],
      ['Expansion · Foresight · Ships out', 'What are you waiting to see arrive?'],
      ['Celebration · Home · Milestone', 'What deserves to be marked?'],
      ['Friction · Competition · Clash', 'Is this a fight, or practice?'],
      ['Recognition · Victory · Confidence', 'Who helped you get here?'],
      ['Defense · Conviction · Standing ground', 'What is worth holding?'],
      ['Momentum · Speed · Messages', 'What is moving faster than expected?'],
      ['Resilience · Guarding · Last stretch', 'What do you still have in you?'],
      ['Burden · Responsibility · Overload', 'What could you set down?'],
      ['Curiosity · Enthusiasm · Discovery', 'What are you eager to explore?'],
      ['Adventure · Impulse · Charge', 'Where is boldness useful — and where is it rash?'],
      ['Warmth · Confidence · Magnetism', 'How do you light up a room?'],
      ['Vision · Leadership · Enterprise', 'What would you build if you led it?']
    ],
    cups: [
      ['New feeling · Love · Overflow', 'What is filling up?'],
      ['Partnership · Mutuality · Attraction', 'What is being exchanged between you?'],
      ['Friendship · Community · Joy', 'Who do you celebrate with?'],
      ['Apathy · Contemplation · Refusal', 'What offer are you not seeing?'],
      ['Loss · Grief · Regret', 'What still stands behind you?'],
      ['Nostalgia · Innocence · Memory', 'What from the past is offering a gift?'],
      ['Choices · Fantasy · Illusion', 'Which option is real?'],
      ['Walking away · Search · Moving on', 'What are you leaving to find?'],
      ['Contentment · Wish · Satisfaction', 'What would enough feel like?'],
      ['Harmony · Family · Fulfillment', 'Where do you feel at home?'],
      ['Sensitivity · Message · Imagination', 'What surprising feeling has surfaced?'],
      ['Romance · Invitation · Idealism', 'What are you offering, and to whom?'],
      ['Compassion · Intuition · Depth', 'How can you hold this gently?'],
      ['Emotional balance · Calm · Counsel', 'How do you stay steady in deep water?']
    ],
    swords: [
      ['Clarity · Breakthrough · Truth', 'What just became obvious?'],
      ['Stalemate · Indecision · Blindfold', 'What are you refusing to look at?'],
      ['Heartbreak · Sorrow · Painful truth', 'What hurt needs naming?'],
      ['Rest · Recovery · Retreat', 'What would real rest look like?'],
      ['Conflict · Winning at a cost · Tension', 'Is winning worth it here?'],
      ['Transition · Passage · Moving forward', 'What are you carrying across?'],
      ['Strategy · Stealth · Evasion', 'What is being done in secret?'],
      ['Restriction · Self-limiting · Trapped', 'Which bind is looser than it looks?'],
      ['Anxiety · Worry · Sleeplessness', 'Which fear is louder at night?'],
      ['Rock bottom · Ending · Exhaustion', 'What can only go up from here?'],
      ['Inquiry · Vigilance · New ideas', 'What question do you keep asking?'],
      ['Haste · Ambition · Pursuit', 'Are you charging toward or away?'],
      ['Discernment · Honesty · Boundaries', 'What would you say if you said it plainly?'],
      ['Intellect · Judgment · Authority', 'What does the clearest head in the room decide?']
    ],
    pentacles: [
      ['Opportunity · Seed · Prosperity', 'What concrete chance is in your palm?'],
      ['Juggling · Adaptability · Balance', 'What are you keeping in the air?'],
      ['Craft · Collaboration · Skill', 'Who is building this with you?'],
      ['Holding on · Security · Control', 'What are you gripping too hard?'],
      ['Hardship · Exclusion · Need', 'Where is help closer than it seems?'],
      ['Generosity · Exchange · Support', 'Who gives, who receives — and is it fair?'],
      ['Patience · Assessment · Long view', 'What is still growing?'],
      ['Diligence · Practice · Mastery', 'What are you getting better at?'],
      ['Self-sufficiency · Comfort · Reward', 'What have you earned?'],
      ['Legacy · Wealth · Lineage', 'What will last beyond you?'],
      ['Study · Ambition · New venture', 'What are you willing to learn slowly?'],
      ['Steadiness · Routine · Reliability', 'What small step will you repeat?'],
      ['Nurture · Practicality · Resourcefulness', 'How do you make a place feel safe?'],
      ['Security · Success · Stewardship', 'What are you responsible for growing?']
    ]
  };

  const cards = [];
  MAJORS.forEach(([slug, name, keywords, prompt], n) => {
    cards.push({ index: n, slug, name, arcana: 'major', suit: null, number: n, keywords, prompt });
  });
  SUITS.forEach((suit, s) => {
    RANKS.forEach((rank, r) => {
      const [keywords, prompt] = MINOR[suit.id][r];
      cards.push({
        index: 22 + s * 14 + r,
        slug: `${rank}-of-${suit.id}`,
        name: `${RANK_NAMES[r]} of ${suit.name}`,
        arcana: 'minor', suit: suit.id, rank, number: r + 1, keywords, prompt
      });
    });
  });

  const pad = n => String(n).padStart(2, '0');
  const DECKS = {
    feline: {
      id: 'feline',
      name: 'Feline Foresight',
      short: 'Feline',
      tagline: 'Familiar symbolism. Unfamiliar mischief.',
      blurb: 'Seventy-eight engraved black-and-white illustrations in which every archetype is played by a cat — the Fool with a mouse at heel, the Devil on a pedestal of chains. Classic tarot structure with a sly, observant temperament.',
      status: 'Upcoming deck · all 78 fronts and the hexafoil back',
      scale: 1.1225, // image width ÷ outer-hex width (1347 / 1200 source canvas)
      ratio: 953 / 1100,
      back: 'assets/decks/feline/back.png',
      backThumb: 'assets/decks/feline/thumbs/back.webp',
      backAlt: 'Feline Foresight back: a white outlined hexafoil with paws, stars and ornaments on black, symmetrical under every sixty-degree turn.',
      file(card) {
        if (card.arcana === 'major') return `${pad(card.index)}-${card.slug}.webp`;
        return `${card.suit}-${card.rank}.webp`;
      }
    },
    maya: {
      id: 'maya',
      name: 'Maya-inspired Horror',
      short: 'Maya',
      tagline: 'Cobalt nights. Terracotta stone. Something waiting in the dark.',
      blurb: 'An atmospheric horror deck set among cobalt temples, waterfalls and eclipses, framed in carved terracotta. Contemporary horror imagery with a Maya-inspired visual language — not a claim to depict authentic deities.',
      status: 'Next deck · in development · all 78 fronts and the sixfold back',
      scale: 1.2, // 1536 / 1280 source canvas
      ratio: 1,
      back: 'assets/decks/maya/back.png',
      backThumb: 'assets/decks/maya/thumbs/back.webp',
      backAlt: 'Maya-inspired back: a sixfold cobalt and terracotta design around an outlined hexafoil.',
      file(card) { return `${pad(card.index)}-${card.slug}.webp`; }
    }
  };

  Object.values(DECKS).forEach(deck => {
    deck.image = card => `assets/decks/${deck.id}/fronts/${deck.file(card)}`;
    deck.thumb = card => `assets/decks/${deck.id}/thumbs/${deck.file(card)}`;
  });

  const api = { cards, SUITS, DECKS, bySlug: Object.fromEntries(cards.map(c => [c.slug, c])) };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FE_CARDS = api;
})(typeof window !== 'undefined' ? window : globalThis);
