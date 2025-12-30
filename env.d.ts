/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/vue" />

interface ImportMetaEnvironment {
  readonly APP_VERSION: string
  readonly APP_TAG: string | null
  readonly APP_COMMIT: string
  readonly APP_BUILD_TIME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnvironment
}
