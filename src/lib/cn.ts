/**
 * Joins conditional class names into one string. Deliberately not
 * `tailwind-merge`: nothing in `src/components/ui` needs Tailwind conflict
 * resolution (each primitive composes its own fixed class list plus an
 * optional caller `className`, never two conflicting values for the same
 * property), and adding a dependency for string-joining is not warranted.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter((value): value is string => Boolean(value)).join(" ");
}
