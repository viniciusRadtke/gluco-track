/**
 * Joins conditional class names, dropping falsy entries.
 *
 * Intentionally minimal: the project has no need for class conflict resolution
 * yet, so `clsx` and `tailwind-merge` would be dependencies without a job.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
