import type { Router } from 'vue-router'

export type TestContext = {
  router: Router
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
