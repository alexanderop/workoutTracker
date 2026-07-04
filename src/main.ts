import { createApp } from 'vue'

import { setRepositoryProvider } from '@/db/provider'
import { createDexieRepositoryProvider } from '@/db/implementations/dexie'
import App from './App.vue'
import { setupOnboardingGuard } from './features/onboarding/setupOnboardingGuard'
import { i18n } from './i18n'
import { reportWebVitals } from './lib/webVitals'
import { router } from './router'
import './style.css'

// Select the active persistence backend (single seam for swapping adapters)
setRepositoryProvider(createDexieRepositoryProvider())

// Setup feature guards
setupOnboardingGuard(router)

const app = createApp(App)

app.use(i18n)
app.use(router)

app.mount('#app')

void reportWebVitals()
