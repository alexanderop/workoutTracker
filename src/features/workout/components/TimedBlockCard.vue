<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { DbEmomBlock, DbAmrapBlock, DbForTimeBlock, DbTabataBlock } from '@/blocks'

type TimedBlock = DbEmomBlock | DbAmrapBlock | DbForTimeBlock | DbTabataBlock

const { block } = defineProps<{
  block: TimedBlock
}>()

const { t } = useI18n()
</script>

<template>
  <div class="rounded-lg border bg-card p-4">
    <div class="font-semibold uppercase">{{ block.kind }}</div>
    <div v-if="block.result" class="mt-1 text-sm text-muted-foreground">
      <template v-if="block.kind === 'amrap'">
        {{ block.result.rounds }} {{ t('workouts.detail.rounds') }}
      </template>
      <template v-else-if="block.kind === 'fortime'">
        {{ block.result.completed ? t('workouts.detail.completed') : t('workouts.detail.capped') }}
      </template>
      <template v-else-if="block.kind === 'emom'">
        {{ t('workouts.detail.minutesCompleted', { minutes: block.result.completedMinutes }) }}
      </template>
    </div>
  </div>
</template>
