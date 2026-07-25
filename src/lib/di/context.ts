import { isReference, type Reference, type Tag } from './tag'

declare const Provided: unique symbol

/** Immutable Tag -> implementation map. `Services` sits in a contravariant
 *  (function-parameter) position so `Context<Src>` is assignable to
 *  `Context<Tgt>` only when `Tgt` is assignable to `Src` — D7 layer 1. */
export type Context<Services = never> = {
  readonly [Provided]?: (_: Services) => void
  /** A Reference is readable from any context — it carries its own default. */
  get<S>(tag: Reference<S>): S
  /** A plain Tag must have been provided; an unprovided tag is a compile error. */
  get<S extends Services>(tag: Tag<S>): S
  /** Throws `Service not found: ${tag.key}` when absent and not a Reference. */
  unsafeGet<S>(tag: Tag<S>): S
  getOption<S>(tag: Tag<S>): S | undefined
  getOrElse<S, B>(tag: Tag<S>, orElse: () => B): S | B
  add<S>(tag: Tag<S>, impl: S): Context<Services | S>
}

type Resolution<S> = { found: true; value: S } | { found: false }

// Coerces an erased map value back to its statically-known service type at
// the single seam where that is unavoidable, without an `as` assertion: the
// generic overload is what callers see; the implementation signature below it
// only promises `unknown`, so the body needs no cast.
function unsafeCoerce<S>(value: unknown): S
function unsafeCoerce(value: unknown): unknown {
  return value
}

function resolve<S>(services: ReadonlyMap<string, unknown>, tag: Tag<S>): Resolution<S> {
  if (services.has(tag.key)) return { found: true, value: unsafeCoerce<S>(services.get(tag.key)) }
  return isReference(tag) ? { found: true, value: tag.defaultValue() } : { found: false }
}

function contextOf<Services>(services: ReadonlyMap<string, unknown>): Context<Services> {
  function getOption<S>(tag: Tag<S>): S | undefined {
    const result = resolve(services, tag)
    return result.found ? result.value : undefined
  }

  function unsafeGet<S>(tag: Tag<S>): S {
    const result = resolve(services, tag)
    if (result.found) return result.value
    throw new Error(`Service not found: ${tag.key}`)
  }

  return {
    // `get` is the type-checked front door over the same throwing resolution
    // as `unsafeGet` (D7 layers 1 and 3); `getOption`/`getOrElse` below are
    // the non-throwing variants.
    get: unsafeGet,
    getOption,
    unsafeGet,
    getOrElse<S, B>(tag: Tag<S>, orElse: () => B): S | B {
      const result = resolve(services, tag)
      return result.found ? result.value : orElse()
    },
    add<S>(tag: Tag<S>, impl: S): Context<Services | S> {
      const next = new Map(services)
      next.set(tag.key, impl)
      return contextOf(next)
    },
  }
}

export function empty(): Context {
  return contextOf(new Map())
}

export function make<S>(tag: Tag<S>, impl: S): Context<S> {
  return contextOf(new Map([[tag.key, impl]]))
}

/** Build a context from an already-erased key -> implementation map,
 *  snapshotting it so later mutations to the caller's map go unobserved.
 *  Used by runtime.ts; `Services` defaults to `never` when there is no tuple to infer it from. */
export function unsafeMake<Services = never>(
  services: ReadonlyMap<string, unknown>,
): Context<Services> {
  return contextOf(new Map(services))
}
