<script setup lang="ts">
import { ref } from 'vue'
import { Play } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const { t } = useI18n()

type TimerType = 'amrap' | 'emom' | 'tabata' | 'fortime'

const { timerType, colorClass } = defineProps<{
  timerType: TimerType
  colorClass: string
}>()

const emit = defineEmits<{
  back: []
  submit: [config: Record<string, number | boolean | null>]
}>()

// Form state per timer type
const customAmrap = ref({ minutes: 10 })
const customEmom = ref({ minutes: 10 })
const customTabata = ref({ rounds: 8, workSeconds: 20, restSeconds: 10 })
const customForTime = ref({ minutes: 10, hasCap: true })

function handleSubmit() {
  switch (timerType) {
    case 'amrap': {
      emit('submit', { durationSeconds: customAmrap.value.minutes * 60 })
      break
    }
    case 'emom': {
      emit('submit', { minutes: customEmom.value.minutes })
      break
    }
    case 'tabata': {
      emit('submit', { ...customTabata.value })
      break
    }
    case 'fortime': {
      emit('submit', {
        timeCapSeconds: customForTime.value.hasCap ? customForTime.value.minutes * 60 : null,
      })
      break
    }
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- AMRAP custom -->
    <div v-if="timerType === 'amrap'" class="space-y-4">
      <div class="space-y-2">
        <Label for="amrap-minutes">{{ t('timers.form.durationMinutes') }}</Label>
        <Input
          id="amrap-minutes"
          v-model.number="customAmrap.minutes"
          type="number"
          min="1"
          max="60"
        />
      </div>
    </div>

    <!-- EMOM custom -->
    <div v-if="timerType === 'emom'" class="space-y-4">
      <div class="space-y-2">
        <Label for="emom-minutes">{{ t('timers.form.durationMinutes') }}</Label>
        <Input
          id="emom-minutes"
          v-model.number="customEmom.minutes"
          type="number"
          min="1"
          max="60"
        />
      </div>
    </div>

    <!-- Tabata custom -->
    <div v-if="timerType === 'tabata'" class="space-y-4">
      <div class="space-y-2">
        <Label for="tabata-rounds">{{ t('timers.form.rounds') }}</Label>
        <Input
          id="tabata-rounds"
          v-model.number="customTabata.rounds"
          type="number"
          min="1"
          max="20"
        />
      </div>
      <div class="space-y-2">
        <Label for="tabata-work">{{ t('timers.form.workSeconds') }}</Label>
        <Input
          id="tabata-work"
          v-model.number="customTabata.workSeconds"
          type="number"
          min="5"
          max="600"
        />
      </div>
      <div class="space-y-2">
        <Label for="tabata-rest">{{ t('timers.form.restSeconds') }}</Label>
        <Input
          id="tabata-rest"
          v-model.number="customTabata.restSeconds"
          type="number"
          min="5"
          max="600"
        />
      </div>
    </div>

    <!-- For Time custom -->
    <div v-if="timerType === 'fortime'" class="space-y-4">
      <div class="flex items-center gap-2">
        <input id="fortime-hascap" v-model="customForTime.hasCap" type="checkbox" class="rounded" />
        <Label for="fortime-hascap">{{ t('timers.form.enableTimeCap') }}</Label>
      </div>
      <div v-if="customForTime.hasCap" class="space-y-2">
        <Label for="fortime-minutes">{{ t('timers.form.timeCapMinutes') }}</Label>
        <Input
          id="fortime-minutes"
          v-model.number="customForTime.minutes"
          type="number"
          min="1"
          max="60"
        />
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-3 pt-4">
      <Button variant="outline" class="flex-1" @click="emit('back')">
        {{ t('timers.form.back') }}
      </Button>
      <Button class="flex-1" :class="colorClass" @click="handleSubmit">
        <Play class="icon-sm mr-2" />
        {{ t('timers.form.start') }}
      </Button>
    </div>
  </div>
</template>
