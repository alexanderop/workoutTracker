import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'

interface VersionInfo {
  version: string
  tag: string | null
  commit: string
  buildTime: string
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
  let versionInfo: VersionInfo
  let outDir = 'dist'

  return {
    name: 'version-plugin',

    config(config) {
      // Store outDir for later use
      outDir = config.build?.outDir ?? 'dist'

      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
      const gitInfo = getGitInfo()

      versionInfo = {
        version: packageJson.version,
        tag: gitInfo.tag,
        commit: gitInfo.commit,
        buildTime: new Date().toISOString(),
      }

      // Inject env variables for runtime access
      return {
        define: {
          'import.meta.env.APP_VERSION': JSON.stringify(versionInfo.version),
          'import.meta.env.APP_TAG': JSON.stringify(versionInfo.tag),
          'import.meta.env.APP_COMMIT': JSON.stringify(versionInfo.commit),
          'import.meta.env.APP_BUILD_TIME': JSON.stringify(versionInfo.buildTime),
        },
      }
    },

    // Serve version.json in dev mode
    configureServer(server) {
      server.middlewares.use('/version.json', (_request, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-cache')
        res.end(JSON.stringify(versionInfo))
      })
    },

    // Emit version.json during build
    closeBundle() {
      writeFileSync(resolve(outDir, 'version.json'), JSON.stringify(versionInfo, null, 2))
    },
  }
}
