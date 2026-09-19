# Delta for Design System

`openspec/specs/design-system/` does not exist yet — every requirement below is new.

## ADDED Requirements

### Requirement: Design Tokens as CSS Custom Properties

The system MUST expose the vendored design tokens (color, typography, spacing, radius, elevation, motion) as CSS custom properties, and MUST map the subset used by application code into Tailwind 4 via `@theme inline` so they are consumable as ordinary utility classes.

#### Scenario: Token utility class resolves to the mapped custom property

- GIVEN `globals.css` imports the vendored token files and maps a token through `@theme inline`
- WHEN a component uses a utility class such as `bg-surface-2` or `text-text-muted`
- THEN the rendered element's computed style resolves to that token's custom-property value, not a hardcoded literal

#### Scenario: Token value changes without a component edit

- GIVEN a token value changes in a vendored token CSS file
- WHEN the app is rebuilt
- THEN every utility class mapped to that token reflects the new value with no changes to any `.tsx` file

### Requirement: Self-Hosted Typography, No Runtime Font CDN

The system MUST self-host Space Grotesk (display), Instrument Sans (body), and JetBrains Mono (numerals and eyebrow labels) via `next/font/local`, subset to latin and limited to the weights actually used. The built worker MUST NOT issue any runtime network request to `fonts.googleapis.com`.

#### Scenario: No external font request from the built worker

- GIVEN the built worker serves any page
- WHEN the page loads in a browser
- THEN no network request is observed to `fonts.googleapis.com` or any other font CDN

#### Scenario: Correct font family per role

- GIVEN a page containing a display heading and a numeral/eyebrow label
- WHEN the page renders
- THEN the heading uses the Space Grotesk family and the numeral/eyebrow label uses the JetBrains Mono family

### Requirement: Vendored Icons, No External Icon CDN

The system MUST vendor, as inline assets, only the icon glyphs actually used by the shipped UI. The built worker MUST NOT fetch icons from `unpkg.com` or any other external CDN at runtime.

#### Scenario: No external icon request from the built worker

- GIVEN the built worker serves any page that renders an icon
- WHEN the page loads in a browser
- THEN no network request is observed to `unpkg.com` or any other icon CDN

### Requirement: Dark-First Theming Without a Toggle

The system MUST render in the dark theme by default on every route. Light-mode tokens under `[data-theme="light"]` MUST remain present in the codebase (scaffolded) but MUST NOT be exposed through any user-facing control in this change.

#### Scenario: Default theme is dark

- GIVEN a visitor with no stored theme preference
- WHEN any route renders
- THEN the page renders using the dark token values and no `data-theme="light"` attribute is applied

#### Scenario: No theme toggle is rendered

- GIVEN any route in this change
- WHEN the page is inspected
- THEN no control that switches `data-theme` is present in the rendered UI

### Requirement: Mobile-First Responsive Contract

Every screen in this change MUST render correctly at a 390px viewport width as the primary breakpoint, and MUST restate its layout exactly once at a desktop breakpoint of approximately 1200px container width. The system MUST NOT implement a tablet-specific breakpoint.

#### Scenario: 390px renders without overlap or horizontal scroll

- GIVEN any route in this change
- WHEN the viewport is set to 390px wide
- THEN all content is reachable without horizontal scrolling and no interactive element is clipped or overlapped

#### Scenario: Desktop restatement at ~1200px

- GIVEN any route in this change
- WHEN the viewport is set to a desktop width (~1200px container)
- THEN the layout restates using the desktop variant defined for that route, and no intermediate tablet-specific layout is applied between 390px and the desktop breakpoint

### Requirement: UI Primitives and Their States

The system MUST provide the following ported primitive components for use across every route in this change: `Icon`, `Button`, `IconButton`, `Card`, `Badge`, `Tag`, `Input`, `Select`, `Checkbox`, `Radio`, `GameTag`, and reduced variants of `ChallengeCard`, `PlayerRow`, and `StatTile` that render no coin, tier, or XP data.

Each interactive primitive (`Button`, `Input`, `Select`, `Checkbox`, `Radio`) MUST support a disabled state that prevents interaction. `Button` MUST additionally support a loading state. `Input` and `Select` MUST additionally support an error state that is visually distinct from the default state. Every focusable primitive MUST render a visible focus ring when reached via keyboard navigation.

#### Scenario: Disabled primitive is non-interactive

- GIVEN a `Button` or form primitive rendered with `disabled`
- WHEN a user attempts to click or submit through it
- THEN no action fires and the element is visually marked as disabled

#### Scenario: Button loading state blocks resubmission

- GIVEN a `Button` rendered with `loading`
- WHEN the user attempts to click it again
- THEN the click has no effect and a loading indicator is visible

#### Scenario: Input error state is visually distinct

- GIVEN an `Input` or `Select` rendered with an `error` prop and message
- WHEN the field is displayed
- THEN it renders with the error token styling and the error message is visible next to the field

#### Scenario: Focus ring visible on keyboard navigation

- GIVEN any focusable primitive on a rendered page
- WHEN the user tabs to it via keyboard
- THEN the element shows the token-defined focus ring

### Requirement: Header Navigation

The system MUST provide a header, present on every route, containing exactly three navigation destinations: Challenges, Create, and Account.

#### Scenario: Header renders on every route

- GIVEN any route in this change, signed in or signed out
- WHEN the page renders
- THEN the header is present with links to Challenges, Create, and Account

### Requirement: No Gamification or Social Surface

The system MUST NOT render coin balances, coin wagers, a coin purchase flow, tier badges, XP bars, rankings or leaderboards, a friends system, or notifications anywhere in this change. This is a scope boundary, not a temporary omission: none of these have a backend today, and none may be added incidentally while building the screens in this change.

#### Scenario: No gamification element is present on any rendered screen

- GIVEN any route shipped in this change
- WHEN the page is inspected
- THEN no coin, tier, XP, ranking, friends, or notification element is present
