/**
 * Utilities for building partial update objects for Dexie.
 *
 * Dexie's `table.update()` only modifies keys present in the update object.
 * These helpers ensure we only include keys the caller intended to update,
 * while properly converting domain types (undefined) to database types (null).
 */

/**
 * Build a partial update object for Dexie from domain updates.
 *
 * Only includes keys that are explicitly present in the source object.
 * For nullable fields, converts domain `undefined` to database `null`.
 *
 * @param updates - The partial updates from the domain layer
 * @param nullableFields - Array of field names that are nullable in the DB schema
 * @returns An object containing only the keys that should be updated
 *
 * @example
 * // Only name is in the result, equipment is not included
 * buildPartialUpdate({ name: 'Squat' }, ['equipment', 'muscle', 'image'])
 * // => { name: 'Squat' }
 *
 * @example
 * // equipment is included and converted to null
 * buildPartialUpdate({ name: 'Squat', equipment: undefined }, ['equipment', 'muscle', 'image'])
 * // => { name: 'Squat', equipment: null }
 */
export function buildPartialUpdate(
  updates: Record<string, unknown>,
  nullableFields: ReadonlyArray<string>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const key of Object.keys(updates)) {
    const value = updates[key]
    const isNullable = nullableFields.includes(key)

    // For nullable fields: always include, converting undefined to null
    // For required fields: only include if value is defined
    const shouldInclude = isNullable || value !== undefined
    if (!shouldInclude) continue

    result[key] = isNullable ? (value ?? null) : value
  }

  return result
}
