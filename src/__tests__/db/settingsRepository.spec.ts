import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getSettingsRepository } from '@/db'
import { resetDatabase } from '../helpers/resetDatabase'

describe('settings repository', () => {
  beforeEach(resetDatabase)
  afterEach(resetDatabase)

  it('returns defaults for unset keys', async () => {
    const repo = getSettingsRepository()

    await expect(repo.get('theme')).resolves.toBe('system')
    await expect(repo.get('defaultRestTimer')).resolves.toBe(90)
    await expect(repo.get('weightUnit')).resolves.toBe('kg')
    await expect(repo.get('screenWakeLock')).resolves.toBe(true)
    await expect(repo.get('language')).resolves.toBeUndefined()
  })

  it('persists and returns stored settings', async () => {
    const repo = getSettingsRepository()

    await repo.set({ key: 'theme', value: 'dark' })
    await repo.set({ key: 'defaultRestTimer', value: 120 })

    await expect(repo.get('theme')).resolves.toBe('dark')
    await expect(repo.get('defaultRestTimer')).resolves.toBe(120)
  })

  it('merges stored settings over defaults in getAll', async () => {
    const repo = getSettingsRepository()

    await repo.set({ key: 'weightUnit', value: 'lbs' })
    await repo.set({ key: 'heightUnit', value: 'ft-in' })
    await repo.set({ key: 'autoSaveInterval', value: 500 })
    await repo.set({ key: 'screenWakeLock', value: false })
    await repo.set({ key: 'timerSoundEnabled', value: false })
    await repo.set({ key: 'timerSoundVolume', value: 0.5 })
    await repo.set({ key: 'language', value: 'de' })
    await repo.set({ key: 'theme', value: 'light' })

    await expect(repo.getAll()).resolves.toEqual({
      theme: 'light',
      defaultRestTimer: 90,
      weightUnit: 'lbs',
      heightUnit: 'ft-in',
      autoSaveInterval: 500,
      screenWakeLock: false,
      timerSoundEnabled: false,
      timerSoundVolume: 0.5,
      language: 'de',
    })
  })

  it('resets a single key back to its default', async () => {
    const repo = getSettingsRepository()
    await repo.set({ key: 'theme', value: 'dark' })

    await repo.reset('theme')

    await expect(repo.get('theme')).resolves.toBe('system')
  })

  it('resets all keys back to defaults', async () => {
    const repo = getSettingsRepository()
    await repo.set({ key: 'theme', value: 'dark' })
    await repo.set({ key: 'weightUnit', value: 'lbs' })

    await repo.resetAll()

    await expect(repo.getAll()).resolves.toMatchObject({
      theme: 'system',
      weightUnit: 'kg',
    })
  })
})
