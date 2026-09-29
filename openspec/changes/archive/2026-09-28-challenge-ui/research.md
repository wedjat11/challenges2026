# Research: the "Become a Legend" design export (T12 input)

Change: `challenge-ui` · Source: `design/` in the repository, exported by the owner from Claude Design on 2026-09-19 · Method: read-only mapping by a delegated explorer; tokens read in full, screens and bundles read structurally. Engram mirror: topic `sdd/challenge-ui/research`.

## 1. Design system tokens

**Colors** (`tokens/colors.css`, dark-first with a `[data-theme="light"]` override block):
- Ink ramp `--ink-1000 #050506` → `--ink-000 #FFFFFF` (15 steps). Background `--bg-canvas: var(--ink-950)` (`#08090A`), `--bg-base: var(--ink-900)`.
- Surfaces `--surface-1 #121316`, `--surface-2 #17181C`, `--surface-3 #1C1E22`, `--surface-raised #23252B`, `--surface-sunken #050506`, `--surface-inverse #FFFFFF`.
- Text `--text-primary #FFFFFF`, `--text-body: var(--ink-100)`, `--text-secondary`, `--text-muted`, `--text-faint`, `--text-inverse`, `--text-accent: var(--red-400)`.
- Brand red ramp `--red-700 #9E2716` → `--red-300 #F79381`; primary `--red-500 #E8452F`; tints `--red-tint`, `--red-tint-strong`.
- Semantic `--green-500 #3FBF7F` (wins), `--amber-500 #E0A227` (coins), `--blue-500 #4C8DF6` (info), each with a tint; `--state-win/-loss/-live/-pending`; `--focus-ring`.
- Action tokens `--action-primary-bg/-hover/-active/-fg`, `--action-secondary-*`, `--action-ghost-fg`. Borders `--border-hairline` 8%, `--border-subtle` 12%, `--border-strong` 20%, `--divider` 7% (white alpha in dark).
- Tiers (`tokens/tiers.css`): ten steps Madera `#8A6244`, Hierro `#8C9099`, Bronce `#B0773A`, Plata `#C6CBD4`, Oro `#E0B341`, Esmeralda `#2FA97A`, Platino `#9FD3D8`, Retador `#E8452F`, Maestro `#7C5CE0`, Gran Maestro `#F2E6C8`, each with a 16% tint. Consumed by `TierBadge`, `XPBar`, avatar rings and card edges.

**Fonts** (`tokens/fonts.css`): Google Fonts `@import` at runtime. `--font-display` Space Grotesk (400–700), `--font-body` Instrument Sans (400–600, italic 400), `--font-mono` JetBrains Mono (400–700, all numerals and eyebrows).

**Type scale** (`tokens/typography.css`): display `clamp(48px,7vw,88px)` / `clamp(40px,5.2vw,64px)` / `clamp(32px,3.6vw,44px)`; titles 32/24/20; body-lg 18, body 16, body-sm 14, caption 13, micro 11. Line heights 1.02 display, 1.14 title, 1.55 body, 1.3 tight. Tracking `-0.035em` (display) to `+0.16em` (eyebrow). Weights 400/500/600/700.

**Spacing** (`tokens/spacing.css`): 4px-based `--space-1` (2px) → `--space-15` (160px); `--gutter-mobile 20px`, `--gutter-desktop 40px`, `--container-max 1200px`, `--container-prose 680px`, `--section-y: var(--space-13)` (96px), `--hairline 1px`.

**Radius** (`tokens/radius.css`): sharp; `--radius-0`…`--radius-4` (0–6px), `--radius-pill 999px` for chips and switches only; `--radius-card 4px`, `--radius-control 3px`.

**Elevation** (`tokens/elevation.css`): `--shadow-1/2/3` for rows, popovers and modals only ("nothing static carries a shadow"); `--shadow-inset-top`, `--shadow-focus` (3px red ring), `--overlay-scrim`, `--blur-overlay: blur(20px)`.

**Motion** (`tokens/motion.css`): `--dur-instant 80ms`, `--dur-fast 150ms`, `--dur-base 220ms`, `--dur-slow 320ms`; `--ease-standard cubic-bezier(.2,0,.2,1)` plus `-out`/`-in`. Only opacity and fade transitions; no springs, scale or parallax.

## 2. Component inventory

26 React components (`.jsx` + `.d.ts` + `.prompt.md` each) per `_ds_manifest.json` and the README:
- **core**: `Icon`, `Button` (`variant`, `size`, `icon`, `fullWidth`, `disabled`, `loading`), `IconButton`, `Card` (`surface`, `padding`, `interactive`, `accentEdge`, `elevation`), `Badge` (`tone`, `dot`, `pill`), `Tag`, `Avatar` (square, 3px radius, never circular).
- **forms**: `Input` (`label`, `value`, `icon`, `hint`, `error`, `suffix`), `Select`, `Checkbox`, `Radio`, `Switch`.
- **feedback**: `Dialog`, `Toast`, `Tooltip`.
- **navigation**: `Tabs`, `BottomNav`.
- **game** (product-specific): `TierBadge` (+ exported `TIERS`), `CoinChip`, `XPBar`, `GameTag` (text only, no Riot marks), `PlayerRow`, `StatTile`, `ChallengeCard` (live cards get a 2px red top rule), `MatchResult` (split-block motif on a hairline seam).

Implementation: raw `React.createElement` with inline `style` objects reading CSS custom properties. Not Tailwind classes. `styles.css` is only an `@import` manifest of the token files; the only global utilities are `.bal-eyebrow` and `.bal-num` in `tokens/base.css`. Components must be ported to TSX with classes or arbitrary-value utilities; they are not reusable as-is.

## 3. Screens

All `.dc.html` files are canvas exports (`<x-dc>` plus `deck-stage.js`/`support.js` runtime), not standalone pages. Copy lives in a bilingual `COPY = { es, en }` object per file, bound through `{{ t.key }}` templates.

- **Login** ("Maqueta 01 · Login"): states Principal, Permisos, Conectando, Error, Cuenta nueva, plus desktop D01–D05. Sign-in is **Riot Games OAuth**: `cta: 'Entrar con Riot'`, `dTitle: 'Entrá con tu cuenta de Riot.'`; the permission screen lists reading Riot ID and region, match history and rank. Headline "Tus amigos. Tus reglas. Tu leyenda."; sub "Mandá un reto 1v1 en League of Legends o TFT. Tu amigo lo acepta, juegan, y el resultado se verifica solo." Not part of T12.
- **Dashboard** ("Maqueta 02 · Dashboard inicial"): states Con retos, Vacío, Toast. Tabs `Para mí` / `Enviados` / `Historial`. Challenge cards with `Pendiente` / `En curso`, stat tiles `Retos ganados`, `Racha`, `Monedas ganadas`, a "Ranking entre amigos" module, a coin/XP header chip. Empty state "Todavía no tenés retos." / "…Empezás con 500 monedas de regalo." Bottom nav Retos / Ranking / Crear / Avisos / Perfil; desktop sidebar adds Historial and Monedas. Maps to T12 browse and view, plus ranking and coins the backend lacks.
- **Crear Reto** ("Maqueta 03 · Crear reto"): four-step wizard Tipo → Parámetros → Rival → En juego. Step 1 offers three categories, Duelo, Desempeño, Constancia, with about ten preset goal templates (win the match, win under X minutes, deathless, KDA of X, X games with champion Y, win streak, top-4 in TFT X times). Step 3 is a rival picker ("¿A quién retás?") by Riot ID with an opponent-insight line. Step 4 sets a coin wager per side, a deadline and an optional message, with the note "Nada se cambia por dinero"; insufficient coins routes to the coin-purchase upsell. Maps to T12 create, but the model (category + one templated goal + stake + one rival) differs from the app's target + criteria rules with participants and public/unlisted visibility.
- **Recibir Reto** ("Maqueta 04 · Recibir, aceptar y rechazar"): states Push, Detalle pendiente, Confirmar, Aceptado, Sin monedas, Rechazado, Expirado, an email variant and desktop states. The accept flow: a friend sends a challenge, the recipient sees goal, stakes and deadline, must match (`igualar`) the stake to accept, coins are held (`retenidas`) until resolution, results are read from Riot's API, 24 h auto-expiry without penalty. Push copy "Ana López te retó" / "Gana 3 partidas con Ahri en 3 días · 150 monedas · +180 XP." Maps to T12 join and view, minus escrow and expiry.
- **Comprar Monedas** ("Maqueta 05 · Compra de monedas"): store, method (PayPal, Mercado Pago with OXXO and 7-Eleven cash), processing, success, rejected, history, email receipt, desktop. Real-money purchase, MXN, "Become a Legend S.A. de C.V. · CDMX, México". Does not map to T12.

## 4. Wireframes

`Wireframes Retos.dc.html` ("Turno 1/2") and `Wireframes Retos Deck.dc.html` (the same restaged as a 1920×1080 deck) are low-fidelity explorations. They add: an explicit critical path Login → Feed vacío → Crear reto → Detalle → Resultado → Ranking, and catalog → configure → rival → send for creation; three navigation alternatives (5-tab bar with Crear as a tab; 4 tabs plus a central "Retar" FAB with alerts as a header bell; header-only with filter chips), the hi-fi Dashboard landing near the first two; onboarding alternatives (direct Riot login vs a 3-step carousel), the hi-fi kit shipping the direct login; sketched Ranking, Profile, Notifications and an 1100px web dashboard; explicit empty, loading and error states per screen group. Mobile-first at 390px; desktop is a secondary restatement.

## 5. Gaps and conflicts with the existing app

- **Language**: all design copy is Spanish (Latin American, `vos`); the app's copy is English. A retranslation or an i18n layer is needed either way.
- **Auth provider**: the design's Login is Riot Games OAuth; the app signs in with Discord only, and Riot Sign On is gated behind a production key the project does not hold. Discord stays until RSO exists; the Login screen must adapt.
- **Features the backend lacks**: a coin economy (wagers, escrow on accept, real-money purchase, history, receipts); a ten-tier ladder with XP and a friends leaderboard; notifications and push; a friends system; avatars.
- **Challenge model**: the design is a 1v1 duel between two named players with a preset goal, a coin stake and a deadline; the app is a goal challenge with `target + criteria` rules, any number of participants, public or unlisted visibility, progress rows per participant, no stakes. Reconciling the two is a product decision, not a copy task.
- **Result verification**: the design assumes automatic verification from Riot's API for every challenge with no dispute flow, which matches the app's polling model.
- **Fonts and icons**: Space Grotesk, Instrument Sans and JetBrains Mono load from `fonts.googleapis.com`; icons from `unpkg.com/lucide@0.544.0`. Both are runtime CDN dependencies; self-host for Cloudflare Workers.
- **Theme**: full light-mode token parity exists, but "dark is the product" and only the Dashboard exercises the light toggle.
- **Responsive**: 390×844 mobile primary, 1440×900 or 1100–1200px desktop; no tablet breakpoint anywhere.
- **Brand assets**: wordmark set in type; no icon or logo files.
- **Prompt-injection check**: no agent-directed instructions found in any file.

## 6. Integration recommendation

- Tokens into Tailwind 4 through `@theme` in `globals.css`, referencing the exported values so utilities like `bg-surface-2` exist; keep tier colors and the three shadows as first-class tokens. Self-host the three fonts with `next/font/local`; vendor icons.
- Port `core`, `forms` and `feedback` components to TSX with Tailwind classes now; they carry no product assumptions. Port `game` components only after the coins, tiers and stakes questions are settled, since they render data the backend does not produce.
- Keep the token layer as CSS custom properties so the design tool can keep exporting into the same files.
- Before visual work, the owner decides: (a) auth stays Discord until RSO, so the Login screen adapts; (b) whether coins, wagering, tiers, ranks and friends are in this cycle or aspirational; (c) which challenge model is authoritative for T12.
