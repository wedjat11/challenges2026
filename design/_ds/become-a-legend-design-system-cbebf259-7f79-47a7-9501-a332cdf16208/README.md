# Become a Legend — Design System

Dark-first design system for **Become a Legend**, a platform where friends challenge each other
1v1 in **League of Legends** and **Teamfight Tactics**. One player sends a challenge, another
accepts, they play, and the result is read automatically from the game's API. Winning moves you
up a ten-tier ladder and pays out season XP and in-app coins.

Built late 2026. The reference points the brand was held to: Apple-style restraint — generous
space, precise type, almost no ornament — applied to a competitive gaming product.

## Sources

**No design sources were supplied.** No Figma file, no codebase, no repository, no slide deck, no
logo files, no photography. Everything here was authored from a written brief plus a structured
interview with the product owner. Specifically decided in that interview:

- Product: 1v1 duels between friends; LoL and TFT at launch; winner = whoever wins the match.
- Result verification: automatic, via the game API. There is no screenshot upload and no
  manual dispute flow — the UI states this explicitly wherever a result appears.
- Stakes: season XP plus purchasable coins. The coin + XP chip is persistent in every header.
- Ladder: ten named tiers, Spanish, lowest to highest — Madera, Hierro, Bronce, Plata, Oro,
  Esmeralda, Platino, Retador, Maestro, Gran Maestro. Each gets a literal metal/gem colour and a
  letter mark (no crests, no illustrated emblems).
- Surfaces: marketing website, mobile app, player web dashboard, onboarding, sponsor-sales slide
  template, transactional email.
- Language: both English and Spanish ship; **all mocks are in Spanish**, informal youth register.
- Explicitly ruled out: anything that reads as gambling, neon/RGB gamer clichés, corporate SaaS
  coldness, heavy glassmorphism, loud gradients, anything cartoonish.

Because nothing was imported, nothing here is a recreation of an existing product — it is an
original system. Where the brief was silent (coin store, settings detail), screens are left blank
with a disclaimer rather than invented.

## Brand mark

**No logo files were supplied, so this system ships no logo.** Wherever a mark would go, the name
is set in type: a stacked two-line lockup, `Become / a Legend`, all caps, Space Grotesk 700,
-0.04em tracking, line-height 0.92. See `guidelines/brand-wordmark.card.html`. `assets/` holds no
logo — if a real mark exists, drop it in and replace the type lockups in `ui_kits/*/Nav.jsx`,
`Shell.jsx`, `Sidebar.jsx` and the slide files.

## Font substitution

No licensed font binaries were supplied. The system uses open Google Fonts, loaded from the CDN in
`tokens/fonts.css` (an `@import`, not local `@font-face` files):

| Role | Font | Why |
|---|---|---|
| Display | **Space Grotesk** 500/700 | Neo-grotesk with enough character to feel game-native without novelty |
| Body | **Instrument Sans** 400/600 | Quiet, current, reads cleanly at 13-19px |
| Numerals / labels | **JetBrains Mono** 500 | Tabular numerals for scores, coins, XP, timers |

**If you have brand fonts, send them.** Drop the `.woff2` files into `assets/fonts/`, replace the
`@import` in `tokens/fonts.css` with real `@font-face` rules, and nothing else needs to change —
every component references `--font-display` / `--font-body` / `--font-mono`.

---

## CONTENT FUNDAMENTALS

**Language.** Both English and Spanish are supported; every mock in this system is Spanish. The
register is Latin-American, informal and young — `vos/tú`, never `usted`. Second person, always:
the product talks *to* the player, never about itself. "Retá a un amigo para empezar", not
"Los usuarios pueden crear retos".

**Length.** Short sentences that end. Headlines are two to four words per line and often stack:
"Tus amigos. / Tus reglas. / Tu leyenda." Body copy stays under 30 words per paragraph. No
subordinate clauses stacked three deep.

**Casing.** Sentence case everywhere — buttons, labels, headings, nav. The only all-caps in the
system are the wordmark and the mono eyebrow labels (`TEMPORADA 3 · EN VIVO`), which are tracked
out to 0.16em. Never all-caps a button.

**Tone.** Confident and flat. The product states what happens and does not hype it. "El resultado
se verifica solo." — no exclamation mark, no "¡Increíble!". Competitive without trash talk: the
brand taunts nobody, it just keeps score. Where the copy has warmth it comes from the stakes being
social ("Nadie se vuelve leyenda solo."), not from cheerleading.

**Never say.** Apostar / apuesta in the gambling sense ("monedas en juego", not "apostale"),
"gratis", "premio garantizado", anything implying real-money payout. Nothing that reads like a
casino. No "gamers" as a form of address.

**Numbers.** Always in mono, always `es-MX` formatting: `2 480` monedas, `12 400 XP`, `14-3`,
`Lv 37`, `Oro II`. Records are hyphenated, never "14 wins / 3 losses".

**Emoji: never.** Not in UI, not in email, not in slides. Status is carried by a coloured badge or
a Lucide glyph.

**Real examples from this system:**

| Slot | Copy |
|---|---|
| Homepage headline | Tus amigos. Tus reglas. Tu leyenda. |
| Homepage sub | Mandá un reto 1v1 en League of Legends o TFT. Tu amigo lo acepta, juegan, y el resultado se verifica solo. |
| Primary CTA | Crear mi cuenta |
| Challenge action | Aceptar reto / Rechazar |
| Empty feed | Retá a un amigo para empezar. |
| Verification note | El resultado lo leemos de la API del juego al terminar la partida. |
| Toast | Reto ganado · +180 XP · +50 monedas |
| Closing statement | Nadie se vuelve leyenda solo. |
| Email subject | Ana López te retó a un 1v1. |

---

## VISUAL FOUNDATIONS

**Ground.** Near-black, very slightly cool: `--ink-950 #08090A` is the canvas. Every surface above
it is one value step, not a shade of grey chosen by eye — `--surface-1 #121316`, `--surface-2
#17181C`, `--surface-3 #1C1E22`, `--surface-raised #23252B`. Light mode exists as full token parity
under `[data-theme="light"]` and is exercised by the dashboard's sun/moon toggle, but dark is the
product.

**Accent.** One red, `--red-500 #E8452F`, and it is rare. It appears on the single primary action in
a view, on live/active state, and as a structural edge (a 2px top rule, a tinted half of a split
block). Two red buttons side by side is a bug — see `guidelines/brand-accent-use.card.html`. Amber
`#E0A227` belongs to coins alone; green `#3FBF7F` to wins; blue `#4C8DF6` to informational states.
Tier colours are the only other saturated palette and they only ever appear on tier marks, avatar
rings, XP fills and tier card edges.

**Type.** Space Grotesk for display at -0.035 to -0.045em tracking; Instrument Sans for body at
1.55 line-height; JetBrains Mono for every number and every eyebrow label. Display sizes are big
and few: 104px on a title slide, 76px on the homepage hero, 44-60px for section heads. Body never
goes below 13px in product UI, 14px mono on slides.

**Spacing and layout.** 4px-based scale, used generously: 96px between website sections, 80/88px
slide margins, 28px dashboard padding, 20-24px app padding. Content column caps at 1200px with
40px gutters (20px on mobile). Sections are separated by a hairline rule, not by alternating
background colours — the system has exactly two background values in play per screen.

**Backgrounds.** Flat. No imagery ships with this system (none was supplied), no gradients, no
noise, no patterns, no illustration. Where a screen needs visual interest it comes from the
split-block motif or from real data. If photography is added later it should be cool-toned, low
saturation, and never sit behind body text.

**The split-block motif.** The brand's one piece of geometry: two equal blocks, one in accent, one
neutral, meeting on a hairline seam. It is the head-to-head in `ChallengeCard`, the two halves of
`MatchResult`, the coin/XP chip, the comparison slide, the foot rule on title slides. No bevels, no
gradients, no drop shadows on it.

**Corner radii.** Sharp: 2px on controls (`--radius-control`), 3-4px on cards
(`--radius-card` = 4px), 6px maximum. Fully-rounded (`--radius-pill`) is reserved for live status
chips, the notification badge and the `Switch` track. Avatars are 3px squares, never circles.

**Cards.** `--surface-2` ground, a single 1px `rgba(255,255,255,.08)` hairline, 4px radius, 20-32px
padding, **no shadow by default**. Depth is a value step plus a hairline. A live challenge earns a
2px red rule on its **top** edge — never a coloured left border.

**Shadows.** Three steps only, and they are for things that float: `--shadow-1` rows and inputs,
`--shadow-2` popovers, toasts and menus, `--shadow-3` modal dialogs. Nothing static carries a
shadow. `--shadow-inset-top` adds a 5%-white top highlight where a raised control needs it.

**Transparency and blur.** Two sanctioned uses: the sticky site nav (`rgba(8,9,10,.88)` + 20px
blur) and the modal scrim (`--overlay-scrim` at 72% + `--blur-overlay`). Tints (`--red-tint`,
`--green-tint`, tier tints) are flat low-alpha fills for chips and selected rows. No frosted panels,
no glass cards.

**Animation.** Fades and opacity, nothing else. `--dur-fast 150ms` for hover and opacity,
`--dur-base 220ms` for enter/exit and the XP bar's width, `--dur-slow 320ms` for the modal scrim,
`--dur-instant 80ms` for press feedback. Easing is `--ease-standard cubic-bezier(.2,0,.2,1)`. No
springs, no bounce, no scale-in, no parallax, no autoplaying motion. Respect
`prefers-reduced-motion` by dropping transitions entirely.

**Hover.** Surfaces go one step lighter (`surface-2` → `surface-3`); borders go from hairline to
subtle; text goes from muted to primary; links drop to 72% opacity. Primary buttons lighten to
`--red-400` — they never darken.

**Press.** Opacity to 0.86. Nothing scales, nothing translates, nothing shrinks.

**Focus.** `--shadow-focus` — a 3px `rgba(232,69,47,.55)` ring. Always visible for keyboard users;
never removed.

**Disabled.** Opacity 0.38, cursor `not-allowed`, no colour change.

**Borders.** Four weights, all white-alpha: hairline 8%, subtle 12%, strong 20%, divider 7%. Rows
inside a card are separated by `--divider`, never by nested cards. Tables and lists use bottom
dividers with none on the last row.

**Iconography colour.** Icons inherit text colour and sit at `--text-muted` or `--text-secondary`
by default; the only coloured glyphs are the coin (amber) and a live/active toggle (red).

---

## ICONOGRAPHY

**No icon assets were supplied with the brief, so the system standardises on Lucide from CDN and
flags it as a substitution.** Lucide was chosen for its 1.5-2px outline weight and square-ish
terminals, which match the sharp-cornered geometry; the system pins **1.75** as the standard stroke
weight.

- Loaded once per page: `<script src="https://unpkg.com/lucide@0.544.0/dist/umd/lucide.js">`.
- Never hand-roll an SVG. Use `<Icon name="…" />` (`components/core/Icon.jsx`) — it is the only
  sanctioned way to draw a glyph, and it keeps stroke weight and sizing consistent.
- Sizes: 13-14px inline in badges and tags, 16-17px in buttons and rows, 20-21px in the mobile tab
  bar, 28px in empty states. Above 32px, drop the stroke to 1.5.
- Icons are monochrome and inherit `currentColor`. Two exceptions: `coins` is amber, an active
  toggle is red.
- The working set in this system: `swords` (challenge), `trophy` (ranking/win), `coins`, `flame`
  (streak), `shield-check` (verification), `gamepad-2` (Riot login), `user` / `users`,
  `user-check`, `layout-grid` (feed), `plus` (create), `bell`, `settings`, `search`, `mail`,
  `lock`, `check`, `x`, `arrow-left`, `arrow-right`, `chevron-down`, `circle-check`,
  `circle-alert`, `clock`, `info`, `sun`, `moon`, `heart`, `loader-circle`.
- **Emoji are never used** as icons or decoration. Unicode characters are not used as icons
  either; the one typographic mark used structurally is the middot separator (`·`) in mono meta
  lines.
- **No game logos or game art ship with this system.** `GameTag` renders "League of Legends" and
  "TFT" as text only, by decision — Riot's marks and champion art are not ours to redistribute.
  If licensed assets arrive, they go in `assets/games/` and `GameTag` gains an optional mark slot.
- `assets/` is therefore empty of brand imagery. Nothing in this system draws an illustration.

---

## Intentional additions

Nothing defined the component inventory, so the system authors a standard primitive set sized to
the product, plus a game-specific family the product genuinely needs:

- `Icon` — a wrapper over Lucide, added so no page hand-writes SVG.
- `TierBadge`, `CoinChip`, `XPBar`, `GameTag`, `PlayerRow`, `StatTile`, `ChallengeCard`,
  `MatchResult` — the ladder, the stakes and the duel are the product; these keep every surface
  rendering them identically.

## INDEX

**Root**

| File | What it is |
|---|---|
| `styles.css` | Global entry — `@import` list only. Consumers link this one file. |
| `readme.md` | This document. |
| `SKILL.md` | Agent-skill front matter for use outside this project. |
| `thumbnail.html` | Homepage tile for the design system. |

**`tokens/`** — `fonts.css`, `colors.css` (ink ramp, accent, semantic, light theme), `tiers.css`
(ten tier colours + tints), `typography.css`, `spacing.css`, `radius.css`, `elevation.css`,
`motion.css`, `base.css` (element resets, `.bal-eyebrow`, `.bal-num`).

**`guidelines/`** — 20 specimen cards feeding the Design System tab: ink ramp, accent, semantic
states, surfaces & borders, tier ladder (×2), light mode, display / titles / body / mono / eyebrow
type, spacing scale, layout & density, radius, elevation, motion, wordmark, split-block geometry,
accent discipline.

**`components/`** — 22 components, each with `.jsx`, `.d.ts` and `.prompt.md`, one `@dsCard` per
directory:

- `core/` — `Icon`, `Button`, `IconButton`, `Card`, `Badge`, `Tag`, `Avatar`
- `forms/` — `Input`, `Select`, `Checkbox`, `Radio`, `Switch`
- `feedback/` — `Dialog`, `Toast`, `Tooltip`
- `navigation/` — `Tabs`, `BottomNav`
- `game/` — `TierBadge` (+ exported `TIERS`), `CoinChip`, `XPBar`, `GameTag`, `PlayerRow`,
  `StatTile`, `ChallengeCard`, `MatchResult`

**`ui_kits/`**

| Kit | Entry | What it shows |
|---|---|---|
| `website/` | `index.html` | Marketing homepage, 1400px: hero, how-it-works, tier ladder, verification, CTA, working signup dialog |
| `app/` | `index.html` | Two 390×844 phones: full onboarding, and a click-through app (feed, composer, detail, ranking, profile) |
| `dashboard/` | `index.html` | 1440px player dashboard with sidebar routing and the light-mode toggle |
| `email/` | `challenge-invite.html` | Transactional challenge invite, table-based, 600px |
| `slides/` | `index.html` | Six sponsor-sales slide types at 1280×720 |

Each kit has its own `README.md` listing files and interactions.

**`templates/`** — starting folders a consuming project can copy. Each is a Design Component that
loads this system through its sibling `ds-base.js`:

| Template | Entry | What it is |
|---|---|---|
| Landing page | `templates/landing/Landing.dc.html` | Hero + explainer + CTA, tweakable stake/XP |
| App feed screen | `templates/app-feed/AppFeed.dc.html` | 390×844 feed with working tabs and tab bar |
| Sponsor deck | `templates/sponsor-deck/SponsorDeck.dc.html` | Four 1280×720 sales slides |

In a consuming project, point the `base` line in each template's `ds-base.js` at the bound
`_ds/<folder>` tree.

**`assets/`** — empty. No logo, imagery or icon binaries were supplied; see the Brand mark and
Iconography sections.
