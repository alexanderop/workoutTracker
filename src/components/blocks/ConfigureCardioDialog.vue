<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import DialogActions from '@/components/DialogActions.vue'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NumericInputModal } from '@/components/ui/numeric-input'
import { useTouchDevice } from '@/composables/useTouchDevice'
import { cn } from '@/lib/utils'
import type { CardioActivity, CardioConfig } from '@/types/blocks'
import { CARDIO_ACTIVITIES } from '@/types/blocks'

const { t } = useI18n()
const { isTouchDevice } = useTouchDevice()

type Emits = {
  confirm: [config: CardioConfig]
}

const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<Emits>()

const selectedActivity = ref<CardioActivity>('running')
const targetMinutes = ref<string>('30')
const targetDistance = ref<string>('')

// Numeric modal state
const durationModalOpen = ref(false)
const distanceModalOpen = ref(false)

// Numeric values for mobile modals
const durationValue = computed({
  get: () => Number.parseInt(targetMinutes.value, 10) || 0,
  set: (value: number) => {
    targetMinutes.value = String(value)
  },
})

const distanceValue = computed({
  get: () => Number.parseFloat(targetDistance.value) || 0,
  set: (value: number) => {
    targetDistance.value = value > 0 ? String(value) : ''
  },
})

const selectedActivityInfo = computed(() =>
  CARDIO_ACTIVITIES.find((a) => a.value === selectedActivity.value),
)

const canConfirm = computed(() => {
  const mins = Number.parseInt(targetMinutes.value, 10)
  return selectedActivity.value && (mins > 0 || Number.parseFloat(targetDistance.value) > 0)
})

watch(open, (isOpen) => {
  if (!isOpen) {
	return;
  }

  selectedActivity.value = 'running'
  targetMinutes.value = '30'
  targetDistance.value = ''
})

function handleConfirm() {
  const mins = Number.parseInt(targetMinutes.value, 10)
  const distributionKm = Number.parseFloat(targetDistance.value)

  const config: CardioConfig = {
    activity: selectedActivity.value,
    targetDurationSeconds: mins > 0 ? mins * 60 : null,
    targetDistanceMeters: distributionKm > 0 ? distributionKm * 1000 : null,
  }

  emit('confirm', config)
  open.value = false
}

function handleClose() {
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <MobileDialogContent
      class="max-w-md h-[100dvh] sm:h-auto sm:max-h-[85vh] flex flex-col rounded-t-none sm:rounded-lg"
    >
      <DialogHeader>
        <div class="flex items-center gap-2">
          <span class="text-2xl">{{ selectedActivityInfo?.icon ?? '🏃' }}</span>
          <DialogTitle>{{ t('dialogs.cardioConfig.title') }}</DialogTitle>
        </div>
        <DialogDescription>{{ t('dialogs.cardioConfig.description') }}</DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto space-y-6 py-4">
        <!-- Activity Selection -->
        <div class="space-y-3">
          <Label>{{ t('dialogs.cardioConfig.activity') }}</Label>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="activity in CARDIO_ACTIVITIES"
              :key="activity.value"
              type="button"
              :class="
                cn(
                  'flex flex-col items-center justify-center p-3 rounded-lg border text-sm transition-colors',
                  selectedActivity === activity.value
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500'
                    : 'border-border hover:border-muted-foreground/50',
                )
              "
              @click="selectedActivity = activity.value"
            >
              <span class="text-xl mb-1">{{ activity.icon }}</span>
              <span class="text-xs truncate w-full text-center">{{ activity.label }}</span>
            </button>
          </div>
        </div>

        <!-- Target Duration -->
        <div class="space-y-2">
          <Label for="target-duration">{{ t('dialogs.cardioConfig.targetDuration') }}</Label>
          <div class="flex items-center gap-2">
            <Input
              v-if="!isTouchDevice"
              id="target-duration"
              v-model="targetMinutes"
              type="number"
              inputmode="numeric"
              min="0"
              max="600"
              class="w-24"
            />
            <Button
              v-else
              variant="outline"
              class="w-24 justify-start font-mono"
              @click="durationModalOpen = true"
            >
              {{ durationValue || '0' }}
            </Button>
            <span class="text-sm text-muted-foreground">{{ t('common.units.minutes') }}</span>
          </div>
        </div>

        <!-- Target Distance (if activity supports it) -->
        <div v-if="selectedActivityInfo?.supportsDistance" class="space-y-2">
          <Label for="target-distance">
            {{ t('dialogs.cardioConfig.targetDistance') }}
            <span class="text-muted-foreground">({{ t('common.labels.optional') }})</span>
          </Label>
          <div class="flex items-center gap-2">
            <Input
              v-if="!isTouchDevice"
              id="target-distance"
              v-model="targetDistance"
              type="number"
              inputmode="decimal"
              step="0.1"
              min="0"
              class="w-24"
            />
            <Button
              v-else
              variant="outline"
              class="w-24 justify-start font-mono"
              @click="distanceModalOpen = true"
            >
              {{ distanceValue || '0' }}
            </Button>
            <span class="text-sm text-muted-foreground">
              {{ selectedActivityInfo?.distanceUnit === 'laps' ? t('common.units.laps') : t('common.units.km') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Numeric Input Modals for mobile -->
      <NumericInputModal
        v-model="durationValue"
        v-model:open="durationModalOpen"
        type="duration"
        :unit="t('common.units.minutes')"
      />
      <NumericInputModal
        v-model="distanceValue"
        v-model:open="distanceModalOpen"
        type="distance"
        :unit="selectedActivityInfo?.distanceUnit === 'laps' ? t('common.units.laps') : t('common.units.km')"
      />

      <DialogActions variant="inline" class="pt-4" v-slot="{ buttonClass }">
        <Button variant="outline" :class="buttonClass" @click="handleClose">
          {{ t('common.buttons.cancel') }}
        </Button>
        <Button :class="buttonClass" :disabled="!canConfirm" @click="handleConfirm">
          {{ t('dialogs.cardioConfig.addBlock') }}
        </Button>
      </DialogActions>
    </MobileDialogContent>
  </Dialog>
</template>
