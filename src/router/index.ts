import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw, Router, RouterHistory } from 'vue-router'
import { setupDocumentTitle } from './documentTitle'
import { setupOnboardingGuard } from '@/features/onboarding/setupOnboardingGuard'
import ActiveWorkout from '@/views/ActiveWorkout.vue'
import ActiveBenchmarkWorkout from '@/views/ActiveBenchmarkWorkout.vue'
import BenchmarkDetailView from '@/views/BenchmarkDetailView.vue'
import CreateBenchmarkView from '@/views/CreateBenchmarkView.vue'
import ExerciseFormView from '@/views/ExerciseFormView.vue'
import CreateTemplateView from '@/views/CreateTemplateView.vue'
import LogPastWorkoutView from '@/views/LogPastWorkoutView.vue'
import TemplateDetailView from '@/views/TemplateDetailView.vue'
import TheExercisesView from '@/views/TheExercisesView.vue'
import TheHistoryView from '@/views/TheHistoryView.vue'
import TheHomeView from '@/views/TheHomeView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import TheTimersView from '@/views/TheTimersView.vue'
import TheSettingsView from '@/views/TheSettingsView.vue'
import TheWorkoutsView from '@/views/TheWorkoutsView.vue'
import WorkoutDetailView from '@/views/WorkoutDetailView.vue'
import WorkoutSummaryView from '@/views/WorkoutSummaryView.vue'

export const RouteNames = {
  Home: 'Home',
  History: 'History',
  Workouts: 'Workouts',
  WorkoutDetail: 'WorkoutDetail',
  Exercises: 'Exercises',
  Settings: 'Settings',
  Timers: 'Timers',
  Weight: 'Weight',
  ActiveWorkout: 'ActiveWorkout',
  ActiveBenchmark: 'ActiveBenchmark',
  ExerciseForm: 'ExerciseForm',
  EditExercise: 'EditExercise',
  WorkoutSummary: 'WorkoutSummary',
  CreateTemplate: 'CreateTemplate',
  TemplateDetail: 'TemplateDetail',
  CreateBenchmark: 'CreateBenchmark',
  BenchmarkDetail: 'BenchmarkDetail',
  LogPastWorkout: 'LogPastWorkout',
  ExerciseProgress: 'ExerciseProgress',
  Progressions: 'Progressions',
  CreateProgression: 'CreateProgression',
  ProgressionDetail: 'ProgressionDetail',
  ActiveProgression: 'ActiveProgression',
  Onboarding: 'Onboarding',
  NotFound: 'NotFound',
} as const

export type RouteName = (typeof RouteNames)[keyof typeof RouteNames]

export const routes: ReadonlyArray<RouteRecordRaw> = [
  {
    path: '/',
    name: RouteNames.Home,
    component: TheHomeView,
    meta: { titleKey: 'home' },
  },
  {
    path: '/history',
    name: RouteNames.History,
    component: TheHistoryView,
    meta: { titleKey: 'history' },
  },
  {
    path: '/workouts',
    name: RouteNames.Workouts,
    component: TheWorkoutsView,
    meta: { titleKey: 'workouts' },
  },
  {
    path: '/workouts/:id',
    name: RouteNames.WorkoutDetail,
    component: WorkoutDetailView,
    props: true,
    meta: { titleKey: 'workoutDetail' },
  },
  {
    path: '/exercises',
    name: RouteNames.Exercises,
    component: TheExercisesView,
    meta: { titleKey: 'exercises' },
  },
  {
    path: '/exercises/:id',
    name: RouteNames.ExerciseProgress,
    component: () => import('@/views/ExerciseProgressView.vue'),
    props: true,
    meta: { titleKey: 'exerciseProgress' },
  },
  {
    path: '/settings',
    name: RouteNames.Settings,
    component: TheSettingsView,
    meta: { titleKey: 'settings' },
  },
  {
    path: '/timers',
    name: RouteNames.Timers,
    component: TheTimersView,
    meta: { titleKey: 'timers' },
  },
  {
    path: '/weight',
    name: RouteNames.Weight,
    component: () => import('@/views/WeightView.vue'),
    meta: { titleKey: 'weight' },
  },
  {
    path: '/workout/active',
    name: RouteNames.ActiveWorkout,
    component: ActiveWorkout,
    meta: { titleKey: 'activeWorkout' },
  },
  {
    path: '/benchmark/active',
    name: RouteNames.ActiveBenchmark,
    component: ActiveBenchmarkWorkout,
    meta: { titleKey: 'activeBenchmark' },
  },
  {
    path: '/create-exercise',
    name: RouteNames.ExerciseForm,
    component: ExerciseFormView,
    meta: { titleKey: 'createExercise' },
  },
  {
    path: '/exercises/:id/edit',
    name: RouteNames.EditExercise,
    component: ExerciseFormView,
    props: true,
    meta: { titleKey: 'editExercise' },
  },
  {
    path: '/workout/summary/:id',
    name: RouteNames.WorkoutSummary,
    component: WorkoutSummaryView,
    props: true,
    meta: { titleKey: 'workoutSummary' },
  },
  {
    path: '/templates/create',
    name: RouteNames.CreateTemplate,
    component: CreateTemplateView,
    meta: { titleKey: 'createTemplate' },
  },
  {
    path: '/templates/:id',
    name: RouteNames.TemplateDetail,
    component: TemplateDetailView,
    props: true,
    meta: { titleKey: 'templateDetail' },
  },
  {
    path: '/benchmarks/create',
    name: RouteNames.CreateBenchmark,
    component: CreateBenchmarkView,
    meta: { titleKey: 'createBenchmark' },
  },
  {
    path: '/benchmarks/:id',
    name: RouteNames.BenchmarkDetail,
    component: BenchmarkDetailView,
    props: true,
    meta: { titleKey: 'benchmarkDetail' },
  },
  {
    path: '/log-past-workout',
    name: RouteNames.LogPastWorkout,
    component: LogPastWorkoutView,
    meta: { titleKey: 'logPastWorkout' },
  },
  {
    path: '/progressions',
    name: RouteNames.Progressions,
    component: () => import('@/views/ProgressionsView.vue'),
    meta: { titleKey: 'progressions' },
  },
  {
    path: '/progressions/create',
    name: RouteNames.CreateProgression,
    component: () => import('@/views/CreateProgressionView.vue'),
    meta: { titleKey: 'createProgression' },
  },
  {
    path: '/progressions/:id',
    name: RouteNames.ProgressionDetail,
    component: () => import('@/views/ProgressionDetailView.vue'),
    props: true,
    meta: { titleKey: 'progressionDetail' },
  },
  {
    path: '/progressions/:id/session',
    name: RouteNames.ActiveProgression,
    component: () => import('@/views/ActiveProgressionView.vue'),
    props: true,
    meta: { titleKey: 'activeProgression' },
  },
  {
    path: '/onboarding',
    name: RouteNames.Onboarding,
    component: () => import('@/features/onboarding/views/OnboardingView.vue'),
    meta: { titleKey: 'onboarding' },
  },
  // Catch-all: keep this last so every named route above gets first shot at
  // matching. Unmatched URLs (e.g. a plausible-looking but non-existent
  // `/benchmarks` or `/timers/emom/custom`) previously rendered a blank
  // `<main>` with only the bottom nav (UX review M2) — this makes the
  // failure visible with a way back.
  {
    path: '/:pathMatch(.*)*',
    name: RouteNames.NotFound,
    component: NotFoundView,
    meta: { titleKey: 'notFound' },
  },
]

/**
 * Build a fully wired app router: routes plus every router-level behavior
 * (per-route document titles, onboarding guard). Tests pass
 * `createMemoryHistory()` so integration suites exercise exactly the
 * production setup instead of re-assembling it hook by hook.
 */
export function createAppRouter(
  history: RouterHistory = createWebHistory(import.meta.env.BASE_URL),
): Router {
  const router = createRouter({ history, routes })
  setupDocumentTitle(router)
  setupOnboardingGuard(router)
  return router
}

const router = createAppRouter()

export { router }
