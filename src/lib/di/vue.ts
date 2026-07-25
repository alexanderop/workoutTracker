import type { App, InjectionKey } from 'vue'
import { inject } from 'vue'
import type { Context } from './context'
import type { Runtime } from './runtime'

// D7 Limits: services resolved via Vue `inject()` cannot carry the `Services`
// union, so the one unsound assertion is made here rather than per call site.
// Own copy of context.ts's `unsafeCoerce` hatch, kept private to that module.
function unsafeCoerce<S>(value: unknown): S
function unsafeCoerce(value: unknown): unknown {
  return value
}

const RuntimeContext: InjectionKey<Context> = Symbol('di/RuntimeContext')

export function provideRuntime(runtime: Runtime, app: App): void {
  app.provide(RuntimeContext, runtime.context)
}

export function useRuntimeContext<S = never>(): Context<S> {
  const context = inject(RuntimeContext)
  if (context === undefined) throw new Error('No runtime provided; call provideRuntime() first')
  return unsafeCoerce<Context<S>>(context)
}
