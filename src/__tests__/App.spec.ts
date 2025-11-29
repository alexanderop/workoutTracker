import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import 'fake-indexeddb/auto'
import App from '../App.vue'

// Mock the db module to avoid IndexedDB issues in tests
vi.mock('@/db/repositories/activeWorkout', () => ({
  activeWorkoutRepository: {
    get: vi.fn().mockResolvedValue(undefined),
    exists: vi.fn().mockResolvedValue(false),
  },
}))

vi.mock('@/db/repositories/customExercises', () => ({
  customExercisesRepository: {
    getAll: vi.fn().mockResolvedValue([]),
  },
}))

describe('app', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('mounts renders properly', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/workouts', component: { template: '<div>Workouts</div>' } },
        { path: '/exercises', component: { template: '<div>Exercises</div>' } },
        { path: '/settings', component: { template: '<div>Settings</div>' } },
      ],
    })

    const wrapper = mount(App, {
      global: {
        plugins: [router],
        stubs: {
          RouterView: true,
          ResumeWorkoutDialog: true,
        },
      },
    })
    expect(wrapper.text()).toContain('Home')
  })
})
