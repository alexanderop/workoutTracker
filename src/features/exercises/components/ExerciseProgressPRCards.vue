<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Dumbbell, Gauge, TrendingUp } from 'lucide-vue-next'
import type { PersonalRecords } from '@/db/schema'

const { t } = useI18n()

const { personalRecords } = defineProps<{
  personalRecords: PersonalRecords
}>()

type PRCard = {
  id: string
  icon: typeof Dumbbell
  label: string
  value: string
  subtitle: string
  accentClass: string
}

const prCards = computed<Array<PRCard>>(() => {
  const cards: Array<PRCard> = []
  const { maxWeight, estimated1RM, maxVolume } = personalRecords

  if (maxWeight) {
    cards.push({
      id: 'max-weight',
      icon: Dumbbell,
      label: t('exercises.progress.pr.maxWeight'),
      value: `${maxWeight.kg} kg`,
      subtitle: t('exercises.progress.pr.reps', { count: maxWeight.reps }),
      accentClass: 'border-l-amber-500',
    })
  }

  if (estimated1RM) {
    cards.push({
      id: 'e1rm',
      icon: Gauge,
      label: t('exercises.progress.pr.estimated1RM'),
      value: `${Math.round(estimated1RM.kg)} kg`,
      subtitle: t('exercises.progress.pr.fromReps', { count: estimated1RM.fromReps }),
      accentClass: 'border-l-emerald-500',
    })
  }

  if (maxVolume) {
    const volumeKg = maxVolume.volume >= 1000
      ? `${(maxVolume.volume / 1000).toFixed(1)}t`
      : `${maxVolume.volume} kg`
    cards.push({
      id: 'volume',
      icon: TrendingUp,
      label: t('exercises.progress.pr.maxVolume'),
      value: volumeKg,
      subtitle: t('exercises.progress.pr.perSession'),
      accentClass: 'border-l-sky-500',
    })
  }

  return cards
})
</script>

<template>
  <div
    class="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 scrollbar-hide"
  >
    <div
      v-for="card in prCards"
      :key="card.id"
      class="min-w-[140px] flex-shrink-0 rounded-xl p-4 snap-start bg-card/80 backdrop-blur-sm border border-border/50 border-l-4"
      :class="card.accentClass"
    >
      <!-- Icon & Label -->
      <div class="flex items-center gap-1.5 mb-2">
        <component :is="card.icon" aria-hidden="true" class="size-3.5 text-muted-foreground" />
        <span class="text-xs text-muted-foreground font-medium">{{ card.label }}</span>
      </div>

      <!-- Value -->
      <div class="text-2xl font-bold tabular-nums">
        {{ card.value }}
      </div>

      <!-- Subtitle -->
      <div class="text-sm text-muted-foreground mt-0.5">
        {{ card.subtitle }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide {
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
