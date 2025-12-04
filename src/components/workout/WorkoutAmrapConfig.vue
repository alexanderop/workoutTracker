<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const { t } = useI18n()

export type AmrapConfigModel = {
  durationMinutes: number
}

const model = defineModel<AmrapConfigModel>({ required: true })

const presets = [8, 10, 12, 15, 20] as const
</script>

<template>
  <div class="space-y-2">
    <Label>{{ t('dialogs.amrapConfig.duration') }}</Label>
    <div class="flex gap-2">
      <Button
        v-for="mins in presets"
        :key="mins"
        :variant="model.durationMinutes === mins ? 'default' : 'outline'"
        size="sm"
        @click="model.durationMinutes = mins"
      >
        {{ mins }}
      </Button>
    </div>
    <Input v-model.number="model.durationMinutes" type="number" min="1" max="60" class="mt-2" />
  </div>
</template>
