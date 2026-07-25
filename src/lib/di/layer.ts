import type { Context } from './context'
import type { Scope } from './scope'
import type { Tag } from './tag'

/** A Layer with its service type erased, so heterogeneous layer arrays are
 *  possible despite `Tag<S>`'s invariant phantom. */
export type ErasedLayer = {
  readonly key: string
  readonly isFresh: boolean
  buildErased(ctx: Context, scope: Scope): unknown
}

export type Layer<S> = ErasedLayer & {
  readonly tag: Tag<S>
  build(ctx: Context, scope: Scope): S
}

function layerOf<S>(
  tag: Tag<S>,
  isFresh: boolean,
  build: (ctx: Context, scope: Scope) => S,
): Layer<S> {
  return { key: tag.key, tag, isFresh, build, buildErased: build }
}

export function succeed<S>(tag: Tag<S>, impl: S): Layer<S> {
  return layerOf(tag, false, () => impl)
}

export function sync<S>(tag: Tag<S>, f: (ctx: Context) => S): Layer<S> {
  return layerOf(tag, false, (ctx) => f(ctx))
}

export function scoped<S>(
  tag: Tag<S>,
  acquire: (ctx: Context) => S,
  release: (service: S) => void,
): Layer<S> {
  return layerOf(tag, false, (ctx, scope) => {
    const service = acquire(ctx)
    scope.addFinalizer(() => release(service))
    return service
  })
}

/** Opt this layer out of per-build memoization. Returns a new layer; does not
 *  mutate the input. */
export function fresh<S>(layer: Layer<S>): Layer<S> {
  return layerOf(layer.tag, true, layer.build)
}
