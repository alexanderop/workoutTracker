<script setup lang="ts">
import type { DbTemplateBlock } from '@/db/schema'
import TemplateBlockItem from './TemplateBlockItem.vue'

type Properties = {
  blocks: ReadonlyArray<DbTemplateBlock>
}

type Emits = {
  'update:blocks': [blocks: ReadonlyArray<DbTemplateBlock>]
  'remove-block': [index: number]
}

const { blocks } = defineProps<Properties>()
const emit = defineEmits<Emits>()

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

function handleMoveUp(index: number): void {
  if (index <= 0) return

  const updated = [...blocks]
  const temporary = updated[index - 1]
  const current = updated[index]
  if (temporary && current) {
    updated[index - 1] = current
    updated[index] = temporary
    emit('update:blocks', updated)
  }
}

function handleMoveDown(index: number): void {
  if (index < 0 || index >= blocks.length - 1) return

  const updated = [...blocks]
  const temporary = updated[index]
  const next = updated[index + 1]
  if (temporary && next) {
    updated[index] = next
    updated[index + 1] = temporary
    emit('update:blocks', updated)
  }
}
</script>

<template>
  <ul role="list" class="space-y-2">
    <li v-for="(block, index) in blocks" :key="index">
      <TemplateBlockItem
        :block="block"
        :movement="{ canMoveUp: index > 0, canMoveDown: index < blocks.length - 1 }"
        @update:set-count="(count) => handleSetCountChange(index, count)"
        @remove="() => handleRemove(index)"
        @move-up="() => handleMoveUp(index)"
        @move-down="() => handleMoveDown(index)"
      />
    </li>
  </ul>
</template>
