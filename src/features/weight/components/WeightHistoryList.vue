<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useWeightDisplay } from '@/composables/useWeightDisplay'
import type { DbWeightEntry } from '@/db/schema'
import { formatDate } from '../lib/weightCalculations'

const { entries } = defineProps<{
  entries: ReadonlyArray<DbWeightEntry>
}>()

const emit = defineEmits<{
  delete: [id: string]
}>()

const { t } = useI18n()
const { formatWithUnit } = useWeightDisplay()

const deleteDialogOpen = ref(false)
const entryToDelete = ref<DbWeightEntry | null>(null)

function confirmDelete(entry: DbWeightEntry) {
  entryToDelete.value = entry
  deleteDialogOpen.value = true
}

function handleDelete() {
  if (entryToDelete.value) {
    emit('delete', entryToDelete.value.id)
  }
  deleteDialogOpen.value = false
  entryToDelete.value = null
}

function cancelDelete() {
  deleteDialogOpen.value = false
  entryToDelete.value = null
}
</script>

<template>
  <Card>
    <CardHeader class="pb-2">
      <CardTitle class="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {{ t('weight.history') }}
      </CardTitle>
    </CardHeader>
    <CardContent class="p-0">
      <div v-if="entries.length === 0" class="p-4 text-center text-muted-foreground">
        {{ t('weight.noEntries') }}
      </div>
      <ul v-else class="divide-y" role="list">
        <li
          v-for="entry in entries"
          :key="entry.id"
          class="flex items-center justify-between px-4 py-3"
        >
          <div>
            <p class="font-medium">{{ formatWithUnit(entry.weight, 1) }}</p>
            <p class="text-sm text-muted-foreground">{{ formatDate(entry.date) }}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            class="text-muted-foreground hover:text-destructive"
            @click="confirmDelete(entry)"
            :aria-label="t('weight.deleteEntryLabel', { weight: formatWithUnit(entry.weight, 1), date: formatDate(entry.date) })"
          >
            <Trash2 class="h-4 w-4" />
          </Button>
        </li>
      </ul>
    </CardContent>
  </Card>

  <Dialog v-model:open="deleteDialogOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('weight.deleteTitle') }}</DialogTitle>
        <DialogDescription>
          {{ t('weight.deleteConfirm') }}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="cancelDelete">
          {{ t('common.buttons.cancel') }}
        </Button>
        <Button variant="destructive" @click="handleDelete">
          {{ t('common.buttons.delete') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
