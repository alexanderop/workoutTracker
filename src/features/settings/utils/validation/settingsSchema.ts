import { z } from 'zod'

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
    value: z.number().int().min(1000).max(300000), // 1s to 5min
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
 * Language setting schema.
 */
const languageSettingSchema = z
  .object({
    key: z.literal('language'),
    value: z.enum(['en', 'de']),
  })
  .strict()

/**
 * Workout hours per week setting schema.
 */
const workoutHoursPerWeekSettingSchema = z
  .object({
    key: z.literal('workoutHoursPerWeek'),
    value: z.number().min(0).max(168).nullable(), // max 168 hours per week
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
  languageSettingSchema,
  workoutHoursPerWeekSettingSchema,
])
