<script setup lang="ts">
import { computed } from 'vue'
import { Scale } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useWeightDisplay } from '@/composables/useWeightDisplay'
import { RouteNames } from '@/router'
import { useWeightEntries } from '../composables/useWeightEntries'

const { t } = useI18n()
const router = useRouter()
const { entries } = useWeightEntries()
const { formatWithUnit, toDisplayValue, unitLabel } = useWeightDisplay()

const current = computed(() => formatWithUnit(entries.value[0]?.weight, 1))
const change = computed(() => {
  const latest = entries.value[0]
  const previous = entries.value[1]
  if (!latest || !previous) return null
  const display = toDisplayValue(Math.abs(latest.weight - previous.weight))
  if (display === undefined) return null
  const sign = latest.weight > previous.weight ? '+' : '−'
  return `${sign}${display.toFixed(1)} ${unitLabel.value}`
})
</script>

<template>
  <button
    type="button"
    class="rounded-2xl border bg-card p-4 text-left shadow-sm transition-colors hover:bg-accent/40"
    @click="router.push({ name: RouteNames.Weight })"
  >
    <div class="flex items-center justify-between gap-2">
      <span class="flex size-9 items-center justify-center rounded-xl bg-primary/10">
        <Scale class="size-4 text-primary" aria-hidden="true" />
      </span>
      <span v-if="change" class="text-xs font-medium text-muted-foreground">{{ change }}</span>
    </div>
    <p class="mt-4 text-sm text-muted-foreground">{{ t('weight.title') }}</p>
    <p class="text-2xl font-bold">{{ current }}</p>
    <span class="mt-2 block text-xs font-semibold text-primary">{{
      t('weight.viewProgress')
    }}</span>
  </button>
</template>
