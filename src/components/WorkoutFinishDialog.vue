<script setup lang="ts">
import { computed, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { TriangleAlert } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import DialogActions from '@/components/DialogActions.vue'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { getDefaultWorkoutName } from '@/lib/workoutName'

const LONG_DURATION_THRESHOLD_MINUTES = 180 // 3 hours

const { t } = useI18n()

const open = defineModel<boolean>('open', { required: true })
const workoutName = defineModel<string>('workoutName', { default: '' })
const durationMinutes = defineModel<number | ''>('durationMinutes', { default: 0 })

const emit = defineEmits<{
  confirm: [name: string, durationSeconds: number]
  cancel: []
}>()

const nameInputId = useId()
const durationInputId = useId()

const isLongDuration = computed(() => {
  const value = Number(durationMinutes.value)
  return !Number.isNaN(value) && value > LONG_DURATION_THRESHOLD_MINUTES
})

function handleCancel() {
  emit('cancel')
  open.value = false
}

function handleConfirm() {
  const finalName = workoutName.value.trim() || getDefaultWorkoutName()
  const minutes = Number(durationMinutes.value)
  const durationSeconds = Number.isNaN(minutes) ? 0 : Math.round(minutes * 60)
  emit('confirm', finalName, durationSeconds)
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <MobileDialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('dialogs.finish.title') }}</DialogTitle>
        <DialogDescription>
          {{ t('dialogs.finish.description') }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div class="space-y-2">
          <Label :for="nameInputId">{{ t('dialogs.finish.workoutName') }}</Label>
          <Input
            :id="nameInputId"
            v-model="workoutName"
            :placeholder="getDefaultWorkoutName()"
            :aria-label="t('dialogs.finish.workoutName')"
          />
        </div>

        <div class="space-y-2">
          <Label :for="durationInputId">{{ t('dialogs.finish.duration') }}</Label>
          <div class="relative">
            <Input
              :id="durationInputId"
              v-model.number="durationMinutes"
              type="number"
              min="0"
              :class="{ 'border-orange-500 text-orange-600': isLongDuration }"
              :aria-label="t('dialogs.finish.duration')"
            />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {{ t('common.units.minutes') }}
            </span>
          </div>
          <p
            v-if="isLongDuration"
            class="flex items-center gap-1.5 text-sm text-orange-600"
          >
            <TriangleAlert class="size-4" />
            {{ t('dialogs.finish.durationWarning') }}
          </p>
        </div>
      </div>

      <DialogActions v-slot="{ buttonClass }">
        <Button variant="outline" :class="buttonClass" @click="handleCancel">
          {{ t('common.buttons.cancel') }}
        </Button>
        <Button :class="buttonClass" @click="handleConfirm">
          {{ t('dialogs.finish.finishButton') }}
        </Button>
      </DialogActions>
    </MobileDialogContent>
  </Dialog>
</template>
