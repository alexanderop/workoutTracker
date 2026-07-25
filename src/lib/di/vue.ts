import type { App, InjectionKey } from 'vue'
import { inject } from 'vue'
import type { Context } from './context'
import type { Runtime } from './runtime'

// D7 Limits: services resolved via Vue `inject()` cannot carry the `Services`
// union, so the one unsound assertion is made here rather than per call site.
const RuntimeContext: InjectionKey<Context> = Symbol('di/RuntimeContext')

function widen<S>(context: Context): Context<S>
function widen(context: Context): unknown {
  return context
}

export function provideRuntime<S>(runtime: Runtime<S>, app: App): void {
  app.provide(RuntimeContext, runtime.context)
}

export function useRuntimeContext<S = never>(): Context<S> {
  const context = inject(RuntimeContext)
  if (context === undefined) throw new Error('No runtime provided; call provideRuntime() first')
  return widen<S>(context)
}
