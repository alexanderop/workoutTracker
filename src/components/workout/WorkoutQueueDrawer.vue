<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { ref, useTemplateRef, watch } from 'vue'
import { useSortable } from '@vueuse/integrations/useSortable'
import { useI18n } from 'vue-i18n'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useWorkout } from '@/composables/useWorkout'
import { isStrengthBlock, isTimedBlock } from '@/types/blocks'
import WorkoutQueueItem from './WorkoutQueueItem.vue'

const { t } = useI18n()

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  'add-block': []
}>()

const { workout, selectBlock, reorderBlocks } = useWorkout()

// Create a mutable copy for sortable to work with
const blocksList = ref([...workout.value.blocks])

// Sync blocks when workout changes
watch(
  () => workout.value.blocks,
  (newBlocks) => {
    blocksList.value = [...newBlocks]
  },
)

// Setup drag-drop
const sortableContainer = useTemplateRef<HTMLElement>('sortableContainer')

useSortable(sortableContainer, blocksList, {
  animation: 150,
  ghostClass: 'opacity-50',
  handle: '.drag-handle',
  onEnd: (event) => {
    const { oldIndex, newIndex } = event
    if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
      reorderBlocks(oldIndex, newIndex)
    }
  },
})

function getBlockStatus(index: number): 'completed' | 'active' | 'planned' {
  if (index === workout.value.selectedBlockIndex) {
    return 'active'
  }

  const block = workout.value.blocks[index]
  if (!block) return 'planned'

  if (isStrengthBlock(block)) {
    const allCompleted = block.sets.every((s) => s.status === 'completed')
    if (allCompleted) return 'completed'
  }

  if (isTimedBlock(block)) {
    if (block.result !== null) return 'completed'
  }

  // If block is before the current block, check if it has any progress
  if (index < workout.value.selectedBlockIndex) {
    if (isStrengthBlock(block)) {
      const hasCompleted = block.sets.some((s) => s.status === 'completed')
      if (hasCompleted) return 'completed'
    }
  }

  return 'planned'
}

function handleSelectBlock(index: number) {
  selectBlock(index)
  open.value = false
}

function handleAddBlock() {
  open.value = false
  emit('add-block')
}
</script>

<template>
  <Dialog v-model:open="open">
    <MobileDialogContent class="max-h-[80vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>{{ t('workouts.active.queue.title') }}</DialogTitle>
        <DialogDescription class="sr-only">
          {{ t('workouts.active.queue.description') }}
        </DialogDescription>
      </DialogHeader>

      <!-- Scrollable list of blocks -->
      <div ref="sortableContainer" class="flex-1 overflow-y-auto -mx-4 px-4 flex flex-col gap-1">
        <WorkoutQueueItem
          v-for="(block, index) in blocksList"
          :key="block.id"
          :block="block"
          :index="index"
          :status="getBlockStatus(index)"
          @select="handleSelectBlock(index)"
        />
      </div>

      <!-- Add Exercise Button -->
      <Button variant="outline" class="w-full h-12 border-dashed mt-4" @click="handleAddBlock">
        <Plus class="size-5 mr-2" />
        {{ t('workouts.active.queue.addBlock') }}
      </Button>
    </MobileDialogContent>
  </Dialog>
</template>
