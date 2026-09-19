# Vendored fonts

Self-hosted via `next/font/local` (design decision D4 — no runtime request to
`fonts.googleapis.com`). All three families are licensed under the SIL Open
Font License, Version 1.1; see the accompanying `OFL-*.txt` files, copied
verbatim from the source below.

## Source builds

Variable TrueType builds from the public `google/fonts` GitHub repository,
`ofl/<family>/` directory, downloaded 2026-09-18:

| Family | Source file | Source commit |
|---|---|---|
| Space Grotesk | `ofl/spacegrotesk/SpaceGrotesk[wght].ttf` | `00a38a53f92aef923b9353f40128e8f4552ddae4` |
| Instrument Sans | `ofl/instrumentsans/InstrumentSans[wdth,wght].ttf` | `0b58fb370093f9a9f4ff785d94405710b79de67c` |
| JetBrains Mono | `ofl/jetbrainsmono/JetBrainsMono[wght].ttf` | `6e4b84c976cadb3c49a40fd9a1c203e4f7fcf2da` |

Base URL: `https://raw.githubusercontent.com/google/fonts/main/`.

## What is committed

The source TTFs are not committed. Each was subset to the latin range and
packed as a variable `woff2` (the format design.md §2 specifies), keeping every
variation axis and all OpenType layout features:

```bash
python3 -m fontTools.subset "<Family>-Variable.ttf" \
  --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" \
  --flavor=woff2 --layout-features='*' --no-hinting \
  --output-file="<Family>-Variable.woff2"
```

(fontTools 4.65.0 with brotli.) The unicode list is the same latin range
Google Fonts serves as its `latin` subset. Re-run the command after
re-downloading a source build to refresh a family.

Weights declared in `src/app/fonts.ts` (per design.md §2): Space Grotesk
400–700, Instrument Sans 400–600, JetBrains Mono 400–500 — each a single
variable file covering its whole weight range.

Instrument Sans also ships an italic variable file
(`InstrumentSans-Italic[wdth,wght].ttf`) upstream; it is not vendored because
nothing in the screens this change ships uses italic text (design.md §2).
