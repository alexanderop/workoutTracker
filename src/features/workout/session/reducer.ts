import { isStrengthBlock, isTimedBlock } from '@/types/blocks'
import type {
  AmrapResult,
  EmomResult,
  ForTimeResult,
  StrengthBlock,
  TabataResult,
  TimedBlock,
  WorkoutBlock,
} from '@/types/blocks'
import type { PrefillableSetFields, Set, Workout } from '@/types/workout'
import { hasWorkout } from './types'
import type {
  Command,
  CompleteSetOutcome,
  Effect,
  ReduceResult,
  SessionState,
  StrengthBlockSeed,
  TimedResult,
} from './types'

const PERSIST_EFFECT: ReadonlyArray<Effect> = [{ kind: 'persist' }]
const NO_EFFECTS: ReadonlyArray<Effect> = []

export function isSetReady(set: Readonly<Set>): boolean {
  const kg = Number(set.kg)
  const reps = Number(set.reps)
  const rir = Number(set.rir)
  return set.kg !== '' && kg >= 0 && reps > 0 && rir >= 0 && set.rir !== ''
}

export function isSetReadyForDuration(set: Readonly<Set>): boolean {
  const duration = Number(set.duration)
  return set.duration !== '' && duration > 0
}

export function isBlockComplete(block: WorkoutBlock): boolean {
  if (isStrengthBlock(block)) {
    return block.sets.every((s) => s.status === 'completed')
  }
  return block.result !== null
}

export function emptyWorkout(): Workout {
  return {
    id: 1,
    name: 'New Workout',
    blocks: [],
    selectedBlockIndex: -1,
    startedAt: 0,
    mode: 'builder',
    activeSetIndex: null,
  }
}

export function bucketFor(workout: Workout): SessionState {
  if (workout.mode === 'active') {
    return { status: 'running', workout, lastOutcome: null }
  }
  if (workout.mode === 'completed') {
    return { status: 'completed', workout }
  }
  return { status: 'draft', workout }
}

function generateBlockId(blocks: ReadonlyArray<WorkoutBlock>): number {
  const ids = blocks.map((b) => b.id)
  return ids.length > 0 ? Math.max(...ids) + 1 : 1
}

function generateSetId(sets: ReadonlyArray<Set>): number {
  const ids = sets.map((s) => s.id)
  return ids.length > 0 ? Math.max(...ids) + 1 : 1
}

function appendBlock(workout: Workout, block: WorkoutBlock): Workout {
  const blocks = [...workout.blocks, block]
  return { ...workout, blocks, selectedBlockIndex: blocks.length - 1 }
}

function updateBlockAtIndex(
  workout: Workout,
  blockIndex: number,
  updater: (block: WorkoutBlock) => WorkoutBlock,
): Workout {
  const block = workout.blocks[blockIndex]
  if (!block) return workout
  const updated = updater(block)
  if (updated === block) return workout
  return {
    ...workout,
    blocks: workout.blocks.map((b, i) => (i === blockIndex ? updated : b)),
  }
}

function updateSetInBlock(
  workout: Workout,
  blockIndex: number,
  setId: number,
  updater: (set: Set) => Set,
): Workout {
  return updateBlockAtIndex(workout, blockIndex, (block) => {
    if (!isStrengthBlock(block)) return block
    return {
      ...block,
      sets: block.sets.map((s) => (s.id === setId ? updater(s) : s)),
    }
  })
}

function calculateSelectedIndexAfterRemoval(
  newLength: number,
  currentSelected: number,
  removedIndex: number,
): number {
  if (newLength === 0) return -1
  if (currentSelected >= newLength) return Math.max(0, newLength - 1)
  if (currentSelected > removedIndex) return currentSelected - 1
  return currentSelected
}

function calculateSelectedIndexAfterReorder(
  currentSelected: number,
  fromIndex: number,
  toIndex: number,
): number {
  if (currentSelected === fromIndex) return toIndex
  if (fromIndex < currentSelected && toIndex >= currentSelected) return currentSelected - 1
  if (fromIndex > currentSelected && toIndex <= currentSelected) return currentSelected + 1
  return currentSelected
}

function findNextIncompleteSet(block: StrengthBlock): Set | undefined {
  return block.sets.find((s) => s.status === 'planned' || s.status === 'active')
}

function findFirstIncompleteBlockIndex(blocks: ReadonlyArray<WorkoutBlock>): number {
  return blocks.findIndex((b) => !isBlockComplete(b))
}

function applyPrefillToSet(target: Readonly<Set>, source: Readonly<Set>): PrefillableSetFields {
  return {
    kg: target.kg || source.kg,
    reps: target.reps || source.reps,
    duration: target.duration || source.duration,
    rir: target.rir || source.rir,
  }
}

function buildStrengthBlockFromSeed(
  seed: StrengthBlockSeed,
  blocks: ReadonlyArray<WorkoutBlock>,
): StrengthBlock {
  const firstSet: Set = seed.prefill
    ? {
        id: 1,
        kg: seed.prefill.kg,
        reps: seed.prefill.reps,
        duration: seed.prefill.duration,
        rir: seed.prefill.rir,
        status: 'active',
      }
    : { id: 1, kg: '', reps: '', duration: '', rir: '', status: 'active' }
  return {
    kind: 'strength',
    id: generateBlockId(blocks),
    exerciseDefinitionId: seed.exerciseDefinitionId,
    name: seed.name,
    equipment: seed.equipment,
    targetReps: 8,
    targetDuration: null,
    targetWeight: null,
    image: seed.image,
    sets: [
      firstSet,
      { id: 2, kg: '', reps: '', duration: '', rir: '', status: 'planned' },
      { id: 3, kg: '', reps: '', duration: '', rir: '', status: 'planned' },
    ],
  }
}

function isAmrapResult(result: TimedResult): result is AmrapResult {
  return 'rounds' in result
}

function isEmomResult(result: TimedResult): result is EmomResult {
  return 'completedMinutes' in result
}

function isTabataResult(result: TimedResult): result is TabataResult {
  return 'repsPerRound' in result
}

function isForTimeResult(result: TimedResult): result is ForTimeResult {
  return 'completionTime' in result
}

function getTypedResultUpdate(
  block: TimedBlock,
  result: TimedResult,
): (() => TimedBlock) | null {
  switch (block.kind) {
    case 'amrap': {
      return isAmrapResult(result) ? () => ({ ...block, result }) : null
    }
    case 'emom': {
      return isEmomResult(result) ? () => ({ ...block, result }) : null
    }
    case 'tabata': {
      return isTabataResult(result) ? () => ({ ...block, result }) : null
    }
    case 'fortime': {
      return isForTimeResult(result) ? () => ({ ...block, result }) : null
    }
  }
}

type CompleteSetStep = { workout: Workout; outcome: CompleteSetOutcome }

function activateNextSetInBlock(
  workout: Workout,
  blockIndex: number,
  block: StrengthBlock,
  completedSet: Set,
): CompleteSetStep | null {
  const nextSet = findNextIncompleteSet(block)
  if (!nextSet) return null
  const nextSetIndex = block.sets.findIndex((s) => s.id === nextSet.id)
  const prefilledWorkout = updateSetInBlock(workout, blockIndex, nextSet.id, (s) => ({
    ...s,
    ...applyPrefillToSet(s, completedSet),
    status: 'active',
  }))
  const nextWorkout: Workout =
    nextSetIndex === -1 ? prefilledWorkout : { ...prefilledWorkout, activeSetIndex: nextSetIndex }
  return {
    workout: nextWorkout,
    outcome: { kind: 'completed', nextAction: 'next-set', blockIndex, setId: nextSet.id },
  }
}

function advanceToBlock(workout: Workout, targetIndex: number): CompleteSetStep | null {
  if (targetIndex < 0 || targetIndex >= workout.blocks.length) return null
  let next: Workout = { ...workout, selectedBlockIndex: targetIndex, activeSetIndex: null }
  const targetBlock = next.blocks[targetIndex]
  if (targetBlock && isStrengthBlock(targetBlock)) {
    const firstIncomplete = findNextIncompleteSet(targetBlock)
    if (firstIncomplete) {
      const activatedIndex = targetBlock.sets.findIndex((s) => s.id === firstIncomplete.id)
      next = updateSetInBlock(next, targetIndex, firstIncomplete.id, (s) => ({
        ...s,
        status: 'active',
      }))
      next = { ...next, activeSetIndex: Math.max(activatedIndex, 0) }
    }
  }
  return {
    workout: next,
    outcome: { kind: 'completed', nextAction: 'next-block', blockIndex: targetIndex },
  }
}

function navigateAfterSetComplete(
  workout: Workout,
  blockIndex: number,
  completedBlock: StrengthBlock,
  completedSet: Set,
): CompleteSetStep {
  const next = activateNextSetInBlock(workout, blockIndex, completedBlock, completedSet)
  if (next) return next
  const sequential = advanceToBlock(workout, blockIndex + 1)
  if (sequential) return sequential
  const firstIncomplete = findFirstIncompleteBlockIndex(workout.blocks)
  if (firstIncomplete !== -1) {
    const skipAhead = advanceToBlock(workout, firstIncomplete)
    if (skipAhead) return skipAhead
  }
  return {
    workout,
    outcome: { kind: 'completed', nextAction: 'workout-complete' },
  }
}

function completeSetReducer(
  workout: Workout,
  set: Set,
  useDurationValidation: boolean,
): CompleteSetStep {
  const blockIndex = workout.selectedBlockIndex
  if (set.status === 'completed') {
    return {
      workout: updateSetInBlock(workout, blockIndex, set.id, (s) => ({ ...s, status: 'active' })),
      outcome: { kind: 'uncompleted' },
    }
  }
  const isReady = useDurationValidation ? isSetReadyForDuration(set) : isSetReady(set)
  if (!isReady) {
    return { workout, outcome: { kind: 'invalid' } }
  }
  const completed = updateSetInBlock(workout, blockIndex, set.id, (s) => ({
    ...s,
    status: 'completed',
  }))
  const updatedBlock = completed.blocks[blockIndex]
  if (!updatedBlock || !isStrengthBlock(updatedBlock)) {
    return {
      workout: completed,
      outcome: { kind: 'completed', nextAction: 'workout-complete' },
    }
  }
  return navigateAfterSetComplete(completed, blockIndex, updatedBlock, set)
}

function applyBuilderCommand(workout: Workout, cmd: Command): Workout {
  switch (cmd.type) {
    case 'AddStrengthBlock': {
      return appendBlock(workout, buildStrengthBlockFromSeed(cmd.seed, workout.blocks))
    }
    case 'AddAmrapBlock': {
      return appendBlock(workout, {
        kind: 'amrap',
        id: generateBlockId(workout.blocks),
        config: cmd.config,
        exercises: [...cmd.exercises],
        result: null,
      })
    }
    case 'AddEmomBlock': {
      return appendBlock(workout, {
        kind: 'emom',
        id: generateBlockId(workout.blocks),
        config: cmd.config,
        exercises: [...cmd.exercises],
        result: null,
      })
    }
    case 'AddTabataBlock': {
      return appendBlock(workout, {
        kind: 'tabata',
        id: generateBlockId(workout.blocks),
        config: cmd.config,
        exercise: cmd.exercise,
        result: null,
      })
    }
    case 'AddForTimeBlock': {
      return appendBlock(workout, {
        kind: 'fortime',
        id: generateBlockId(workout.blocks),
        config: cmd.config,
        exercises: [...cmd.exercises],
        result: null,
      })
    }
    case 'AddCardioBlock': {
      return appendBlock(workout, {
        kind: 'cardio',
        id: generateBlockId(workout.blocks),
        config: cmd.config,
        result: null,
      })
    }
    case 'RemoveBlock': {
      if (cmd.blockIndex < 0 || cmd.blockIndex >= workout.blocks.length) return workout
      const filtered = workout.blocks.filter((_, i) => i !== cmd.blockIndex)
      const selectedBlockIndex = calculateSelectedIndexAfterRemoval(
        filtered.length,
        workout.selectedBlockIndex,
        cmd.blockIndex,
      )
      return { ...workout, blocks: filtered, selectedBlockIndex }
    }
    case 'ReorderBlocks': {
      const blocks = [...workout.blocks]
      const moved = blocks[cmd.fromIndex]
      if (!moved) return workout
      blocks.splice(cmd.fromIndex, 1)
      blocks.splice(cmd.toIndex, 0, moved)
      const selectedBlockIndex = calculateSelectedIndexAfterReorder(
        workout.selectedBlockIndex,
        cmd.fromIndex,
        cmd.toIndex,
      )
      return { ...workout, blocks, selectedBlockIndex }
    }
    case 'SelectBlock': {
      if (cmd.blockIndex < 0 || cmd.blockIndex >= workout.blocks.length) return workout
      return { ...workout, selectedBlockIndex: cmd.blockIndex }
    }
    case 'UpdateStrengthBlock': {
      return updateBlockAtIndex(workout, cmd.blockIndex, (b) => {
        if (!isStrengthBlock(b)) return b
        return { ...b, ...cmd.updates }
      })
    }
    case 'UpdateSetValue': {
      return updateBlockAtIndex(workout, cmd.blockIndex, (b) => {
        if (!isStrengthBlock(b)) return b
        const set = b.sets.find((s) => s.id === cmd.setId)
        if (!set) return b
        return {
          ...b,
          sets: b.sets.map((s) =>
            s.id === cmd.setId
              ? { ...s, [cmd.field]: cmd.value === undefined ? '' : String(cmd.value) }
              : s,
          ),
        }
      })
    }
    case 'AddSet': {
      return updateBlockAtIndex(workout, cmd.blockIndex, (b) => {
        if (!isStrengthBlock(b)) return b
        const id = generateSetId(b.sets)
        return {
          ...b,
          sets: [...b.sets, { id, kg: '', reps: '', duration: '', rir: '', status: 'planned' }],
        }
      })
    }
    case 'RemoveSet': {
      const block = workout.blocks[cmd.blockIndex]
      if (!block || !isStrengthBlock(block) || block.sets.length <= 1) return workout
      return updateBlockAtIndex(workout, cmd.blockIndex, (b) => {
        if (!isStrengthBlock(b)) return b
        return { ...b, sets: b.sets.filter((s) => s.id !== cmd.setId) }
      })
    }
    case 'DuplicateSet': {
      const block = workout.blocks[cmd.blockIndex]
      if (!block || !isStrengthBlock(block)) return workout
      const setIndex = block.sets.findIndex((s) => s.id === cmd.setId)
      const originalSet = block.sets[setIndex]
      if (setIndex === -1 || !originalSet) return workout
      const isSelectedBlock = cmd.blockIndex === workout.selectedBlockIndex
      const shouldShift =
        isSelectedBlock &&
        workout.activeSetIndex !== null &&
        workout.activeSetIndex > setIndex
      const activeSetIndex = shouldShift
        ? (workout.activeSetIndex ?? 0) + 1
        : workout.activeSetIndex
      const duplicated = updateBlockAtIndex(workout, cmd.blockIndex, (b) => {
        if (!isStrengthBlock(b)) return b
        const id = generateSetId(b.sets)
        const newSet: Set = {
          id,
          kg: originalSet.kg,
          reps: originalSet.reps,
          duration: originalSet.duration,
          rir: originalSet.rir,
          status: 'planned',
        }
        const sets = [...b.sets]
        sets.splice(setIndex + 1, 0, newSet)
        return { ...b, sets }
      })
      return { ...duplicated, activeSetIndex }
    }
    case 'SetSetCount': {
      const block = workout.blocks[cmd.blockIndex]
      if (!block || !isStrengthBlock(block)) return workout
      const target = Math.max(1, cmd.count)
      const current = block.sets.length
      if (target === current) return workout
      if (target < current) {
        return updateBlockAtIndex(workout, cmd.blockIndex, (b) => {
          if (!isStrengthBlock(b)) return b
          return { ...b, sets: b.sets.slice(0, target) }
        })
      }
      let next = workout
      for (let i = 0; i < target - current; i++) {
        next = updateBlockAtIndex(next, cmd.blockIndex, (b) => {
          if (!isStrengthBlock(b)) return b
          const id = generateSetId(b.sets)
          return {
            ...b,
            sets: [...b.sets, { id, kg: '', reps: '', duration: '', rir: '', status: 'planned' }],
          }
        })
      }
      return next
    }
    default: {
      return workout
    }
  }
}

function applyRunningCommand(workout: Workout, cmd: Command): Workout {
  switch (cmd.type) {
    case 'ActivateSet': {
      const block = workout.blocks[cmd.blockIndex]
      if (!block || !isStrengthBlock(block)) return workout
      const set = block.sets[cmd.setIndex]
      if (!set || set.status !== 'planned') return workout
      const activated = updateSetInBlock(workout, cmd.blockIndex, set.id, (s) => ({
        ...s,
        status: 'active',
      }))
      return { ...activated, activeSetIndex: cmd.setIndex }
    }
    case 'SetBlockResult': {
      const block = workout.blocks[cmd.blockIndex]
      if (!block || !isTimedBlock(block)) return workout
      const updater = getTypedResultUpdate(block, cmd.result)
      if (!updater) return workout
      return updateBlockAtIndex(workout, cmd.blockIndex, updater)
    }
    case 'SetCardioResult': {
      return updateBlockAtIndex(workout, cmd.blockIndex, (b) => {
        if (b.kind !== 'cardio') return b
        return { ...b, result: cmd.result }
      })
    }
    case 'JumpTo': {
      if (cmd.blockIndex < 0 || cmd.blockIndex >= workout.blocks.length) return workout
      let next: Workout = { ...workout, selectedBlockIndex: cmd.blockIndex, activeSetIndex: null }
      const target = next.blocks[cmd.blockIndex]
      if (target && isStrengthBlock(target)) {
        const incompleteIdx = target.sets.findIndex(
          (s) => s.status === 'planned' || s.status === 'active',
        )
        next = { ...next, activeSetIndex: Math.max(incompleteIdx, 0) }
      }
      return next
    }
    default: {
      return workout
    }
  }
}

const LIFECYCLE_COMMANDS = new Set<Command['type']>([
  'NewDraft',
  'LoadActive',
  'StartWorkout',
  'FinishWorkout',
  'Discard',
  'ReturnToBuilder',
])

const BUILDER_COMMANDS = new Set<Command['type']>([
  'AddStrengthBlock',
  'AddAmrapBlock',
  'AddEmomBlock',
  'AddTabataBlock',
  'AddForTimeBlock',
  'AddCardioBlock',
  'RemoveBlock',
  'ReorderBlocks',
  'SelectBlock',
  'UpdateStrengthBlock',
  'UpdateSetValue',
  'AddSet',
  'RemoveSet',
  'DuplicateSet',
  'SetSetCount',
])

const RUNNING_COMMANDS = new Set<Command['type']>([
  'ActivateSet',
  'CompleteSet',
  'SetBlockResult',
  'SetCardioResult',
  'JumpTo',
])

function withWorkout(state: SessionState, workout: Workout): SessionState {
  if (state.status === 'running') {
    return { status: 'running', workout, lastOutcome: state.lastOutcome }
  }
  if (state.status === 'completed') {
    return { status: 'completed', workout }
  }
  return { status: 'draft', workout }
}

function activateFirstSetOnStart(workout: Workout): Workout {
  const firstBlock = workout.blocks[0]
  if (!firstBlock || !isStrengthBlock(firstBlock)) return workout
  const firstSet = firstBlock.sets[0]
  if (!firstSet || firstSet.status === 'completed') return workout
  const withActivated = updateSetInBlock(workout, 0, firstSet.id, (s) => ({
    ...s,
    status: 'active',
  }))
  return { ...withActivated, activeSetIndex: 0 }
}

function reduceLifecycle(state: SessionState, cmd: Command): ReduceResult {
  switch (cmd.type) {
    case 'NewDraft': {
      return { next: { status: 'draft', workout: emptyWorkout() }, effects: NO_EFFECTS }
    }
    case 'LoadActive': {
      return { next: bucketFor(cmd.workout), effects: NO_EFFECTS }
    }
    case 'StartWorkout': {
      if (state.status !== 'draft') return { next: state, effects: NO_EFFECTS }
      if (state.workout.blocks.length === 0) return { next: state, effects: NO_EFFECTS }
      const started: Workout = {
        ...state.workout,
        mode: 'active',
        selectedBlockIndex: 0,
        activeSetIndex: null,
        startedAt: cmd.now,
      }
      const withFirstSetActive = activateFirstSetOnStart(started)
      return {
        next: { status: 'running', workout: withFirstSetActive, lastOutcome: null },
        effects: PERSIST_EFFECT,
      }
    }
    case 'FinishWorkout': {
      if (state.status !== 'running' && state.status !== 'draft') {
        return { next: state, effects: NO_EFFECTS }
      }
      const finished: Workout = { ...state.workout, mode: 'completed' }
      return {
        next: { status: 'completed', workout: finished },
        effects: [
          {
            kind: 'completeWorkout',
            notes: cmd.notes,
            durationOverrideSeconds: cmd.durationOverrideSeconds,
          },
        ],
      }
    }
    case 'Discard': {
      return { next: { status: 'empty' }, effects: [{ kind: 'clearPersisted' }] }
    }
    case 'ReturnToBuilder': {
      if (state.status !== 'running') return { next: state, effects: NO_EFFECTS }
      const next: Workout = { ...state.workout, mode: 'builder', activeSetIndex: null }
      return { next: { status: 'draft', workout: next }, effects: PERSIST_EFFECT }
    }
    default: {
      return { next: state, effects: NO_EFFECTS }
    }
  }
}

function reduceBuilder(state: SessionState, cmd: Command): ReduceResult {
  if (!hasWorkout(state)) return { next: state, effects: NO_EFFECTS }
  const nextWorkout = applyBuilderCommand(state.workout, cmd)
  if (nextWorkout === state.workout) return { next: state, effects: NO_EFFECTS }
  return { next: withWorkout(state, nextWorkout), effects: PERSIST_EFFECT }
}

function reduceRunning(state: SessionState, cmd: Command): ReduceResult {
  if (state.status !== 'running') return { next: state, effects: NO_EFFECTS }
  if (cmd.type === 'CompleteSet') {
    const { workout, outcome } = completeSetReducer(state.workout, cmd.set, cmd.useDurationValidation)
    const next: SessionState = { status: 'running', workout, lastOutcome: outcome }
    if (outcome.kind === 'invalid') return { next, effects: NO_EFFECTS }
    return { next, effects: PERSIST_EFFECT }
  }
  const nextWorkout = applyRunningCommand(state.workout, cmd)
  if (nextWorkout === state.workout) return { next: state, effects: NO_EFFECTS }
  return {
    next: { status: 'running', workout: nextWorkout, lastOutcome: state.lastOutcome },
    effects: PERSIST_EFFECT,
  }
}

export function reduce(state: SessionState, cmd: Command): ReduceResult {
  if (LIFECYCLE_COMMANDS.has(cmd.type)) return reduceLifecycle(state, cmd)
  if (BUILDER_COMMANDS.has(cmd.type)) return reduceBuilder(state, cmd)
  if (RUNNING_COMMANDS.has(cmd.type)) return reduceRunning(state, cmd)
  return { next: state, effects: NO_EFFECTS }
}
