import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import type { Plugin } from 'vite'

interface VersionInfo {
  version: string
  tag: string | null
  commit: string
  buildTime: string
}

function hasStringVersion(value: unknown): value is { version: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'version' in value &&
    typeof value.version === 'string'
  )
}

function readPackageVersion(): string {
  const parsed: unknown = JSON.parse(readFileSync('package.json', 'utf8'))
  if (!hasStringVersion(parsed)) {
    throw new Error('versionPlugin: package.json "version" is missing or not a string')
  }
  return parsed.version
}

function getGitInfo(): { tag: string | null; commit: string } {
  try {
    const commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()

    let tag: string | null = null
    try {
      tag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim()
    } catch {
      // No tags in repo - this is fine
    }

    return { tag, commit }
  } catch {
    // Git not available or not a repo
    return { tag: null, commit: 'unknown' }
  }
}

export function versionPlugin(): Plugin {
  return {
    name: 'version-plugin',

    config() {
      const gitInfo = getGitInfo()

      const versionInfo: VersionInfo = {
        version: readPackageVersion(),
        tag: gitInfo.tag,
        commit: gitInfo.commit,
        buildTime: new Date().toISOString(),
      }

      // Inject env variables for runtime access. This build-time metadata is
      // what the app displays in Settings; new deploys are detected and applied
      // automatically by the service worker (see usePwaUpdate), not by fetching
      // a version file, so no version.json is emitted or served.
      return {
        define: {
          'import.meta.env.APP_VERSION': JSON.stringify(versionInfo.version),
          'import.meta.env.APP_TAG': JSON.stringify(versionInfo.tag),
          'import.meta.env.APP_COMMIT': JSON.stringify(versionInfo.commit),
          'import.meta.env.APP_BUILD_TIME': JSON.stringify(versionInfo.buildTime),
        },
      }
    },
  }
}
