<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import SegmentedControl from '@/components/SegmentedControl.vue'

const { t } = useI18n()

export type EmomConfigModel = {
  minutes: number
  rotation: 'each-minute' | 'full-round'
}

const model = defineModel<EmomConfigModel>({ required: true })

const presets = [8, 10, 12, 15, 20] as const

const rotationOptions = computed(() => [
  { value: 'full-round' as const, label: t('dialogs.emomConfig.fullRound') },
  { value: 'each-minute' as const, label: t('dialogs.emomConfig.onePerMinute') },
])
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-2">
      <Label>{{ t('dialogs.amrapConfig.duration') }}</Label>
      <div class="flex gap-2">
        <Button
          v-for="mins in presets"
          :key="mins"
          :variant="model.minutes === mins ? 'default' : 'outline'"
          size="sm"
          @click="model.minutes = mins"
        >
          {{ mins }}
        </Button>
      </div>
      <Input v-model.number="model.minutes" type="number" min="1" max="60" class="mt-2" />
    </div>

    <div class="space-y-2">
      <Label>{{ t('dialogs.emomConfig.rotation') }}</Label>
      <SegmentedControl v-model="model.rotation" :options="rotationOptions" />
    </div>
  </div>
</template>
