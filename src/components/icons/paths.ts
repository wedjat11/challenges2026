/**
 * Vendored glyph data for the 14 Lucide icons this change uses, copied from
 * `lucide@0.544.0`'s `dist/esm/icons/<name>.js` sources (ISC — see
 * `LICENSE-lucide.txt` in this directory). Each glyph is the same
 * `[tag, attrs]` tuple array Lucide ships; `Icon` (`./icon.tsx`) turns each
 * tuple into the matching SVG child element.
 *
 * `strokeLinecap`/`strokeLinejoin` are not repeated per path: SVG's
 * `stroke-linecap`/`stroke-linejoin` presentation attributes inherit down
 * the tree, so `Icon` sets both once on the `<svg>` root, exactly as
 * Lucide's own generated React components do.
 *
 * design-system: Vendored Icons, No External Icon CDN
 */

type IconElementTag = "path" | "circle" | "rect" | "line" | "polyline";
type IconElementAttrs = Readonly<Record<string, string>>;
type IconElementTuple = readonly [IconElementTag, IconElementAttrs];

export const ICON_PATHS = Object.freeze({
  swords: [
    ["polyline", { points: "14.5 17.5 3 6 3 3 6 3 17.5 14.5" }],
    ["line", { x1: "13", x2: "19", y1: "19", y2: "13" }],
    ["line", { x1: "16", x2: "20", y1: "16", y2: "20" }],
    ["line", { x1: "19", x2: "21", y1: "21", y2: "19" }],
    ["polyline", { points: "14.5 6.5 18 3 21 3 21 6 17.5 9.5" }],
    ["line", { x1: "5", x2: "9", y1: "14", y2: "18" }],
    ["line", { x1: "7", x2: "4", y1: "17", y2: "20" }],
    ["line", { x1: "3", x2: "5", y1: "19", y2: "21" }],
  ],
  "layout-grid": [
    ["rect", { width: "7", height: "7", x: "3", y: "3", rx: "1" }],
    ["rect", { width: "7", height: "7", x: "14", y: "3", rx: "1" }],
    ["rect", { width: "7", height: "7", x: "14", y: "14", rx: "1" }],
    ["rect", { width: "7", height: "7", x: "3", y: "14", rx: "1" }],
  ],
  plus: [
    ["path", { d: "M5 12h14" }],
    ["path", { d: "M12 5v14" }],
  ],
  user: [
    ["path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" }],
    ["circle", { cx: "12", cy: "7", r: "4" }],
  ],
  x: [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }],
  ],
  check: [["path", { d: "M20 6 9 17l-5-5" }]],
  "circle-check": [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "m9 12 2 2 4-4" }],
  ],
  "circle-alert": [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["line", { x1: "12", x2: "12", y1: "8", y2: "12" }],
    ["line", { x1: "12", x2: "12.01", y1: "16", y2: "16" }],
  ],
  clock: [
    ["path", { d: "M12 6v6l4 2" }],
    ["circle", { cx: "12", cy: "12", r: "10" }],
  ],
  "chevron-down": [["path", { d: "m6 9 6 6 6-6" }]],
  "arrow-left": [
    ["path", { d: "m12 19-7-7 7-7" }],
    ["path", { d: "M19 12H5" }],
  ],
  "arrow-right": [
    ["path", { d: "M5 12h14" }],
    ["path", { d: "m12 5 7 7-7 7" }],
  ],
  copy: [
    ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2" }],
    ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }],
  ],
  "loader-circle": [["path", { d: "M21 12a9 9 0 1 1-6.219-8.56" }]],
} as const satisfies Record<string, readonly IconElementTuple[]>);
