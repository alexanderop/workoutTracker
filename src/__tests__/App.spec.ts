import { describe, it, expect, vi } from 'vitest'

import { mount } from '@vue/test-utils'
import App from '../App.vue'
import { createRouter, createMemoryHistory } from 'vue-router'

describe('App', () => {
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
        },
      },
    })
    expect(wrapper.text()).toContain('Workout Tracker')
  })
})
