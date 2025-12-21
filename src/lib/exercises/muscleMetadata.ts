import type { Muscle } from '@/types/exercises'

/**
 * Tailwind CSS color classes for each muscle group.
 * Colors are defined as CSS custom properties in style.css.
 */
export const MUSCLE_COLORS: Record<Muscle, string> = {
  chest: 'bg-muscle-chest',
  back: 'bg-muscle-back',
  legs: 'bg-muscle-legs',
  shoulders: 'bg-muscle-shoulders',
  arms: 'bg-muscle-arms',
  core: 'bg-muscle-core',
}
