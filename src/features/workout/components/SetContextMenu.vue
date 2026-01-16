<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { cn } from '@/lib/utils'
import { Copy, Trash2 } from 'lucide-vue-next'

const { t } = useI18n()

const { open, position, deleteDisabled = false } = defineProps<{
  open: boolean
  position: { x: number; y: number }
  deleteDisabled?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  delete: []
  duplicate: []
}>()

const menuRef = useTemplateRef<HTMLDivElement>('menu')

// Adjusted position to keep menu in viewport
const adjustedPosition = ref({ x: 0, y: 0 })

function adjustPosition() {
  if (!menuRef.value) {
    adjustedPosition.value = position
    return
  }

  const rect = menuRef.value.getBoundingClientRect()
  const padding = 8
  let { x, y } = position

  // Adjust horizontal position
  if (x + rect.width > window.innerWidth - padding) {
    x = window.innerWidth - rect.width - padding
  }
  if (x < padding) {
    x = padding
  }

  // Adjust vertical position
  if (y + rect.height > window.innerHeight - padding) {
    y = window.innerHeight - rect.height - padding
  }
  if (y < padding) {
    y = padding
  }

  adjustedPosition.value = { x, y }
}

function close() {
  emit('update:open', false)
}

function handleDelete() {
  if (deleteDisabled) return
  emit('delete')
  close()
}

function handleDuplicate() {
  emit('duplicate')
  close()
}

// Close on click outside
onClickOutside(menuRef, close, { ignore: [] })

// Close on escape key
onKeyStroke('Escape', close)

// Adjust position when menu opens or position changes
watch(
  () => [open, position] as const,
  () => {
    if (open) {
      // Use nextTick-like behavior with requestAnimationFrame
      requestAnimationFrame(adjustPosition)
    }
  },
  { immediate: true },
)

// Recalculate on resize
onMounted(() => {
  window.addEventListener('resize', adjustPosition)
})

onUnmounted(() => {
  window.removeEventListener('resize', adjustPosition)
})

const menuItemClass = computed(() =>
  'flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none',
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      ref="menu"
      role="menu"
      :aria-label="t('common.aria.setActionsMenu')"
      class="fixed z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
      :style="{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }"
    >
      <button
        role="menuitem"
        :class="cn(
          menuItemClass,
          'w-full text-left focus:bg-accent focus:text-accent-foreground',
          deleteDisabled && 'pointer-events-none opacity-50',
        )"
        :aria-disabled="deleteDisabled"
        :disabled="deleteDisabled"
        @click="handleDelete"
      >
        <Trash2 class="h-4 w-4 text-destructive" aria-hidden="true" />
        <span>{{ t('common.buttons.delete') }}</span>
      </button>
      <button
        role="menuitem"
        :class="cn(
          menuItemClass,
          'w-full text-left focus:bg-accent focus:text-accent-foreground',
        )"
        @click="handleDuplicate"
      >
        <Copy class="h-4 w-4" aria-hidden="true" />
        <span>{{ t('common.buttons.duplicate') }}</span>
      </button>
    </div>
  </Teleport>
</template>
