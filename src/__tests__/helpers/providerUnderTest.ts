import { setRepositoryProvider } from '@/db/provider'
import { createDexieRepositoryProvider } from '@/db/implementations/dexie'

/** The adapter being certified by the integration suite.
 *  A future adapter (e.g. Jazz) is certified by swapping this factory. */
export function installProviderUnderTest(): void {
  setRepositoryProvider(createDexieRepositoryProvider())
}
