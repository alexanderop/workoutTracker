import { z } from 'zod'
import { HABIT_VIEW_MODES } from '@/db/schema'

/**
 * Theme setting schema.
 */
const themeSettingSchema = z
  .object({
    key: z.literal('theme'),
    value: z.enum(['light', 'dark', 'system']),
  })
  .strict()

/**
 * Default rest timer setting schema (in seconds).
 */
const defaultRestTimerSettingSchema = z
  .object({
    key: z.literal('defaultRestTimer'),
    value: z.number().int().min(0).max(3600), // max 1 hour
  })
  .strict()

/**
 * Weight unit setting schema.
 */
const weightUnitSettingSchema = z
  .object({
    key: z.literal('weightUnit'),
    value: z.enum(['kg', 'lbs']),
  })
  .strict()

/**
 * Height unit setting schema.
 */
const heightUnitSettingSchema = z
  .object({
    key: z.literal('heightUnit'),
    value: z.enum(['cm', 'ft-in']),
  })
  .strict()

/**
 * Auto-save interval setting schema (in milliseconds).
 */
const autoSaveIntervalSettingSchema = z
  .object({
    key: z.literal('autoSaveInterval'),
    value: z.number().int().min(1000).max(300_000), // 1s to 5min
  })
  .strict()

/**
 * Screen wake lock setting schema.
 */
const screenWakeLockSettingSchema = z
  .object({
    key: z.literal('screenWakeLock'),
    value: z.boolean(),
  })
  .strict()

/**
 * Timer sound enabled setting schema.
 */
const timerSoundEnabledSettingSchema = z
  .object({
    key: z.literal('timerSoundEnabled'),
    value: z.boolean(),
  })
  .strict()

/**
 * Timer sound volume setting schema.
 *
 * Matches `setTimerSoundVolume`'s clamp in `src/stores/settings.ts`, which
 * pins the range to 0.5-1 rather than 0-1.
 */
const timerSoundVolumeSettingSchema = z
  .object({
    key: z.literal('timerSoundVolume'),
    value: z.number().min(0.5).max(1),
  })
  .strict()

/**
 * Language setting schema.
 */
const languageSettingSchema = z
  .object({
    key: z.literal('language'),
    value: z.enum(['en', 'de']),
  })
  .strict()

/**
 * Habits page layout setting schema.
 */
const habitViewModeSettingSchema = z
  .object({
    key: z.literal('habitViewMode'),
    value: z.enum(HABIT_VIEW_MODES),
  })
  .strict()

/**
 * DbUserSetting discriminated union schema.
 * Matches src/db/schema.ts DbUserSetting type.
 */
export const dbUserSettingSchema = z.discriminatedUnion('key', [
  themeSettingSchema,
  defaultRestTimerSettingSchema,
  weightUnitSettingSchema,
  heightUnitSettingSchema,
  autoSaveIntervalSettingSchema,
  screenWakeLockSettingSchema,
  timerSoundEnabledSettingSchema,
  timerSoundVolumeSettingSchema,
  languageSettingSchema,
  habitViewModeSettingSchema,
])
