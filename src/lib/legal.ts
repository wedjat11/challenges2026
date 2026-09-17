export const SITE_NAME = "LoL Challenges";

/**
 * Required by Riot's developer policy and asserted by specs, so a careless edit
 * fails the build rather than quietly breaking the production key application.
 */
export const RIOT_DISCLAIMER = `${SITE_NAME} isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games and all associated properties are trademarks or registered trademarks of Riot Games, Inc.`;

/**
 * Details only the operator can supply. Left as loud placeholders rather than
 * invented: Riot reads these pages before granting a production key, and a
 * privacy policy naming an address nobody answers is worse than none at all.
 *
 * TODO(owner): replace every value containing "TO BE COMPLETED" before launch.
 */
export const OPERATOR = {
  /** Person or company responsible for the service. */
  name: "TO BE COMPLETED — operator name",
  /** Reachable address for privacy requests. Must be monitored. */
  contactEmail: "TO BE COMPLETED — contact email",
  /** Whose law governs the terms, e.g. "Mexico". */
  jurisdiction: "TO BE COMPLETED — jurisdiction",
} as const;

export type OperatorField = keyof typeof OPERATOR;

export const LAST_UPDATED = "2026-09-16";

/** Which operator details are still unset. Empty means the pages are launch-ready. */
export function unresolvedPlaceholders(
  operator: Record<OperatorField, string> = OPERATOR,
): OperatorField[] {
  return (Object.keys(operator) as OperatorField[]).filter((field) =>
    operator[field].includes("TO BE COMPLETED"),
  );
}
