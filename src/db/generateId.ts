/**
 * Generate a unique ID for database records.
 *
 * Single source of truth — do not redefine this elsewhere. Both the public
 * `src/db` barrel and the Dexie implementation re-export from here so
 * neither has to import the other and risk a circular dependency.
 */
export function generateId(): string {
  return crypto.randomUUID()
}
