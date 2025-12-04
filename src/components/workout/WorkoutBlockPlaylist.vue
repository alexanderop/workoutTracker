<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import { useSortable } from '@vueuse/integrations/useSortable'
import { useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import type { WorkoutBlock } from '@/types/blocks'
import WorkoutBlockPlaylistItem from './WorkoutBlockPlaylistItem.vue'

const { t } = useI18n()

type Props = {
  blocks: ReadonlyArray<WorkoutBlock>
  selectedIndex: number
  completedBlocks?: ReadonlyArray<number>
  disabled?: boolean
}

const { blocks, selectedIndex, completedBlocks = [], disabled = false } = defineProps<Props>()

const emit = defineEmits<{
  select: [index: number]
  edit: [index: number]
  remove: [index: number]
  reorder: [fromIndex: number, toIndex: number]
  'add-block': []
}>()

const sortableContainer = useTemplateRef<HTMLElement>('sortableContainer')

// Create a mutable shallow copy for sortable to work with
const blocksList = ref([...blocks])

watch(
  () => blocks,
  (newBlocks) => {
    blocksList.value = [...newBlocks]
  },
)

useSortable(sortableContainer, blocksList, {
  animation: 150,
  ghostClass: 'opacity-50',
  handle: '.drag-handle',
  disabled,
  onEnd: (event) => {
    const { oldIndex, newIndex } = event
    if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
      emit('reorder', oldIndex, newIndex)
    }
  },
})

function isBlockCompleted(index: number): boolean {
  return completedBlocks.includes(index)
}
</script>

<template>
  <div class="flex flex-col gap-1">
    <div ref="sortableContainer" class="flex flex-col">
      <WorkoutBlockPlaylistItem
        v-for="(block, index) in blocksList"
        :key="block.id"
        :block="block"
        :index="index"
        :is-selected="index === selectedIndex"
        :is-completed="isBlockCompleted(index)"
        :show-connector="index < blocksList.length - 1"
        :disabled="disabled"
        @select="emit('select', index)"
        @edit="emit('edit', index)"
        @remove="emit('remove', index)"
      />
    </div>

    <!-- Add Block Button -->
    <Button
      v-if="!disabled"
      variant="outline"
      class="w-full h-14 border-dashed mt-2"
      @click="emit('add-block')"
    >
      <Plus class="w-5 h-5 mr-2" />
      {{ t('workouts.builder.playlist.addBlock') }}
    </Button>
  </div>
</template>
