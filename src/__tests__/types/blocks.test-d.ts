import { expectTypeOf } from 'vitest'
import type { BlockByKind, BlockKind, TimedBlock, TimedBlockKind, WorkoutBlock } from '@/blocks'

expectTypeOf<WorkoutBlock['kind']>().toEqualTypeOf<BlockKind>()
expectTypeOf<TimedBlock['kind']>().toEqualTypeOf<TimedBlockKind>()
expectTypeOf<BlockByKind['strength']['kind']>().toEqualTypeOf<'strength'>()
expectTypeOf<BlockByKind['amrap']['kind']>().toEqualTypeOf<'amrap'>()
expectTypeOf<BlockByKind['emom']['kind']>().toEqualTypeOf<'emom'>()
expectTypeOf<BlockByKind['tabata']['kind']>().toEqualTypeOf<'tabata'>()
expectTypeOf<BlockByKind['fortime']['kind']>().toEqualTypeOf<'fortime'>()
expectTypeOf<BlockByKind['cardio']['kind']>().toEqualTypeOf<'cardio'>()

// @ts-expect-error 'yoga' is not a valid workout block kind
const invalidKind: BlockKind = 'yoga'
void invalidKind
