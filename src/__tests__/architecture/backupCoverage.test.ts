/**
 * Fitness function: every table in the Dexie schema is deliberately either
 * included in export/import backups or excluded with a stated reason.
 *
 * Ideals 5 (The Long Now) and 7 (Ownership & control) say a user's data must
 * outlive the app and stay theirs, which makes "what a backup contains" an
 * architectural characteristic, not a feature detail.
 *
 * The failure mode this exists to close is silent omission by list drift.
 * `dataManagement.ts` derives its full-wipe scope from `database.tables`
 * precisely because a hand-maintained wipe list once missed the
 * progressions/progressionSessions tables added in schema version 5 — caught
 * by a UX review, not by CI. `backupTables` and `ExportDataContents` are
 * still hand-maintained and carry that same failure mode.
 *
 * Three layers, deliberately at different times:
 *
 *   1. Compile time (`pnpm type-check`, every commit) — `BACKUP_POLICY` is
 *      keyed by the schema's table names, so a new table is a type error
 *      until it is classified. `assertSameKeys` then pins `ExportDataContents`
 *      to exactly the tables marked `backed-up`, so the policy cannot claim
 *      coverage the export contract does not provide.
 *   2. This test (Node `arch` tier, CI) — the declared `Table` properties are
 *      what the type layer reasons about; `.stores()` is what actually
 *      creates tables. A store added without a matching class property would
 *      be invisible to layer 1, so compare the policy against the live
 *      schema.
 *   3. `db/backupRoundTrip.spec.ts` (browser tier, CI) — the contract having
 *      a key proves nothing about rows surviving export -> deleteAll ->
 *      import. That needs IndexedDB and lives with the other db specs.
 *
 * Constructing `WorkoutTrackerDb` needs no `indexedDB` global: Dexie only
 * reaches for it on `open()`, and `db.tables` is populated by the `.version()`
 * declarations alone. Verified in this Node tier, not assumed.
 */
import type { Table } from 'dexie'
import { describe, expect, it } from 'vitest'
import { WorkoutTrackerDb } from '@/db/implementations/dexie/database'
import type { ExportDataContents } from '@/db/interfaces'

type TableProperties<T> = {
  [K in keyof T]-?: T[K] extends Table ? K : never
}[keyof T]

type SchemaTable = TableProperties<WorkoutTrackerDb> & string

/** Excluded tables carry the reason inline, so the omission stays a decision. */
type BackupClassification = 'backed-up' | { readonly excluded: string }

/**
 * `as const satisfies` rather than a type annotation: `satisfies` enforces
 * exhaustiveness over `SchemaTable`, while `as const` keeps the literal types
 * that `BackedUpTable` below needs to read back out.
 */
const BACKUP_POLICY = {
  settings: 'backed-up',
  customExercises: 'backed-up',
  templates: 'backed-up',
  workouts: 'backed-up',
  benchmarks: 'backed-up',
  weightEntries: 'backed-up',
  habits: 'backed-up',
  habitEntries: 'backed-up',
  nutritionGoals: 'backed-up',
  foods: 'backed-up',
  nutritionDiaryEntries: 'backed-up',
  progressions: 'backed-up',
  progressionSessions: 'backed-up',
  activeWorkout: { excluded: 'In-flight session state, not history worth restoring.' },
  activeBenchmark: { excluded: 'In-flight session state, not history worth restoring.' },
  drafts: { excluded: 'Unsubmitted form scratch, discarded on submit.' },
  onboarding: { excluded: 'Install-local flag; a restore should not replay onboarding.' },
} as const satisfies Record<SchemaTable, BackupClassification>

type BackedUpTable = {
  [K in keyof typeof BACKUP_POLICY]: (typeof BACKUP_POLICY)[K] extends 'backed-up' ? K : never
}[keyof typeof BACKUP_POLICY]

type MissingFromExport = Exclude<BackedUpTable, keyof ExportDataContents>
type NotMarkedBackedUp = Exclude<keyof ExportDataContents, BackedUpTable>

/**
 * Compile-time half, checked by `pnpm type-check` before any test runs. Both
 * differences must be empty; when one is not, the guard resolves to a
 * template-literal union naming each offending table, so the compiler error
 * states the drift outright instead of a bare `not assignable to 'never'`.
 */
type NoDrift<Difference extends string, Complaint extends string> = [Difference] extends [never]
  ? true
  : `${Complaint}: ${Difference}`

const everyBackedUpTableIsExported: NoDrift<
  MissingFromExport,
  'marked backed-up but absent from ExportDataContents'
> = true

const everyExportKeyIsMarkedBackedUp: NoDrift<
  NotMarkedBackedUp,
  'in ExportDataContents but not marked backed-up'
> = true

describe('backup coverage', () => {
  const schemaTables = new WorkoutTrackerDb().tables.map((table) => table.name)

  it('classifies every table the live schema actually creates', () => {
    expect(schemaTables.toSorted()).toEqual(Object.keys(BACKUP_POLICY).toSorted())
  })

  it('states a reason for every table left out of backups', () => {
    const unjustified = Object.entries(BACKUP_POLICY).filter(
      ([, classification]) =>
        classification !== 'backed-up' && classification.excluded.trim().length === 0,
    )
    expect(unjustified).toEqual([])
  })

  it('pins the export contract to the tables marked backed-up', () => {
    expect(everyBackedUpTableIsExported).toBe(true)
    expect(everyExportKeyIsMarkedBackedUp).toBe(true)
  })
})
