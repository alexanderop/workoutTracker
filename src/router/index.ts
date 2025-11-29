import { createRouter, createWebHistory } from 'vue-router'
import ActiveWorkout from '@/views/ActiveWorkout.vue'
import CreateCustomExercise from '@/views/CreateCustomExercise.vue'
import TheExercisesView from '@/views/TheExercisesView.vue'
import TheHomeView from '@/views/TheHomeView.vue'
import TheSettingsView from '@/views/TheSettingsView.vue'
import TheWorkoutsView from '@/views/TheWorkoutsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: TheHomeView,
    },
    {
      path: '/workouts',
      name: 'Workouts',
      component: TheWorkoutsView,
    },
    {
      path: '/exercises',
      name: 'Exercises',
      component: TheExercisesView,
    },
    {
      path: '/settings',
      name: 'Settings',
      component: TheSettingsView,
    },
    {
      path: '/workout/active',
      name: 'ActiveWorkout',
      component: ActiveWorkout,
    },
    {
      path: '/create-exercise',
      name: 'CreateCustomExercise',
      component: CreateCustomExercise,
    },
  ],
})

export default router
