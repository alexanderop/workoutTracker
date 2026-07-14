// Block creation moved to src/blocks (ADR 002 stage 5): per-kind creators in
// src/blocks/<kind>/create.ts, kind-neutral dispatch in src/blocks/create.ts.
// This barrel keeps existing import paths working.

export {
  createTimedWorkoutBlock,
  createWorkoutBlockFromHistory,
  createWorkoutBlockFromTemplate,
} from '@/blocks/create'
export { createAmrapWorkoutBlock } from '@/blocks/amrap/create'
export { createEmomWorkoutBlock } from '@/blocks/emom/create'
export { createTabataWorkoutBlock } from '@/blocks/tabata/create'
export { createForTimeWorkoutBlock } from '@/blocks/fortime/create'
export { createCardioWorkoutBlock } from '@/blocks/cardio/create'
