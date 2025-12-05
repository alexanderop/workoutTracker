<script setup lang="ts">
import { Settings2 } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import TimerPresetButton from './TimerPresetButton.vue'

const { t } = useI18n()

type Preset = {
  label: string
  description: string
  [key: string]: unknown
}

defineProps<{
  presets: Array<Preset>
  colorClass: string
}>()

const emit = defineEmits<{
  select: [preset: Preset]
  'show-custom': []
}>()
</script>

<template>
  <div class="space-y-3">
    <TimerPresetButton
      v-for="preset in presets"
      :key="preset.label"
      :label="preset.label"
      :description="preset.description"
      :color-class="colorClass"
      @select="emit('select', preset)"
    />

    <!-- Custom option -->
    <button
      class="w-full p-4 rounded-lg border-2 border-dashed hover:border-muted-foreground transition-colors text-left"
      @click="emit('show-custom')"
    >
      <div class="flex items-center gap-3">
        <Settings2 class="w-5 h-5 text-muted-foreground" />
        <div>
          <div class="font-semibold text-foreground">{{ t('timers.presets.custom') }}</div>
          <div class="text-sm text-muted-foreground">{{ t('timers.presets.configureOwn') }}</div>
        </div>
      </div>
    </button>
  </div>
</template>
