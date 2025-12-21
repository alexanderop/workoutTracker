<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { computed, nextTick, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import Sortable from 'sortablejs'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useWorkout } from '@/features/workout/composables/useWorkout'
import { cn } from '@/lib/utils'
import { isStrengthBlock, isTimedBlock } from '@/types/blocks'
import WorkoutQueueItem from './WorkoutQueueItem.vue'

const { t } = useI18n()

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  'add-block': []
}>()

const { workout, selectBlock, reorderBlocks, removeBlock } = useWorkout()

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
const sortableInstance = ref<Sortable | null>(null)

// Initialize sortable when drawer opens and container is available
// Sheet content is conditionally rendered, so we need to wait for the container
watch(
  [open, sortableContainer],
  async ([isOpen, container]) => {
    // Destroy previous instance
    if (sortableInstance.value) {
      sortableInstance.value.destroy()
      sortableInstance.value = null
    }

    if (isOpen && container) {
      await nextTick()
      sortableInstance.value = new Sortable(container, {
        animation: 150,
        ghostClass: 'opacity-50',
        handle: '.drag-handle',
        // Required for modals/sheets: appends drag ghost to body to avoid
        // clipping by overflow:hidden and z-index issues in portalled content
        fallbackOnBody: true,
        swapThreshold: 0.65,
        onEnd: (event) => {
          const { oldIndex, newIndex } = event
          if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
            reorderBlocks(oldIndex, newIndex)
          }
        },
      })
    }
  },
  { immediate: true },
)

// Cleanup on unmount to prevent memory leaks if component unmounts while drawer is open
onUnmounted(() => {
  if (sortableInstance.value) {
    sortableInstance.value.destroy()
    sortableInstance.value = null
  }
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

// Cache block statuses to avoid recalculating in v-for on each render
const blockStatuses = computed(() => blocksList.value.map((_, index) => getBlockStatus(index)))

function handleSelectBlock(index: number) {
  selectBlock(index)
  open.value = false
}

function handleAddBlock() {
  open.value = false
  emit('add-block')
}

function handleRemoveBlock(index: number) {
  removeBlock(index)
  // Close drawer if no blocks remain
  if (workout.value.blocks.length === 0) {
    open.value = false
  }
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent
      side="bottom"
      :class="
        cn(
          'max-h-[80vh] flex flex-col',
          // Mobile: bottom sheet
          'bg-background fixed bottom-0 left-0 right-0 z-50 w-full',
          'gap-4 rounded-t-2xl border pt-2 px-4 pb-6 shadow-lg safe-area-bottom',
          'data-[state=open]:animate-slide-up-mobile',
          'data-[state=closed]:animate-slide-down-mobile',
          // Desktop: centered modal
          'sm:bottom-auto sm:left-[50%] sm:right-auto sm:top-[50%]',
          'sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%]',
          'sm:rounded-lg sm:p-6',
          'sm:data-[state=open]:animate-in sm:data-[state=open]:fade-in-0',
          'sm:data-[state=closed]:animate-out sm:data-[state=closed]:fade-out-0',
          'sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95',
          'sm:duration-200',
        )
      "
    >
      <!-- Drag handle (mobile only) -->
      <div class="flex justify-center pb-2 sm:hidden">
        <div class="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
      </div>

      <SheetHeader>
        <SheetTitle>{{ t('workouts.active.queue.title') }}</SheetTitle>
        <SheetDescription class="sr-only">
          {{ t('workouts.active.queue.description') }}
        </SheetDescription>
      </SheetHeader>

      <!-- Scrollable list of blocks -->
      <div ref="sortableContainer" class="flex-1 overflow-y-auto -mx-4 px-4 flex flex-col gap-1">
        <WorkoutQueueItem
          v-for="(block, index) in blocksList"
          :key="block.id"
          :block="block"
          :index="index"
          :status="blockStatuses[index] ?? 'planned'"
          @select="handleSelectBlock(index)"
          @remove="handleRemoveBlock(index)"
        />
      </div>

      <!-- Add Exercise Button -->
      <Button variant="outline" class="w-full h-12 border-dashed mt-4" @click="handleAddBlock">
        <Plus class="size-5 mr-2" />
        {{ t('workouts.active.queue.addBlock') }}
      </Button>
    </SheetContent>
  </Sheet>
</template>
