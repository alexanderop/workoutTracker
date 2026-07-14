/**
 * The Codec Registry: the single runtime dispatch for per-kind block
 * conversion (ADR 002). The mapped registry type enforces at compile time
 * that every kind is present and wired to a codec of that same kind.
 */

import { z } from 'zod'
import type {
  BlockByKind,
  BlockCodec,
  BlockKind,
  BlockMeta,
  DbBlockByKind,
  DbWorkoutBlock,
  WorkoutBlock,
} from './types'
import {
  dbStrengthBlockSchema,
  dbTemplateStrengthBlockSchema,
  strengthCodec,
} from './strength/codec'
import { amrapCodec, dbAmrapBlockSchema, dbTemplateAmrapBlockSchema } from './amrap/codec'
import { dbEmomBlockSchema, dbTemplateEmomBlockSchema, emomCodec } from './emom/codec'
import { dbTabataBlockSchema, dbTemplateTabataBlockSchema, tabataCodec } from './tabata/codec'
import { dbForTimeBlockSchema, dbTemplateForTimeBlockSchema, fortimeCodec } from './fortime/codec'
import { cardioCodec, dbCardioBlockSchema, dbTemplateCardioBlockSchema } from './cardio/codec'
import { strengthMeta } from './strength/meta'
import { amrapMeta } from './amrap/meta'
import { emomMeta } from './emom/meta'
import { tabataMeta } from './tabata/meta'
import { fortimeMeta } from './fortime/meta'
import { cardioMeta } from './cardio/meta'

type BlockCodecRegistry = {
  [K in BlockKind]: BlockCodec<K>
}

export const BLOCK_CODECS: BlockCodecRegistry = {
  strength: strengthCodec,
  amrap: amrapCodec,
  emom: emomCodec,
  tabata: tabataCodec,
  fortime: fortimeCodec,
  cardio: cardioCodec,
}

/**
 * Per-kind display metadata, exhaustive over BlockKind like BLOCK_CODECS.
 * Kept as a separate registry entry — display is not representation (ADR 002).
 */
export const BLOCK_META: { [K in BlockKind]: BlockMeta } = {
  strength: strengthMeta,
  amrap: amrapMeta,
  emom: emomMeta,
  tabata: tabataMeta,
  fortime: fortimeMeta,
  cardio: cardioMeta,
}

type SchemaKinds<Schema extends z.ZodTypeAny> =
  z.infer<Schema> extends { kind: infer K } ? K : never

/** Resolves to `unknown` when the union schema covers every BlockKind. */
type KindsCheck<Schema extends z.ZodTypeAny> =
  Exclude<BlockKind, SchemaKinds<Schema>> extends never
    ? unknown
    : { missingKinds: Exclude<BlockKind, SchemaKinds<Schema>> }

/**
 * Compile-time completeness for the hand-listed zod unions below: the mapped
 * registries above fail on a missing kind automatically, but a discriminated
 * union with a kind omitted is still a valid (smaller) union and would only
 * fail at import-validation runtime. Identity at runtime, same idiom as
 * `schemaFor`.
 */
function coversAllBlockKinds<Schema extends z.ZodTypeAny>(
  schema: Schema & KindsCheck<Schema>,
): Schema {
  return schema
}

/**
 * DbWorkoutBlock discriminated union schema for import validation.
 * Built from the per-codec schemas so the union and the dispatch cannot drift.
 */
export const dbWorkoutBlockSchema = coversAllBlockKinds(
  z.discriminatedUnion('kind', [
    dbStrengthBlockSchema,
    dbEmomBlockSchema,
    dbAmrapBlockSchema,
    dbTabataBlockSchema,
    dbForTimeBlockSchema,
    dbCardioBlockSchema,
  ]),
)

/**
 * DbTemplateBlock discriminated union schema for import validation.
 * Mirrors `dbWorkoutBlockSchema`, built from the per-codec template schemas.
 */
export const dbTemplateBlockSchema = coversAllBlockKinds(
  z.discriminatedUnion('kind', [
    dbTemplateStrengthBlockSchema,
    dbTemplateEmomBlockSchema,
    dbTemplateAmrapBlockSchema,
    dbTemplateTabataBlockSchema,
    dbTemplateForTimeBlockSchema,
    dbTemplateCardioBlockSchema,
  ]),
)

/**
 * Convert in-memory block to database format.
 * Generic over the kind so TypeScript correlates the registry lookup with the
 * block argument (indexed-access dispatch), keeping this cast-free.
 */
export function blockToDatabase<K extends BlockKind>(
  block: Readonly<BlockByKind[K]>,
  orderIndex: number,
): DbWorkoutBlock {
  const kind: K = block.kind
  return BLOCK_CODECS[kind].toDb(block, orderIndex)
}

/**
 * Convert database block to in-memory format.
 * Same generic indexed-access dispatch as `blockToDatabase`.
 */
export function databaseToBlock<K extends BlockKind>(
  databaseBlock: Readonly<DbBlockByKind[K]>,
  index: number,
): WorkoutBlock {
  const kind: K = databaseBlock.kind
  return BLOCK_CODECS[kind].fromDb(databaseBlock, index)
}
