import { tryCatch } from '../tryCatch'
import { unsafeMake, type Context } from './context'
import type { ErasedLayer, Layer } from './layer'
import { makeScope, type Scope } from './scope'
import type { Reference, Tag } from './tag'

export type Runtime<Services = never> = {
  readonly context: Context<Services>
  /** A Reference is readable from any context — it carries its own default. */
  get<S>(tag: Reference<S>): S
  /** A plain Tag must have been provided; an unprovided tag is a compile error. */
  get<S extends Services>(tag: Tag<S>): S
  dispose(): void
}

function buildAll(layers: ReadonlyArray<ErasedLayer>, scope: Scope): ReadonlyMap<string, unknown> {
  const services = new Map<string, unknown>()
  const memo = new Map<ErasedLayer, unknown>()

  for (const layer of layers) {
    const reuse = !layer.isFresh && memo.has(layer)
    // unsafeMake snapshots `services`, so each layer's context is frozen as of its own build.
    const built = reuse ? memo.get(layer) : layer.buildErased(unsafeMake(services), scope)
    if (!layer.isFresh) memo.set(layer, built)
    services.set(layer.key, built)
  }

  return services
}

function runtimeOf<Services>(context: Context<Services>, scope: Scope): Runtime<Services> {
  return {
    context,
    // Mirrors `contextOf`'s own `get: unsafeGet` idiom (context.ts) — the
    // overloaded `Runtime['get']` type is satisfied by `context.unsafeGet`'s
    // single erased signature without a cast.
    get: context.unsafeGet,
    dispose(): void {
      scope.close()
    },
  }
}

/** Compose any number of layers, recovering the service union from the element
 *  type so `context` is typed per-layer. Vue's `inject()` erases it again;
 *  `src/lib/di/vue.ts` is where the union is re-asserted. */
type ServiceOf<L> = L extends Layer<infer S> ? S : never

export function makeRuntime<L extends ErasedLayer>(
  layers: ReadonlyArray<L>,
): Runtime<ServiceOf<L>> {
  const scope = makeScope()
  const [error, services] = tryCatch(() => buildAll(layers, scope))
  if (error !== null) {
    // A partial build hands back no runtime to dispose, so release what earlier
    // layers acquired; wrapping close() stops a finalizer masking `error`.
    tryCatch(() => scope.close())
    throw error
  }
  return runtimeOf(unsafeMake<ServiceOf<L>>(services), scope)
}
