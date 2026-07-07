<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Copy, MoreVertical, Trash2 } from '@lucide/vue'

const { t } = useI18n()

const open = defineModel<boolean>('open', { default: false })

const { setNumber, deleteDisabled = false } = defineProps<{
  /** 1-based set number shown to the user, used to build a distinguishable accessible name. */
  setNumber: number
  deleteDisabled?: boolean
}>()

const emit = defineEmits<{
  delete: []
  duplicate: []
}>()

function handleDelete() {
  if (deleteDisabled) return
  emit('delete')
  open.value = false
}

function handleDuplicate() {
  emit('duplicate')
  open.value = false
}
</script>

<template>
  <DropdownMenu v-model:open="open">
    <DropdownMenuTrigger as-child>
      <!--
        Per-row overflow button -- the discoverable, keyboard/screen-reader-reachable
        entry point for delete/duplicate. The 500ms long-press on the row (see
        WorkoutActiveStrengthView.vue) opens this same menu as a secondary shortcut.
        See Finding 9, July 2026 UX review.
      -->
      <Button
        type="button"
        variant="ghost"
        size="icon"
        class="h-11 w-11 text-muted-foreground/70 hover:text-foreground hover:bg-transparent"
        :aria-label="t('common.aria.setOptionsForSet', { number: setNumber })"
      >
        <MoreVertical class="h-4 w-4" aria-hidden="true" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" :aria-label="t('common.aria.setActionsMenu')">
      <DropdownMenuItem variant="destructive" :disabled="deleteDisabled" @click="handleDelete">
        <Trash2 class="h-4 w-4" aria-hidden="true" />
        <span>{{ t('common.buttons.delete') }}</span>
      </DropdownMenuItem>
      <DropdownMenuItem @click="handleDuplicate">
        <Copy class="h-4 w-4" aria-hidden="true" />
        <span>{{ t('common.buttons.duplicate') }}</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
