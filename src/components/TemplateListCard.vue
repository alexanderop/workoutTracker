<script setup lang="ts">
import { Card } from '@/components/ui/card'

type Props = {
  template: {
    id: string
    name: string
    lastUsedAt: number | null
    usageCount?: number
  }
  formatDate: (timestamp: number | null) => string
}

const { template, formatDate } = defineProps<Props>()
const emit = defineEmits<{
  click: [id: string]
}>()

function handleActivationKey(event: KeyboardEvent): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    emit('click', template.id)
  }
}
</script>

<template>
  <Card
    role="button"
    tabindex="0"
    class="cursor-pointer p-4 transition-colors hover:bg-accent"
    @click="emit('click', template.id)"
    @keydown="handleActivationKey"
  >
    <div class="flex items-center justify-between">
      <div>
        <div class="font-medium">{{ template.name }}</div>
        <div class="mt-1 text-xs text-muted-foreground">
          {{ formatDate(template.lastUsedAt) }}
        </div>
      </div>
      <div class="text-sm text-muted-foreground">›</div>
    </div>
  </Card>
</template>
