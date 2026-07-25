declare const Service: unique symbol

/** Service identity carrying a compile-time service type. */
export type Tag<S> = {
  readonly key: string
  readonly [Service]?: (_: S) => S
}

/** A Tag that carries its own default, readable from ANY context (D7 layer 2). */
export type Reference<S> = Tag<S> & { readonly defaultValue: () => S }

export function Tag<S>(key: string): Tag<S> {
  return { key }
}

export function Reference<S>(key: string, defaultValue: () => S): Reference<S> {
  return { key, defaultValue }
}

/** True when `tag` is a Reference — carries its own default value. */
export function isReference<S>(tag: Tag<S>): tag is Reference<S> {
  return 'defaultValue' in tag
}
