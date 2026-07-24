import { inject, type InjectionKey } from 'vue'

export type ReloadPage = () => void

export const reloadPageKey: InjectionKey<ReloadPage> = Symbol('reloadPage')

/** Reload the application after destructive data replacement. */
function reloadPage(): void {
  globalThis.location.reload()
}

/** Resolve the reload boundary, allowing host apps and tests to replace navigation. */
export function useReloadPage(): ReloadPage {
  return inject(reloadPageKey, reloadPage)
}
