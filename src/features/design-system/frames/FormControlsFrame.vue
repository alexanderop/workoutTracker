<script setup lang="ts">
/**
 * Live form primitives — these are interactive on the canvas, which is the
 * point: you can feel the hit areas before deciding a layout works.
 */
import { ref } from 'vue'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'

const exercise = ref('Barbell Bench Press')
const weight = ref('80')
const warmup = ref(false)
const restTimer = ref(true)
const rpe = ref([8])
const unit = ref('kg')
</script>

<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -- design reference surface, not product copy -->
  <div class="space-y-6">
    <section class="space-y-3">
      <h3 class="text-sm font-semibold">Text input</h3>
      <div class="space-y-1.5">
        <Label for="ds-exercise">Exercise</Label>
        <Input id="ds-exercise" v-model="exercise" />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-1.5">
          <Label for="ds-weight">Weight</Label>
          <Input id="ds-weight" v-model="weight" inputmode="decimal" class="tabular-nums" />
        </div>
        <div class="space-y-1.5">
          <Label for="ds-unit">Unit</Label>
          <NativeSelect id="ds-unit" v-model="unit">
            <NativeSelectOption value="kg">kg</NativeSelectOption>
            <NativeSelectOption value="lb">lb</NativeSelectOption>
          </NativeSelect>
        </div>
      </div>
      <div class="space-y-1.5">
        <Label for="ds-invalid">Invalid state</Label>
        <Input id="ds-invalid" model-value="-5" aria-invalid="true" />
        <p class="text-xs text-destructive">Weight must be positive.</p>
      </div>
      <div class="space-y-1.5">
        <Label for="ds-disabled">Disabled</Label>
        <Input id="ds-disabled" model-value="Locked" disabled />
      </div>
    </section>

    <section class="space-y-3">
      <h3 class="text-sm font-semibold">Toggles</h3>
      <div class="flex items-center gap-2">
        <Checkbox id="ds-warmup" v-model="warmup" />
        <Label for="ds-warmup">Warm-up set</Label>
      </div>
      <div class="flex items-center justify-between">
        <Label for="ds-rest">Auto-start rest timer</Label>
        <Switch id="ds-rest" v-model="restTimer" />
      </div>
    </section>

    <section class="space-y-2">
      <h3 class="text-sm font-semibold">Slider</h3>
      <div class="flex items-center gap-3">
        <Slider v-model="rpe" :min="6" :max="10" :step="0.5" class="flex-1" />
        <span class="w-8 text-right text-sm font-medium tabular-nums">{{ rpe[0] }}</span>
      </div>
      <p class="text-xs text-muted-foreground">RPE — coarse steps beat precision on a phone.</p>
    </section>
  </div>
</template>
