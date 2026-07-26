import type { AppIconComponent } from './types'
import EquipmentBandIcon from './icons/EquipmentBandIcon.vue'
import EquipmentBarbellIcon from './icons/EquipmentBarbellIcon.vue'
import EquipmentBodyweightIcon from './icons/EquipmentBodyweightIcon.vue'
import EquipmentCableIcon from './icons/EquipmentCableIcon.vue'
import EquipmentDumbbellIcon from './icons/EquipmentDumbbellIcon.vue'
import EquipmentEgymIcon from './icons/EquipmentEgymIcon.vue'
import EquipmentEzBarIcon from './icons/EquipmentEzBarIcon.vue'
import EquipmentHexBarIcon from './icons/EquipmentHexBarIcon.vue'
import EquipmentKettlebellIcon from './icons/EquipmentKettlebellIcon.vue'
import EquipmentMachineIcon from './icons/EquipmentMachineIcon.vue'
import MuscleArmsIcon from './icons/MuscleArmsIcon.vue'
import MuscleBackIcon from './icons/MuscleBackIcon.vue'
import MuscleChestIcon from './icons/MuscleChestIcon.vue'
import MuscleCoreIcon from './icons/MuscleCoreIcon.vue'
import MuscleLegsIcon from './icons/MuscleLegsIcon.vue'
import MuscleShouldersIcon from './icons/MuscleShouldersIcon.vue'
import HabitCheckIcon from './icons/HabitCheckIcon.vue'
import HabitCleanIcon from './icons/HabitCleanIcon.vue'
import HabitDefaultIcon from './icons/HabitDefaultIcon.vue'
import HabitJournalIcon from './icons/HabitJournalIcon.vue'
import HabitMeditateIcon from './icons/HabitMeditateIcon.vue'
import HabitNoSmokeIcon from './icons/HabitNoSmokeIcon.vue'
import HabitNutritionIcon from './icons/HabitNutritionIcon.vue'
import HabitProgressIcon from './icons/HabitProgressIcon.vue'
import HabitReadIcon from './icons/HabitReadIcon.vue'
import HabitRunIcon from './icons/HabitRunIcon.vue'
import HabitSleepIcon from './icons/HabitSleepIcon.vue'
import HabitStrengthIcon from './icons/HabitStrengthIcon.vue'
import HabitWaterIcon from './icons/HabitWaterIcon.vue'
import MoodGoodIcon from './icons/MoodGoodIcon.vue'
import MoodGreatIcon from './icons/MoodGreatIcon.vue'
import MoodLowIcon from './icons/MoodLowIcon.vue'
import MoodOffIcon from './icons/MoodOffIcon.vue'
import MoodOkayIcon from './icons/MoodOkayIcon.vue'
import TrophyIcon from './icons/TrophyIcon.vue'
import CelebrateIcon from './icons/CelebrateIcon.vue'

type AppIconEntry = Readonly<{
  /** English fallback label, used when a call site does not supply a translated one. */
  title: string
  component: AppIconComponent
}>

/**
 * Every bundled key. `appIconRegistry` is typed against this tuple, so adding a
 * key here without artwork (or vice versa) is a compile error rather than a
 * missing glyph at runtime.
 */
export const appIconKeys = [
  'equipment-barbell',
  'equipment-dumbbell',
  'equipment-machine',
  'equipment-cable',
  'equipment-bodyweight',
  'equipment-kettlebell',
  'equipment-band',
  'equipment-ez-bar',
  'equipment-hex-bar',
  'equipment-egym',
  'muscle-chest',
  'muscle-back',
  'muscle-legs',
  'muscle-shoulders',
  'muscle-arms',
  'muscle-core',
  'habit-water',
  'habit-run',
  'habit-meditate',
  'habit-read',
  'habit-sleep',
  'habit-nutrition',
  'habit-strength',
  'habit-journal',
  'habit-no-smoke',
  'habit-clean',
  'habit-default',
  'habit-check',
  'habit-progress',
  'mood-low',
  'mood-off',
  'mood-okay',
  'mood-good',
  'mood-great',
  'trophy',
  'celebrate',
] as const

export type AppIconKey = (typeof appIconKeys)[number]

/**
 * Bundled app artwork, drawn on the same 48x48 grid as the exercise icons so
 * equipment, muscle, habit, and mood glyphs share one visual language.
 */
const appIconRegistry: Readonly<Record<AppIconKey, AppIconEntry>> = {
  'equipment-barbell': { title: 'Barbell', component: EquipmentBarbellIcon },
  'equipment-dumbbell': { title: 'Dumbbell', component: EquipmentDumbbellIcon },
  'equipment-machine': { title: 'Machine', component: EquipmentMachineIcon },
  'equipment-cable': { title: 'Cable', component: EquipmentCableIcon },
  'equipment-bodyweight': { title: 'Bodyweight', component: EquipmentBodyweightIcon },
  'equipment-kettlebell': { title: 'Kettlebell', component: EquipmentKettlebellIcon },
  'equipment-band': { title: 'Band', component: EquipmentBandIcon },
  'equipment-ez-bar': { title: 'EZ Bar', component: EquipmentEzBarIcon },
  'equipment-hex-bar': { title: 'Hex Bar', component: EquipmentHexBarIcon },
  'equipment-egym': { title: 'EGYM', component: EquipmentEgymIcon },
  'muscle-chest': { title: 'Chest', component: MuscleChestIcon },
  'muscle-back': { title: 'Back', component: MuscleBackIcon },
  'muscle-legs': { title: 'Legs', component: MuscleLegsIcon },
  'muscle-shoulders': { title: 'Shoulders', component: MuscleShouldersIcon },
  'muscle-arms': { title: 'Arms', component: MuscleArmsIcon },
  'muscle-core': { title: 'Core', component: MuscleCoreIcon },
  'habit-water': { title: 'Water', component: HabitWaterIcon },
  'habit-run': { title: 'Run', component: HabitRunIcon },
  'habit-meditate': { title: 'Meditate', component: HabitMeditateIcon },
  'habit-read': { title: 'Read', component: HabitReadIcon },
  'habit-sleep': { title: 'Sleep', component: HabitSleepIcon },
  'habit-nutrition': { title: 'Nutrition', component: HabitNutritionIcon },
  'habit-strength': { title: 'Strength', component: HabitStrengthIcon },
  'habit-journal': { title: 'Journal', component: HabitJournalIcon },
  'habit-no-smoke': { title: 'No smoking', component: HabitNoSmokeIcon },
  'habit-clean': { title: 'Tidy up', component: HabitCleanIcon },
  'habit-default': { title: 'Habit', component: HabitDefaultIcon },
  'habit-check': { title: 'Done', component: HabitCheckIcon },
  'habit-progress': { title: 'Progress', component: HabitProgressIcon },
  'mood-low': { title: 'Low', component: MoodLowIcon },
  'mood-off': { title: 'Off', component: MoodOffIcon },
  'mood-okay': { title: 'Okay', component: MoodOkayIcon },
  'mood-good': { title: 'Good', component: MoodGoodIcon },
  'mood-great': { title: 'Great', component: MoodGreatIcon },
  trophy: { title: 'Personal best', component: TrophyIcon },
  celebrate: { title: 'Celebrate', component: CelebrateIcon },
}

const APP_ICON_KEY_SET: ReadonlySet<unknown> = new Set(appIconKeys)

export function isAppIconKey(value: unknown): value is AppIconKey {
  return APP_ICON_KEY_SET.has(value)
}

export function getAppIcon(key: AppIconKey): AppIconEntry {
  return appIconRegistry[key]
}
