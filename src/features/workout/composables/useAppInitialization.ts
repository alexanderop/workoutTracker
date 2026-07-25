import { computed, shallowRef, type ShallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { createActor, type Actor } from 'xstate'
import { RouteNames } from '@/router'
import { getWorkoutRef, restoreWorkout } from '@/stores/workoutState'
import { useWorkoutPersistence } from '@/features/workout/composables/useWorkoutPersistence'
import {
  appInitMachine,
  toInitState,
  type InitState,
} from '@/features/workout/machines/appInitMachine'
import { tryCatch } from '@/lib/tryCatch'

// App-wide singleton: App.vue drives initialization while WorkoutDetailView
// triggers resume, and both must see the same boot state. Created on first use
// rather than at module import so the machine's DB work never races repository
// provider setup.
let actor: Actor<typeof appInitMachine> | undefined

// Mirrors the actor's snapshot into a Vue ref. A plain subscription (rather
// than @xstate/vue's useMachine) because the actor outlives any single
// component -- useMachine would tie it to whichever component mounted first.
const initState: ShallowRef<InitState> = shallowRef({ status: 'loading' })

function getActor(): Actor<typeof appInitMachine> {
  if (!actor) {
    actor = createActor(appInitMachine)
    actor.subscribe((snapshot) => {
      initState.value = toInitState(snapshot)
    })
    actor.start()
  }

  return actor
}

const isInitialized = computed(() => initState.value.status === 'ready')

/**
 * Reset initialization state for testing.
 */
export function resetInitState(): void {
  actor?.stop()
  actor = undefined
  initState.value = { status: 'loading' }
}

/**
 * Composable for app-level initialization.
 * Handles loading data from IndexedDB and prompting to resume workouts.
 */
export function useAppInitialization() {
  const router = useRouter()
  const workoutReference = getWorkoutRef()
  const persistence = useWorkoutPersistence(workoutReference)

  /**
   * Initialize the app: load exercises and check for active workout.
   *
   * Safe to call more than once -- the machine only handles `INITIALIZE` from
   * its initial state, so later calls are dropped.
   */
  function initialize(): void {
    getActor().send({ type: 'INITIALIZE' })
  }

  /**
   * Resume the active workout from the database.
   *
   * The DB read and the navigation stay here because both are bound to Vue
   * scope (a per-component persistence instance and the router); the machine
   * owns the state either side of them.
   */
  async function resumeWorkout(): Promise<void> {
    const machine = getActor()
    machine.send({ type: 'RESUME' })

    const [error, savedWorkout] = await tryCatch(persistence.loadActiveWorkout())

    if (error) {
      machine.send({ type: 'RESUME_FAILED', error })
      return
    }

    if (savedWorkout) {
      restoreWorkout(savedWorkout)
      persistence.markInitialized()
    }

    machine.send({ type: 'RESUME_DONE' })

    // Navigate to active workout - failures are typically user-initiated (e.g., back button)
    await tryCatch(router.push({ name: RouteNames.ActiveWorkout }))
  }

  /**
   * Discard the saved workout and start fresh.
   */
  async function discardWorkout(): Promise<void> {
    const machine = getActor()
    machine.send({ type: 'DISCARD' })

    const [error] = await tryCatch(persistence.discardActiveWorkout())

    if (error) {
      machine.send({ type: 'DISCARD_FAILED', error })
      return
    }

    machine.send({ type: 'DISCARD_DONE' })
  }

  return {
    initState,
    isInitialized,
    initialize,
    resumeWorkout,
    discardWorkout,
  }
}
