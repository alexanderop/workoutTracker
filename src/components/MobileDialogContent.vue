<script setup lang="ts">
import type { DialogContentEmits } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { X } from '@lucide/vue'
import { DialogClose, DialogContent, DialogPortal, useForwardPropsEmits } from 'reka-ui'
import { useI18n } from 'vue-i18n'
import { DialogOverlay } from '@/components/ui/dialog'
import { useTouchDevice } from '@/composables/useTouchDevice'
import { cn } from '@/lib/utils'

defineOptions({
  inheritAttrs: false,
})

const { class: className, showCloseButton = true } = defineProps<{
  class?: HTMLAttributes['class']
  showCloseButton?: boolean
}>()
const emits = defineEmits<DialogContentEmits>()

const forwarded = useForwardPropsEmits({}, emits)

const { t } = useI18n()

defineSlots<{
  default: () => unknown
}>()

const { isTouchDevice } = useTouchDevice()

// On touch devices reka-ui's autofocus would focus the first input and pop the
// on-screen keyboard while the sheet is still animating in, racing the
// viewport measurement. Keep focus on the sheet itself; the keyboard opens
// when the user taps a field.
function handleOpenAutoFocus(event: Event) {
  if (!isTouchDevice.value) return
  event.preventDefault()
  if (event.target instanceof HTMLElement) event.target.focus({ preventScroll: true })
}
</script>

<template>
  <DialogPortal>
    <DialogOverlay />
    <DialogContent
      data-slot="dialog-content"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="
        cn(
          'bg-background fixed bottom-[var(--keyboard-inset,0px)] left-0 right-0 z-50 flex w-full flex-col gap-4 overflow-hidden rounded-t-2xl border pt-2 px-4 pb-6 shadow-lg safe-area-bottom',
          'max-h-[calc(100dvh-var(--keyboard-inset,0px))]',
          'data-[state=open]:animate-slide-up-mobile data-[state=closed]:animate-slide-down-mobile',
          'sm:data-[state=open]:animate-in sm:data-[state=closed]:animate-out sm:data-[state=closed]:fade-out-0 sm:data-[state=open]:fade-in-0 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95 sm:duration-200',
          'sm:bottom-auto sm:left-[50%] sm:right-auto sm:top-[50%] sm:max-w-lg sm:max-h-[calc(100vh-4rem)] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:p-6',
          className,
        )
      "
      @open-auto-focus="handleOpenAutoFocus"
    >
      <!-- Drag handle (mobile only) -->
      <div class="flex justify-center pb-2 sm:hidden">
        <div class="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
      </div>

      <slot />

      <!-- Close button (desktop only) -->
      <DialogClose
        v-if="showCloseButton"
        data-slot="dialog-close"
        class="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 hidden rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none sm:block [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
      >
        <X />
        <span class="sr-only">{{ t('common.buttons.close') }}</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
