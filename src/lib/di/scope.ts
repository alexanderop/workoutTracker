import { tryCatch } from '../tryCatch'

/** A finalizer list closed on runtime.dispose(). */
export type Scope = {
  addFinalizer(f: () => void): void
  close(): void
}

export function makeScope(): Scope {
  const finalizers: Array<() => void> = []
  let closed = false

  return {
    // Mirrors Effect: adding to an already-closed scope runs immediately.
    addFinalizer(f: () => void): void {
      if (closed) {
        f()
        return
      }
      finalizers.push(f)
    },
    close(): void {
      if (closed) return
      closed = true
      const toRun = finalizers.toReversed()
      finalizers.length = 0
      const failures = toRun
        .map((finalize) => tryCatch(finalize)[0])
        .filter((error): error is Error => error !== null)
      if (failures.length > 0) throw new AggregateError(failures, 'Scope finalizers failed')
    },
  }
}
