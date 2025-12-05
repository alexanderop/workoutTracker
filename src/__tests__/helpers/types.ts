import type { Router } from 'vue-router'
import type userEvent from '@testing-library/user-event'

export type TestContext = {
  router: Router
  user: ReturnType<typeof userEvent.setup>
}

export type SetInputs = {
  kg: HTMLInputElement
  reps: HTMLInputElement
  rir: HTMLInputElement
  complete: HTMLElement
}

export type SetValues = {
  kg?: number
  reps?: number
  rir?: number
}
