<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type ForTimeConfigModel = {
  hasCap: boolean
  capMinutes: number
}

const model = defineModel<ForTimeConfigModel>({ required: true })

const presets = [10, 12, 15, 20, 30] as const
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-3">
      <input
        id="has-cap"
        v-model="model.hasCap"
        type="checkbox"
        class="h-4 w-4 rounded border-gray-300"
      />
      <Label for="has-cap">Set a time cap</Label>
    </div>

    <div v-if="model.hasCap" class="space-y-2">
      <Label>Time Cap (minutes)</Label>
      <div class="flex gap-2">
        <Button
          v-for="mins in presets"
          :key="mins"
          :variant="model.capMinutes === mins ? 'default' : 'outline'"
          size="sm"
          @click="model.capMinutes = mins"
        >
          {{ mins }}
        </Button>
      </div>
      <Input v-model.number="model.capMinutes" type="number" min="1" max="60" class="mt-2" />
    </div>
  </div>
</template>
