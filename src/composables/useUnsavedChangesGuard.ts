import { onBeforeRouteLeave } from 'vue-router'
import { shallowRef, toValue, type MaybeRefOrGetter, type ShallowRef } from 'vue'
import { useEventListener } from '@vueuse/core'

export type UseUnsavedChangesGuardReturn = {
  /** Writable on purpose: bound via v-model to the discard-confirmation dialog. */
  showDialog: ShallowRef<boolean>
  confirmDiscard: () => void
  cancelDiscard: () => void
}

/**
 * Route-guards navigation away from a dirty form and asks the user to
 * confirm before discarding unsaved changes.
 *
 * Covers every way a user can leave the page:
 * - Header back button (it calls `router.push`/`router.back`, both of which
 *   are intercepted by the `onBeforeRouteLeave` guard below).
 * - Browser/hardware back or forward (also a router navigation).
 * - Any other in-app route change (e.g. bottom nav, deep links).
 * - Tab close or refresh, via a `beforeunload` listener (the browser
 *   controls that prompt's copy, not us).
 *
 * Must be invoked synchronously during a routed view's `setup()` (directly
 * or through a composable it calls during setup) so Vue Router can register
 * the component-scoped leave guard.
 *
 * @example
 * const { isEdited, ... } = useTemplateDetail(templateId)
 * const { showDialog, confirmDiscard, cancelDiscard } = useUnsavedChangesGuard(isEdited)
 */
export function useUnsavedChangesGuard(
  isDirty: MaybeRefOrGetter<boolean>,
): UseUnsavedChangesGuardReturn {
  const showDialog = shallowRef(false)
  let resolveNavigation: ((proceed: boolean) => void) | null = null

  onBeforeRouteLeave(() => {
    if (!toValue(isDirty)) return true

    return new Promise<boolean>((resolve) => {
      resolveNavigation = resolve
      showDialog.value = true
    })
  })

  // Attach `beforeunload` only while the form is dirty: a page with a
  // registered beforeunload listener is ineligible for the back/forward cache,
  // which would cost every pristine visit its instant bfcache restore.
  useEventListener(
    () => (toValue(isDirty) ? globalThis : undefined),
    'beforeunload',
    (event: BeforeUnloadEvent) => {
      event.preventDefault()
      // Chrome requires returnValue to be set for the native prompt to appear.
      event.returnValue = ''
    },
  )

  /** User confirmed discarding changes: let the pending navigation proceed. */
  function confirmDiscard(): void {
    showDialog.value = false
    resolveNavigation?.(true)
    resolveNavigation = null
  }

  /** User cancelled: stay on the page, keep the pending navigation blocked. */
  function cancelDiscard(): void {
    showDialog.value = false
    resolveNavigation?.(false)
    resolveNavigation = null
  }

  return {
    showDialog,
    confirmDiscard,
    cancelDiscard,
  }
}
