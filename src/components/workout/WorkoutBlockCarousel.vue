<script setup lang="ts">
import { Plus, X } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import { useSortable } from '@vueuse/integrations/useSortable'
import { useTemplateRef } from 'vue'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { WorkoutBlock } from '@/types/blocks'
import { getBlockShortName, getBlockThumbnail, isStrengthBlock } from '@/types/blocks'

type Props = {
  blocks: ReadonlyArray<WorkoutBlock>
  selectedIndex: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  select: [index: number]
  remove: [index: number]
  reorder: [fromIndex: number, toIndex: number]
  'add-block': []
}>()

const sortableContainer = useTemplateRef<HTMLElement>('sortableContainer')

// Create a mutable shallow copy for sortable to work with
const blocksList = ref([...props.blocks])

watch(
  () => props.blocks,
  (newBlocks) => {
    blocksList.value = [...newBlocks]
  },
)

useSortable(sortableContainer, blocksList, {
  animation: 150,
  ghostClass: 'opacity-50',
  onEnd: (event) => {
    const { oldIndex, newIndex } = event
    if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
      emit('reorder', oldIndex, newIndex)
    }
  },
})

function getBlockVariant(block: WorkoutBlock, index: number): 'default' | 'secondary' {
  return index === props.selectedIndex ? 'default' : 'secondary'
}

function getBlockRingClass(index: number): string {
  return index === props.selectedIndex ? 'ring-2 ring-primary' : ''
}
</script>

<template>
  <div class="px-4 pt-4 pb-2">
    <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <div ref="sortableContainer" class="flex gap-2">
        <div v-for="(block, index) in blocksList" :key="block.id" class="relative flex-shrink-0">
          <Button
            :variant="getBlockVariant(block, index)"
            :aria-pressed="index === selectedIndex"
            :class="
              cn(
                'h-[72px] w-[72px] rounded-xl flex flex-col items-center justify-center relative touch-manipulation p-1',
                getBlockRingClass(index),
                !isStrengthBlock(block) && 'border-2 border-dashed border-primary/30',
              )
            "
            :title="isStrengthBlock(block) ? block.name : block.kind.toUpperCase()"
            @click="emit('select', index)"
          >
            <span class="text-[28px] leading-none">{{ getBlockThumbnail(block) }}</span>
            <span class="text-[10px] font-medium mt-1 text-center line-clamp-1 px-1">
              {{ getBlockShortName(block) }}
            </span>
          </Button>

          <!-- Remove button - hover only -->
          <Button
            v-if="blocksList.length > 1"
            variant="destructive"
            size="icon-sm"
            class="absolute -top-2 -right-2 opacity-0 hover:opacity-100 transition-opacity"
            @click.stop="emit('remove', index)"
          >
            <X class="w-3 h-3" />
          </Button>
        </div>
      </div>

      <!-- Add Block Button -->
      <Button
        variant="outline"
        aria-label="Add block"
        class="flex-shrink-0 h-[72px] w-[72px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center touch-manipulation p-0"
        @click="emit('add-block')"
      >
        <Plus class="w-5 h-5" />
      </Button>
    </div>
  </div>
</template>
