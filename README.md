# The Faceted Eye — version 3

A free hexagonal-tarot reading experience built to grow a Kickstarter following for **Feline Foresight**. Visitors ask a question, tap a card, watch it flip and turn, read the edge that lands on top, then share the reading or follow the campaign.

**Live:** https://jonbold11.github.io/faceted-eye-v3/
**Earlier versions, unchanged:** [v2](https://jonbold11.github.io/faceted-eye-v2/) · [v1](https://jonbold11.github.io/faceted-eye/)

## Two settings to fill in — `js/config.js`

| Setting | What to put there |
| --- | --- |
| `KICKSTARTER_URL` | Your Kickstarter pre-launch page URL. Until it's set, every "Follow on Kickstarter" button opens a short "coming soon" note instead of linking out. |
| `GOATCOUNTER` | The code of a free, cookie-free [GoatCounter](https://www.goatcounter.com) site (e.g. `facetedeye` for `facetedeye.goatcounter.com`). Until it's set, no analytics script loads at all. |

Once GoatCounter is on, it counts page views per section plus these events: `kickstarter-click` (labelled with which button), `share`, `reading-complete`, `daily-reveal`. No cookies, no personal data; questions typed into the site never leave the device.

## Sections (bottom tabs on phones)

| Tab | Route | What it does |
| --- | --- | --- |
| **Read** | `#/` | Guided first reading: ask (with example questions), tap, the card flips and turns, the answer appears with keywords and a prompt. Then **Share this reading** (story-size image), **Draw two more** (opens the table with the question carried over) and **Follow on Kickstarter**. Below: "Tarot with the geometry of a die" in three steps. |
| | `#/table` | The full Reading Table from v2: every spread, open table, flip, turn, live edge and seam notes. Adds image sharing and a Kickstarter card once every card is revealed. |
| **Daily** | `#/daily` | The same card and turn for everyone on a given date. Reveal, share, a streak kept on the device, and a countdown to the next card. |
| **Decks** | `#/decks/feline`, `#/decks/maya` | Launch pages: hero with Kickstarter button, flip-through, what makes it different, what's in the deck, all 78 cards with the card viewer, FAQ, final Kickstarter call. Feline Foresight leads. |
| **Learn** | `#/learn`, `#/learn/<id>` | The ten studies as swipeable story steps, each ending with "Deal it on the table". |
| | `#/learn/cheat-sheet` | The whole system on one page, with print styles. |
| **More** | `#/more` | About, Goods, cheat sheet, open table and links to earlier versions. |

The rules are unchanged from v1/v2, including the public "Fuck yes" name for I · I.

## Files

```
index.html             shell and navigation
css/v2.css, css/v3.css base styles (from v2) and v3 additions
js/config.js           the two settings above + lead deck
js/analytics.js        cookie-free GoatCounter hook (inactive until configured)
js/hex.js              hexagon geometry, edges, contacts, named pairs
js/ui.js               hex cards, boards, Kickstarter button, daily-card seed
js/share.js            canvas-rendered share images (1080 × 1920)
js/read.js             Read (guided first reading)
js/daily.js            Daily card
js/table.js            Reading Table
js/views.js            decks, deck launch pages, learn, lesson stories, cheat sheet, goods, about, more
js/app.js              hash router
js/data/*.js           78-card index, v1 studies, content
```

No build step and no dependencies. Run locally:

```
python3 -m http.server 8791 --bind 127.0.0.1
open http://127.0.0.1:8791/
```

## Tests

```
node tests/geometry.test.cjs                              # 165 checks against the original v1 engine
npm i -D playwright-core && node tests/browser.test.cjs   # 192 end-to-end checks, desktop and phone
```
