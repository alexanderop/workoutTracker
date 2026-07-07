import { createApp } from 'vue'

import { setRepositoryProvider } from '@/db/provider'
import { createDexieRepositoryProvider } from '@/db/implementations/dexie'
import App from './App.vue'
import { i18n } from './i18n'
import { renderMountFailure } from './lib/mountRecovery'
import { tryCatch } from './lib/tryCatch'
import { reportWebVitals } from './lib/webVitals'
import { router } from './router'
import './style.css'

// Select the active persistence backend (single seam for swapping adapters)
setRepositoryProvider(createDexieRepositoryProvider())

const app = createApp(App)

// Surface runtime errors that would otherwise fail silently — see brain UX
// review M3: an intermittent blank #app with no console output at all.
app.config.errorHandler = (error, _instance, info) => {
  console.error('[Vue error]', error, info)
}

app.use(i18n)
app.use(router)

function boot(): void {
  const [mountError] = tryCatch(() => app.mount('#app'))

  if (mountError) {
    // Same failure mode as M3: mounting threw with no visible feedback.
    // Fall back to a plain-DOM recovery UI so the user isn't staring at a
    // blank screen.
    renderMountFailure(document.body, mountError)
    return
  }

  void reportWebVitals()
}

boot()
