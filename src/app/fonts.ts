import localFont from "next/font/local";

/**
 * Self-hosted variable fonts, subset to latin and packed as woff2 (D4) — no
 * build-time or runtime request to fonts.googleapis.com. Licensed under SIL
 * OFL 1.1; see src/app/fonts/README.md for the source builds, the subsetting
 * command and the accompanying OFL-*.txt files.
 *
 * Each `variable` name is bound to the design's family tokens in
 * src/styles/tokens/app-fonts.css.
 */

export const spaceGrotesk = localFont({
  src: "./fonts/SpaceGrotesk-Variable.woff2",
  weight: "400 700",
  display: "swap",
  variable: "--font-space-grotesk",
});

export const instrumentSans = localFont({
  src: "./fonts/InstrumentSans-Variable.woff2",
  weight: "400 600",
  display: "swap",
  variable: "--font-instrument-sans",
});

export const jetbrainsMono = localFont({
  src: "./fonts/JetBrainsMono-Variable.woff2",
  weight: "400 500",
  display: "swap",
  variable: "--font-jetbrains-mono",
});
