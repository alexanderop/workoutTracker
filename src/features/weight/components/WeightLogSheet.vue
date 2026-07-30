<script setup lang="ts">
import { ChevronDown, Trash2, X } from '@lucide/vue'
import { format } from 'date-fns'
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useNumberLocale } from '@/composables/useNumberLocale'
import { useTouchDevice } from '@/composables/useTouchDevice'
import { useWeightDisplay } from '@/composables/useWeightDisplay'
import { getCurrentLocale, getDateLocale } from '@/lib/dateLocale'
import { useToastStore } from '@/stores/toast'
import { useWeightEntries } from '../composables/useWeightEntries'
import { useWeightLogSheet } from '../composables/useWeightLogSheet'
import { useWeightOutlierConfirm } from '../composables/useWeightOutlierConfirm'
import WeightLogCalendar from './WeightLogCalendar.vue'

const { initialDay } = defineProps<{ initialDay?: number }>()
const open = defineModel<boolean>('open', { required: true })

const { t } = useI18n()
const { showToast } = useToastStore()
const { entries, upsertEntry, deleteEntry } = useWeightEntries()
const {
  view,
  selectedDay,
  todayStart,
  existingEntry,
  openFor,
  openCalendar,
  closeCalendar,
  goToToday,
  selectDay,
  showPreviousMonth,
  showNextMonth,
} = useWeightLogSheet({ entries: () => entries.value })
const { unitLabel, toDisplayValue, toStorageValue } = useWeightDisplay()
const { parseNumber } = useNumberLocale()
const { isTouchDevice } = useTouchDevice()

const weightInput = ref('')
const bodyFatInput = ref('')
const weightInputEl = useTemplateRef<HTMLInputElement>('weightInputEl')

const dateLabel = computed(() =>
  format(new Date(selectedDay.value), 'P', { locale: getDateLocale(getCurrentLocale()) }),
)

const parsedWeightKg = computed(() => {
  const displayValue = parseNumber(weightInput.value)
  if (displayValue === undefined) return undefined
  return toStorageValue(displayValue)
})

// Bounded to the range the backup validator accepts (0-100), so a saved
// entry can never make the user's own export fail re-import.
const bodyFatValid = computed(() => {
  if (bodyFatInput.value.trim() === '') return true
  const parsed = parseNumber(bodyFatInput.value)
  return parsed !== undefined && parsed >= 0 && parsed <= 100
})

const canSave = computed(() => {
  const weightKg = parsedWeightKg.value
  return weightKg !== undefined && weightKg > 0 && bodyFatValid.value
})

async function saveEntry(weightKg: number): Promise<void> {
  // Read the sibling field and the selected day from the component's own
  // state at save time, rather than threading them through
  // useWeightOutlierConfirm's `save(weightKg)` signature.
  const bodyFatPct = parseNumber(bodyFatInput.value)
  const saved = await upsertEntry({ day: selectedDay.value, weightKg, bodyFatPct })
  if (!saved) {
    showToast(t('weight.saveError'))
    return
  }
  showToast(t('weight.quickLog.saved'))
  open.value = false
}

const {
  pendingWeightKg,
  pendingConfirmMessage,
  requestSave,
  confirmPendingSave,
  cancelPendingSave,
  reset,
} = useWeightOutlierConfirm({ entries: () => entries.value, save: saveEntry })

async function handleSave(): Promise<void> {
  const weightKg = parsedWeightKg.value
  if (weightKg === undefined || weightKg <= 0) return
  await requestSave(weightKg)
}

async function handleDelete(): Promise<void> {
  const entry = existingEntry.value
  if (!entry) return
  const deleted = await deleteEntry(entry.id)
  if (!deleted) {
    showToast(t('weight.sheet.deleteError'))
    return
  }
  showToast(t('weight.sheet.deleted'))
  open.value = false
}

// `immediate` is mandatory: this component is mounted lazily with `open`
// already `true` on first use, so a plain watcher would miss that opening.
watch(
  open,
  (isOpen) => {
    if (!isOpen) return
    openFor(initialDay)
    reset()
  },
  { immediate: true },
)

// Re-loads the form whenever the selected date changes -- including the
// initial load -- so switching dates always reflects that date's entry (or
// clears the form when there isn't one).
watch(
  [existingEntry, selectedDay],
  ([entry]) => {
    if (entry) {
      const displayWeight = toDisplayValue(entry.weight)
      weightInput.value = displayWeight === undefined ? '' : String(displayWeight)
      bodyFatInput.value = entry.bodyFatPct === undefined ? '' : String(entry.bodyFatPct)
      return
    }
    bodyFatInput.value = ''
    const latest = entries.value[0]
    const displayWeight = latest ? toDisplayValue(latest.weight) : undefined
    weightInput.value = displayWeight === undefined ? '' : String(displayWeight)
  },
  { immediate: true },
)

// Do not auto-open the keyboard: MobileDialogContent already prevents
// reka-ui's default autofocus on touch devices. On non-touch devices there is
// no keyboard to race, so focus the weight input directly here.
function handleOpenAutoFocus(event: Event): void {
  if (isTouchDevice.value) return
  event.preventDefault()
  weightInputEl.value?.focus({ preventScroll: true })
}
</script>

<template>
  <Dialog v-model:open="open">
    <MobileDialogContent :show-close-button="false" @open-auto-focus="handleOpenAutoFocus">
      <DialogHeader class="sr-only">
        <DialogTitle>{{ t('weight.sheet.title') }}</DialogTitle>
        <DialogDescription>{{ t('weight.sheet.description') }}</DialogDescription>
      </DialogHeader>

      <div class="flex shrink-0 items-center justify-between border-b pb-3">
        <button
          type="button"
          class="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
          :aria-label="t('common.buttons.close')"
          @click="open = false"
        >
          <X class="size-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          class="flex flex-col items-center gap-0.5"
          :aria-label="t('weight.sheet.changeDate')"
          @click="openCalendar"
        >
          <span class="flex items-center gap-1 text-sm font-semibold">
            {{ dateLabel }}
            <ChevronDown class="size-4" aria-hidden="true" />
          </span>
          <span class="text-xs text-muted-foreground">{{ t('weight.sheet.subtitle') }}</span>
        </button>

        <Button
          variant="ghost"
          size="icon"
          :aria-label="t('weight.sheet.deleteEntry')"
          :disabled="!existingEntry"
          @click="handleDelete"
        >
          <Trash2 class="size-4" aria-hidden="true" />
        </Button>
      </div>

      <div
        v-if="view.kind === 'form'"
        class="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain py-4"
      >
        <div class="space-y-1.5">
          <Label for="weight-log-weight">{{ t('weight.sheet.weightLabel') }}</Label>
          <div class="relative">
            <input
              id="weight-log-weight"
              ref="weightInputEl"
              v-model="weightInput"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              class="w-full rounded-lg border border-input bg-background px-3 py-3 text-base font-bold text-foreground sm:text-sm"
            />
            <span
              class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground"
            >
              {{ unitLabel }}
            </span>
          </div>
        </div>

        <div class="w-32 space-y-1.5">
          <Label for="weight-log-body-fat" class="text-xs">{{
            t('weight.sheet.bodyFatLabel')
          }}</Label>
          <div class="relative">
            <input
              id="weight-log-body-fat"
              v-model="bodyFatInput"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              class="w-full rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground sm:text-sm"
            />
            <span
              class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
            >
              %
            </span>
          </div>
        </div>

        <div
          v-if="pendingWeightKg !== null"
          role="alert"
          class="space-y-3 rounded-lg border border-warning/50 bg-warning/10 p-3 text-sm"
        >
          <p>{{ pendingConfirmMessage }}</p>
          <div class="flex justify-end gap-2">
            <Button variant="outline" size="sm" @click="cancelPendingSave">
              {{ t('weight.outlierConfirm.cancel') }}
            </Button>
            <Button size="sm" @click="confirmPendingSave">
              {{ t('weight.outlierConfirm.confirm') }}
            </Button>
          </div>
        </div>

        <Button class="w-full" :disabled="!canSave" @click="handleSave">
          {{ t('weight.save') }}
        </Button>
      </div>

      <WeightLogCalendar
        v-else-if="view.kind === 'calendar'"
        :selected-day="selectedDay"
        :visible-month="view.visibleMonth"
        :max-day="todayStart"
        @select="selectDay"
        @previous-month="showPreviousMonth"
        @next-month="showNextMonth"
        @go-back="closeCalendar"
        @go-to-today="goToToday"
      />
    </MobileDialogContent>
  </Dialog>
</template>
