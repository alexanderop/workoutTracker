import type { z } from 'zod'

/** Resolves to `unknown` when the schema's keys exactly match the Db type's. */
type KeysCheck<Schema extends z.ZodTypeAny, DbType> = [
  Exclude<keyof DbType, keyof z.infer<Schema>>,
  Exclude<keyof z.infer<Schema>, keyof DbType>,
] extends [never, never]
  ? unknown
  : {
      missingFromSchema: Exclude<keyof DbType, keyof z.infer<Schema>>
      unknownInSchema: Exclude<keyof z.infer<Schema>, keyof DbType>
    }

/**
 * Binds a `.strict()` schema to its Db type at compile time: a field added to
 * a Db block type without a matching schema update becomes a tsc error here
 * instead of the app's own export failing re-import at runtime (the
 * `splitTimes` incident class). Identity at runtime.
 */
export function schemaFor<DbType>() {
  return <Schema extends z.ZodTypeAny>(schema: Schema & KeysCheck<Schema, DbType>): Schema => schema
}
