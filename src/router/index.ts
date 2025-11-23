import { createRouter, createWebHistory } from 'vue-router'
import ActiveWorkout from '@/views/ActiveWorkout.vue'
import Exercises from '@/views/Exercises.vue'
import Home from '@/views/Home.vue'
import Settings from '@/views/Settings.vue'
import Workouts from '@/views/Workouts.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,
    },
    {
      path: '/workouts',
      name: 'Workouts',
      component: Workouts,
    },
    {
      path: '/exercises',
      name: 'Exercises',
      component: Exercises,
    },
    {
      path: '/settings',
      name: 'Settings',
      component: Settings,
    },
    {
      path: '/workout/active',
      name: 'ActiveWorkout',
      component: ActiveWorkout,
    },
  ],
})

export default router
