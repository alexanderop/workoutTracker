import { expectTypeOf } from 'vitest'
import { succeed } from '@/lib/di/layer'
import { makeRuntime } from '@/lib/di/runtime'
import { Reference, Tag } from '@/lib/di/tag'

const countTag = Tag<number>('count')
const nameTag = Tag<string>('name')

const twoLayerRuntime = makeRuntime([succeed(countTag, 7), succeed(nameTag, 'x')])
expectTypeOf(twoLayerRuntime.context.get(countTag)).toEqualTypeOf<number>()
expectTypeOf(twoLayerRuntime.context.get(nameTag)).toEqualTypeOf<string>()

// @ts-expect-error nameTag was never provided to this runtime
const missing: string = makeRuntime([succeed(countTag, 7)]).context.get(nameTag)
void missing

// runtime.get carries the same Services union as runtime.context.get: a
// provided tag resolves to its own type through the typed front door.
expectTypeOf(twoLayerRuntime.get(countTag)).toEqualTypeOf<number>()

// @ts-expect-error nameTag was never provided to this runtime, so runtime.get
// must reject it exactly like runtime.context.get does
const missingViaGet: string = makeRuntime([succeed(countTag, 7)]).get(nameTag)
void missingViaGet

// A Reference is readable from any runtime, even one that never provided it --
// this is the erased-context case the kernel must keep serving through
// runtime.get.
const flagRef = Reference<boolean>('flag', () => false)
expectTypeOf(makeRuntime([succeed(countTag, 7)]).get(flagRef)).toEqualTypeOf<boolean>()
