import type { VersionInfo } from './version'

/**
 * Build-time version metadata, baked in by `versionPlugin`. Purely
 * informational — shown in Settings so the user can see which build they're
 * on. Detecting and applying new deploys is handled automatically by the
 * service worker (see `usePwaUpdate`), not by comparing this value.
 */
export const currentVersion: VersionInfo = {
  version: import.meta.env.APP_VERSION,
  tag: import.meta.env.APP_TAG,
  commit: import.meta.env.APP_COMMIT,
  buildTime: import.meta.env.APP_BUILD_TIME,
}
