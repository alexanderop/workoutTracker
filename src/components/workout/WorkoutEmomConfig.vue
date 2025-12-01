<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type EmomConfigModel = {
  minutes: number
  rotation: 'each-minute' | 'full-round'
}

const model = defineModel<EmomConfigModel>({ required: true })

const presets = [8, 10, 12, 15, 20] as const
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-2">
      <Label>Duration (minutes)</Label>
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
      <Label>Exercise Rotation</Label>
      <Select v-model="model.rotation">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="full-round">Full round each minute</SelectItem>
          <SelectItem value="each-minute">One exercise per minute</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
</template>
