import type { Ref } from 'vue'
import { computed, onScopeDispose, ref, watch } from 'vue'

export type UseCondensedSearchReturn = {
  /** True while the user is actively searching (input focused or query present). */
  isCondensed: Ref<boolean>
  handleSearchFocus: () => void
  handleSearchBlur: () => void
}

/**
 * Delay before un-condensing after the user stops searching. A tap on a list
 * item can still be in flight when the search input blurs; expanding the
 * chrome immediately would shift the list down and make that tap land on the
 * wrong exercise (same race as the autofocus keyboard-reflow finding).
 */
const EXPAND_DELAY_MS = 300

/**
 * Tracks whether an exercise search UI should run in "condensed" mode.
 *
 * On mobile the on-screen keyboard leaves a bottom sheet only a few hundred
 * pixels, so while the user is actively searching (search input focused or a
 * query typed) the surrounding chrome — dialog header, tabs, inactive filter
 * rows, pinned footer — collapses to give the result list the space.
 *
 * Condensing engages instantly; expanding back is delayed by
 * {@link EXPAND_DELAY_MS} so in-flight taps never have their target shifted.
 */
export function useCondensedSearch(searchQuery: Ref<string>): UseCondensedSearchReturn {
  const isSearchFocused = ref(false)
  const isCondensed = ref(false)
  const isSearching = computed(() => isSearchFocused.value || searchQuery.value.trim() !== '')

  let expandTimer: ReturnType<typeof setTimeout> | undefined

  watch(isSearching, (searching) => {
    clearTimeout(expandTimer)
    if (searching) {
      isCondensed.value = true
      return
    }
    expandTimer = setTimeout(() => {
      isCondensed.value = false
    }, EXPAND_DELAY_MS)
  })

  onScopeDispose(() => clearTimeout(expandTimer))

  return {
    isCondensed,
    handleSearchFocus: () => {
      isSearchFocused.value = true
    },
    handleSearchBlur: () => {
      isSearchFocused.value = false
    },
  }
}
