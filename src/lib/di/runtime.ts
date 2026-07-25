import { tryCatch } from '../tryCatch'
import { empty, make, unsafeMake, type Context } from './context'
import type { ErasedLayer, Layer } from './layer'
import { makeScope, type Scope } from './scope'
import type { Tag } from './tag'

export type Runtime<Services = never> = {
  readonly context: Context<Services>
  get<S>(tag: Tag<S>): S
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
    get<S>(tag: Tag<S>): S {
      return context.unsafeGet(tag)
    },
    dispose(): void {
      scope.close()
    },
  }
}

/** Compose any number of layers, recovering the service union via tuple
 *  inference so `context` is typed per-layer. Vue's `inject()` erases it
 *  again; `src/lib/di/vue.ts` is where the union is re-asserted. */
type ServiceOf<L> = L extends Layer<infer S> ? S : never

export function makeRuntime<Layers extends ReadonlyArray<ErasedLayer>>(
  layers: readonly [...Layers],
): Runtime<ServiceOf<Layers[number]>> {
  const scope = makeScope()
  const [error, services] = tryCatch(() => buildAll(layers, scope))
  if (error !== null) {
    // A partial build hands back no runtime to dispose, so release what earlier
    // layers acquired; wrapping close() stops a finalizer masking `error`.
    tryCatch(() => scope.close())
    throw error
  }
  return runtimeOf(unsafeMake<ServiceOf<Layers[number]>>(services), scope)
}

/** Single-layer build that keeps the service in the context type — the typed
 *  path D7 layer 1 protects. This is what the habits pilot uses. */
export function makeRuntimeOf<S>(layer: Layer<S>): Runtime<S> {
  const scope = makeScope()
  const service = layer.build(empty(), scope)
  return runtimeOf(make(layer.tag, service), scope)
}
