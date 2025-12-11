import { createRouter, createWebHistory } from 'vue-router'
import ActiveWorkout from '@/views/ActiveWorkout.vue'
import ActiveBenchmarkWorkout from '@/features/benchmarks/views/ActiveBenchmarkWorkout.vue'
import BenchmarkDetailView from '@/views/BenchmarkDetailView.vue'
import CreateBenchmarkView from '@/views/CreateBenchmarkView.vue'
import CreateCustomExercise from '@/views/CreateCustomExercise.vue'
import CreateTemplateView from '@/views/CreateTemplateView.vue'
import TemplateDetailView from '@/views/TemplateDetailView.vue'
import TheExercisesView from '@/views/TheExercisesView.vue'
import TheHomeView from '@/views/TheHomeView.vue'
import TheTimersView from '@/views/TheTimersView.vue'
import TheSettingsView from '@/views/TheSettingsView.vue'
import TheWorkoutsView from '@/views/TheWorkoutsView.vue'
import WorkoutDetailView from '@/views/WorkoutDetailView.vue'
import WorkoutSummaryView from '@/views/WorkoutSummaryView.vue'

export const RouteNames = {
  Home: 'Home',
  Workouts: 'Workouts',
  WorkoutDetail: 'WorkoutDetail',
  Exercises: 'Exercises',
  Settings: 'Settings',
  Timers: 'Timers',
  ActiveWorkout: 'ActiveWorkout',
  ActiveBenchmark: 'ActiveBenchmark',
  CreateCustomExercise: 'CreateCustomExercise',
  WorkoutSummary: 'WorkoutSummary',
  CreateTemplate: 'CreateTemplate',
  TemplateDetail: 'TemplateDetail',
  CreateBenchmark: 'CreateBenchmark',
  BenchmarkDetail: 'BenchmarkDetail',
} as const

export type RouteName = (typeof RouteNames)[keyof typeof RouteNames]

export const routes = [
  {
    path: '/',
    name: RouteNames.Home,
    component: TheHomeView,
  },
  {
    path: '/workouts',
    name: RouteNames.Workouts,
    component: TheWorkoutsView,
  },
  {
    path: '/workouts/:id',
    name: RouteNames.WorkoutDetail,
    component: WorkoutDetailView,
    props: true,
  },
  {
    path: '/exercises',
    name: RouteNames.Exercises,
    component: TheExercisesView,
  },
  {
    path: '/settings',
    name: RouteNames.Settings,
    component: TheSettingsView,
  },
  {
    path: '/timers',
    name: RouteNames.Timers,
    component: TheTimersView,
  },
  {
    path: '/workout/active',
    name: RouteNames.ActiveWorkout,
    component: ActiveWorkout,
  },
  {
    path: '/benchmark/active',
    name: RouteNames.ActiveBenchmark,
    component: ActiveBenchmarkWorkout,
  },
  {
    path: '/create-exercise',
    name: RouteNames.CreateCustomExercise,
    component: CreateCustomExercise,
  },
  {
    path: '/workout/summary/:id',
    name: RouteNames.WorkoutSummary,
    component: WorkoutSummaryView,
    props: true,
  },
  {
    path: '/templates/create',
    name: RouteNames.CreateTemplate,
    component: CreateTemplateView,
  },
  {
    path: '/templates/:id',
    name: RouteNames.TemplateDetail,
    component: TemplateDetailView,
    props: true,
  },
  {
    path: '/benchmarks/create',
    name: RouteNames.CreateBenchmark,
    component: CreateBenchmarkView,
  },
  {
    path: '/benchmarks/:id',
    name: RouteNames.BenchmarkDetail,
    component: BenchmarkDetailView,
    props: true,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export { router }
