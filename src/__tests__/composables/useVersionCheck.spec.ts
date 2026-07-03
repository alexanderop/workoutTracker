import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useVersionCheck } from '@/composables/useVersionCheck'

const SERVER_VERSION = {
  version: '9.9.9',
  tag: 'v9.9.9',
  commit: 'deadbeef',
  buildTime: '2026-01-01T00:00:00Z',
}

function stubFetchResponse(body: unknown, status = 200): void {
  // A fresh Response per call — the body stream can only be read once
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(() => Promise.resolve(Response.json(body, { status }))),
  )
}

type VersionCheck = ReturnType<typeof useVersionCheck>

// useVersionCheck fires an immediate check on init; wait for it before driving
// checkVersion manually, or the re-entry guard swallows the call.
async function startPausedVersionCheck(): Promise<VersionCheck> {
  const check = useVersionCheck()
  check.pauseChecking()
  await expect.poll(() => check.isChecking.value).toBe(false)
  return check
}

describe('useVersionCheck', () => {
  beforeEach(() => {
    stubFetchResponse(SERVER_VERSION)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('stores the server version and flags a new deployment', async () => {
    const check = await startPausedVersionCheck()

    await check.checkVersion()

    expect(check.error.value).toBeNull()
    expect(check.serverVersion.value).toEqual(SERVER_VERSION)
    expect(check.isNewVersion.value).toBe(SERVER_VERSION.commit !== check.currentVersion.commit)
    expect(check.isChecking.value).toBe(false)
  })

  it('accepts a null tag in the version payload', async () => {
    stubFetchResponse({ ...SERVER_VERSION, tag: null })
    const check = await startPausedVersionCheck()

    await check.checkVersion()

    expect(check.error.value).toBeNull()
    expect(check.serverVersion.value?.tag).toBeNull()
  })

  it('sets an error when the fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const check = await startPausedVersionCheck()

    await check.checkVersion()

    expect(check.error.value?.message).toBe('offline')
    expect(check.isChecking.value).toBe(false)
  })

  it('sets an error for a non-ok response', async () => {
    stubFetchResponse({}, 500)
    const check = await startPausedVersionCheck()

    await check.checkVersion()

    expect(check.error.value?.message).toContain('500')
  })

  it('sets an error when the response body is not valid JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => Promise.resolve(new Response('not json', { status: 200 }))),
    )
    const check = await startPausedVersionCheck()

    await check.checkVersion()

    expect(check.error.value).not.toBeNull()
  })

  it('rejects payloads that do not match the version info shape', async () => {
    stubFetchResponse({ version: '1.0.0', commit: 42 })
    const check = await startPausedVersionCheck()

    await check.checkVersion()

    expect(check.error.value?.message).toBe('Invalid version info format')
  })
})
