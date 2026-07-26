/**
 * Cardio activity artwork lookup.
 *
 * The map lives in the components layer on purpose: `src/blocks` is the
 * foundational block model and must not reach into UI modules (enforced by
 * `src/__tests__/architecture/mainSequence.test.ts`), so `CARDIO_ACTIVITIES`
 * carries labels and distance semantics while the icon key lives here.
 *
 * Keyed by `CardioActivity`, so a new activity fails compilation until it gets
 * a pose.
 */

import type { ExerciseIconKey } from '@/components/exercise-icons'
import type { CardioActivity } from '@/blocks'

export const CARDIO_ACTIVITY_ICONS: Readonly<Record<CardioActivity, ExerciseIconKey>> = {
  running: 'cardio-running',
  cycling: 'cardio-cycling',
  rowing: 'cardio-rowing',
  elliptical: 'cardio-elliptical',
  swimming: 'cardio-swimming',
  stairclimber: 'cardio-stair-climber',
  walking: 'cardio-walking',
}
