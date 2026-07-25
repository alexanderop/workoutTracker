import { expectTypeOf } from 'vitest'
import { succeed } from '@/lib/di/layer'
import { makeRuntime } from '@/lib/di/runtime'
import { Tag } from '@/lib/di/tag'

const countTag = Tag<number>('count')
const nameTag = Tag<string>('name')

const twoLayerRuntime = makeRuntime([succeed(countTag, 7), succeed(nameTag, 'x')])
expectTypeOf(twoLayerRuntime.context.get(countTag)).toEqualTypeOf<number>()
expectTypeOf(twoLayerRuntime.context.get(nameTag)).toEqualTypeOf<string>()

// @ts-expect-error nameTag was never provided to this runtime
const missing: string = makeRuntime([succeed(countTag, 7)]).context.get(nameTag)
void missing
