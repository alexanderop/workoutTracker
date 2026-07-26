<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ChevronRight } from '@lucide/vue'
import { Card } from '@/components/ui/card'

type Properties = {
  template: {
    id: string
    name: string
    blocks: ReadonlyArray<unknown>
    lastUsedAt: number | null
  }
  formatDate: (timestamp: number | null) => string
}

const { template, formatDate } = defineProps<Properties>()
const emit = defineEmits<{
  click: [id: string]
}>()
const { t } = useI18n()

function handleActivationKey(event: KeyboardEvent): void {
  if (!(event.key === 'Enter' || event.key === ' ')) {
    return
  }

  event.preventDefault()
  emit('click', template.id)
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
        <div class="text-sm text-muted-foreground">
          {{ t('workouts.builder.blockCount', { count: template.blocks.length }) }}
        </div>
        <div class="mt-1 text-xs text-muted-foreground">
          {{ formatDate(template.lastUsedAt) }}
        </div>
      </div>
      <ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </div>
  </Card>
</template>
