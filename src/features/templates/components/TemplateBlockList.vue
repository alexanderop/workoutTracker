<script setup lang="ts">
import { ref, watch, useTemplateRef } from 'vue'
import { useSortable } from '@vueuse/integrations/useSortable'
import type { DbTemplateBlock } from '@/db/schema'
import TemplateBlockItem from './TemplateBlockItem.vue'

type Properties = {
  blocks: ReadonlyArray<DbTemplateBlock>
}

type Emits = {
  'update:blocks': [blocks: ReadonlyArray<DbTemplateBlock>]
  'remove-block': [index: number]
  reorder: [fromIndex: number, toIndex: number]
}

const { blocks } = defineProps<Properties>()
const emit = defineEmits<Emits>()

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
  onEnd: (event) => {
    const { oldIndex, newIndex } = event
    if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
      emit('reorder', oldIndex, newIndex)
    }
  },
})

function handleSetCountChange(index: number, count: number): void {
  const block = blocks[index]
  if (!block || block.kind !== 'strength') return

  const updated = blocks.map((b, index_) =>
    index_ === index && b.kind === 'strength' ? { ...b, defaultSetCount: count } : b,
  )
  emit('update:blocks', updated)
}

function handleRemove(index: number): void {
  emit('remove-block', index)
}
</script>

<template>
  <ul ref="sortableContainer" role="list" class="space-y-2">
    <li v-for="(block, index) in blocksList" :key="index">
      <TemplateBlockItem
        :block="block"
        @update:set-count="(count) => handleSetCountChange(index, count)"
        @remove="() => handleRemove(index)"
      />
    </li>
  </ul>
</template>
