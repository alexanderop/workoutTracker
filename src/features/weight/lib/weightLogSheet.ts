import type { DbWeightEntry } from '@/db/schema'

/**
 * The most recent entry for a start-of-day timestamp, or undefined.
 *
 * Total order: highest `recordedAt` first, tie-broken on descending `id`,
 * so two entries stamped in the same millisecond still resolve
 * deterministically (see brain/lessons on comparator total order).
 */
export function findEntryForDay(
  entries: ReadonlyArray<DbWeightEntry>,
  day: number,
): DbWeightEntry | undefined {
  return entries
    .filter((entry) => entry.date === day)
    .reduce<DbWeightEntry | undefined>((best, candidate) => {
      if (!best) return candidate
      if (candidate.recordedAt !== best.recordedAt) {
        return candidate.recordedAt > best.recordedAt ? candidate : best
      }
      return candidate.id > best.id ? candidate : best
    }, undefined)
}
