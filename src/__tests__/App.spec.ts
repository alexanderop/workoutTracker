import { mount } from '@vue/test-utils'

import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from '../App.vue'

describe('app', () => {
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
    expect(wrapper.text()).toContain('Home')
  })
})
