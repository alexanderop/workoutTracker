<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const { t } = useI18n()

export type TabataConfigModel = {
  rounds: number
  workSeconds: number
  restSeconds: number
}

const model = defineModel<TabataConfigModel>({ required: true })

const roundPresets = [6, 8, 10, 12] as const

const totalSeconds = computed(
  () => model.value.rounds * (model.value.workSeconds + model.value.restSeconds),
)
const totalMinutes = computed(() => Math.floor(totalSeconds.value / 60))
const totalRemainder = computed(() => String(totalSeconds.value % 60).padStart(2, '0'))
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-2">
      <Label>{{ t('workouts.builder.timedCard.rounds') }}</Label>
      <div class="flex gap-2">
        <Button
          v-for="r in roundPresets"
          :key="r"
          :variant="model.rounds === r ? 'default' : 'outline'"
          size="sm"
          @click="model.rounds = r"
        >
          {{ r }}
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div class="space-y-2">
        <Label>{{ t('dialogs.tabataConfig.work') }}</Label>
        <Input v-model.number="model.workSeconds" type="number" min="5" max="60" />
      </div>
      <div class="space-y-2">
        <Label>{{ t('dialogs.tabataConfig.rest') }}</Label>
        <Input v-model.number="model.restSeconds" type="number" min="5" max="60" />
      </div>
    </div>

    <div class="bg-secondary/50 rounded-lg p-3 text-center">
      <p class="text-sm text-muted-foreground">{{ t('dialogs.tabataConfig.totalTime') }}</p>
      <p class="text-xl font-bold font-mono">{{ totalMinutes }}:{{ totalRemainder }}</p>
    </div>
  </div>
</template>
