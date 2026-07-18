<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { AcceptableValue } from 'reka-ui'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/components/ui/number-field'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import DialogActions from '@/components/DialogActions.vue'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import {
  DEFAULT_HABIT_ACCENT,
  HABIT_ACCENTS,
  type DbHabit,
  type HabitAccent,
  type HabitKind,
  type HabitSchedule,
} from '@/db/schema'
import type { HabitFormData } from '../composables/useHabits'

/** Small, low-effort emoji picker -- keeps icon selection to a tap, per the Phase 2 brief. */
const ICON_PRESETS = ['💧', '🏃', '🧘', '📚', '🛌', '🥗', '🏋️', '✍️', '🚭', '🧹'] as const

const MIN_WEEKLY_TARGET = 1
const MAX_WEEKLY_TARGET = 7
const MIN_QUANTITY_TARGET = 1
const MAX_QUANTITY_TARGET = 9999

const { habit } = defineProps<{
  /** Present in edit mode; absent when creating a new habit. */
  habit?: DbHabit
}>()

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  save: [data: HabitFormData]
}>()

const { t } = useI18n()

const name = ref('')
const description = ref('')
// Input's v-model only accepts string | number, so empty string stands in
// for "no icon" here and is normalized to null on save.
const icon = ref('')
const accent = ref<HabitAccent>(DEFAULT_HABIT_ACCENT)
const scheduleType = ref<HabitSchedule['type']>('daily')
const targetDaysPerWeek = ref(3)
const kindType = ref<HabitKind['type']>('binary')
const quantityTarget = ref(1)
const quantityUnit = ref('')
const autoLink = ref(false)

const isEditMode = computed(() => habit !== undefined)

const DEFAULT_TARGET_DAYS_PER_WEEK = 3
const DEFAULT_QUANTITY_TARGET = 1

function seedScheduleFields(schedule: HabitSchedule | undefined) {
  scheduleType.value = schedule?.type ?? 'daily'
  targetDaysPerWeek.value =
    schedule?.type === 'weekly' ? schedule.targetDaysPerWeek : DEFAULT_TARGET_DAYS_PER_WEEK
}

function seedKindFields(kind: HabitKind | undefined) {
  kindType.value = kind?.type ?? 'binary'
  quantityTarget.value = kind?.type === 'quantity' ? kind.target : DEFAULT_QUANTITY_TARGET
  quantityUnit.value = kind?.type === 'quantity' ? kind.unit : ''
}

function seedIdentityFields(source: DbHabit | undefined) {
  name.value = source?.name ?? ''
  description.value = source?.description ?? ''
  icon.value = source?.icon ?? ''
  accent.value = source?.accent ?? DEFAULT_HABIT_ACCENT
}

function resetForm() {
  seedIdentityFields(habit)
  seedScheduleFields(habit?.schedule)
  seedKindFields(habit?.kind)
  autoLink.value = habit?.autoLink === 'completed-workout'
}

// Re-seed fields whenever the dialog opens, same pattern as NumericInputModal.
watch(open, (isOpen) => {
  if (isOpen) resetForm()
})

const nameError = computed(() =>
  name.value.trim().length === 0 ? t('habits.form.nameRequired') : null,
)

const weeklyTargetError = computed(() => {
  if (scheduleType.value !== 'weekly') return null
  if (targetDaysPerWeek.value < MIN_WEEKLY_TARGET || targetDaysPerWeek.value > MAX_WEEKLY_TARGET) {
    return t('habits.form.targetDaysPerWeekError')
  }
  return null
})

const quantityTargetError = computed(() => {
  if (kindType.value !== 'quantity') return null
  if (quantityTarget.value < MIN_QUANTITY_TARGET || quantityTarget.value > MAX_QUANTITY_TARGET) {
    return t('habits.form.targetError')
  }
  return null
})

const unitError = computed(() => {
  if (kindType.value !== 'quantity') return null
  return quantityUnit.value.trim().length === 0 ? t('habits.form.unitRequired') : null
})

const isValid = computed(
  () =>
    nameError.value === null &&
    weeklyTargetError.value === null &&
    quantityTargetError.value === null &&
    unitError.value === null,
)

function handleScheduleChange(value: AcceptableValue) {
  if (value === 'daily' || value === 'weekly') scheduleType.value = value
}

function handleKindChange(value: AcceptableValue) {
  if (value === 'binary' || value === 'quantity') kindType.value = value
}

function handleCancel() {
  open.value = false
}

/**
 * No `!isValid` guard here: the triggering button is already
 * `:disabled="!isValid"`, and disabled buttons never dispatch click events
 * in a real browser, so this can only ever fire while the form is valid.
 */
function handleSave() {
  const schedule: HabitSchedule =
    scheduleType.value === 'weekly'
      ? { type: 'weekly', targetDaysPerWeek: targetDaysPerWeek.value }
      : { type: 'daily' }

  const kind: HabitKind =
    kindType.value === 'quantity'
      ? { type: 'quantity', target: quantityTarget.value, unit: quantityUnit.value.trim() }
      : { type: 'binary' }

  emit('save', {
    name: name.value.trim(),
    description: description.value.trim() || null,
    icon: icon.value.trim().length > 0 ? icon.value.trim() : null,
    accent: accent.value,
    schedule,
    kind,
    autoLink: autoLink.value ? 'completed-workout' : null,
  })

  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <MobileDialogContent>
      <DialogHeader>
        <DialogTitle>{{
          isEditMode ? t('habits.form.editTitle') : t('habits.form.createTitle')
        }}</DialogTitle>
        <DialogDescription class="sr-only">
          {{ isEditMode ? t('habits.form.editTitle') : t('habits.form.createTitle') }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <!-- Name -->
        <div class="space-y-1.5">
          <Label for="habit-name">{{ t('habits.form.nameLabel') }}</Label>
          <Input
            id="habit-name"
            v-model="name"
            :placeholder="t('habits.form.namePlaceholder')"
            :aria-invalid="nameError !== null"
          />
          <p v-if="nameError" role="alert" class="text-sm text-destructive">{{ nameError }}</p>
        </div>

        <div class="space-y-1.5">
          <Label for="habit-description">{{ t('habits.form.descriptionLabel') }}</Label>
          <Input
            id="habit-description"
            v-model="description"
            :placeholder="t('habits.form.descriptionPlaceholder')"
            maxlength="120"
          />
        </div>

        <!-- Icon -->
        <div class="space-y-1.5">
          <Label for="habit-icon">{{ t('habits.form.iconLabel') }}</Label>
          <Input
            id="habit-icon"
            v-model="icon"
            :placeholder="t('habits.form.iconPlaceholder')"
            maxlength="4"
            class="w-20 text-center text-lg"
          />
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="preset in ICON_PRESETS"
              :key="preset"
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-md border text-lg transition-colors hover:bg-accent"
              :class="icon === preset && 'border-primary bg-accent'"
              @click="icon = preset"
            >
              {{ preset }}
            </button>
          </div>
        </div>

        <div class="space-y-1.5">
          <Label>{{ t('habits.form.accentLabel') }}</Label>
          <div class="flex flex-wrap gap-2" role="group" :aria-label="t('habits.form.accentLabel')">
            <button
              v-for="option in HABIT_ACCENTS"
              :key="option"
              type="button"
              class="habit-accent-swatch flex size-10 items-center justify-center rounded-full border-2 transition-transform"
              :class="accent === option ? 'border-foreground scale-110' : 'border-transparent'"
              :data-habit-accent="option"
              :aria-label="t(`habits.form.accents.${option}`)"
              :aria-pressed="accent === option"
              @click="accent = option"
            >
              <span v-if="accent === option" class="text-sm font-bold">✓</span>
            </button>
          </div>
        </div>

        <!-- Schedule -->
        <div class="space-y-1.5">
          <Label>{{ t('habits.form.scheduleLabel') }}</Label>
          <ToggleGroup
            type="single"
            :model-value="scheduleType"
            variant="outline"
            class="w-full [&_[data-state=on]]:bg-primary [&_[data-state=on]]:text-primary-foreground"
            @update:model-value="handleScheduleChange"
          >
            <ToggleGroupItem value="daily" class="flex-1 min-h-11">
              {{ t('habits.schedule.daily') }}
            </ToggleGroupItem>
            <ToggleGroupItem value="weekly" class="flex-1 min-h-11">
              {{ t('habits.schedule.weekly') }}
            </ToggleGroupItem>
          </ToggleGroup>

          <div v-if="scheduleType === 'weekly'" class="space-y-1.5 pt-1">
            <Label for="habit-target-days">{{ t('habits.form.targetDaysPerWeekLabel') }}</Label>
            <NumberField
              id="habit-target-days"
              v-model="targetDaysPerWeek"
              :min="MIN_WEEKLY_TARGET"
              :max="MAX_WEEKLY_TARGET"
              :step="1"
            >
              <NumberFieldContent>
                <NumberFieldDecrement />
                <NumberFieldInput class="text-center" />
                <NumberFieldIncrement />
              </NumberFieldContent>
            </NumberField>
            <p v-if="weeklyTargetError" role="alert" class="text-sm text-destructive">
              {{ weeklyTargetError }}
            </p>
          </div>
        </div>

        <!-- Kind -->
        <div class="space-y-1.5">
          <Label>{{ t('habits.form.kindLabel') }}</Label>
          <ToggleGroup
            type="single"
            :model-value="kindType"
            variant="outline"
            class="w-full [&_[data-state=on]]:bg-primary [&_[data-state=on]]:text-primary-foreground"
            @update:model-value="handleKindChange"
          >
            <ToggleGroupItem value="binary" class="flex-1 min-h-11">
              {{ t('habits.kind.binary') }}
            </ToggleGroupItem>
            <ToggleGroupItem value="quantity" class="flex-1 min-h-11">
              {{ t('habits.kind.quantity') }}
            </ToggleGroupItem>
          </ToggleGroup>

          <template v-if="kindType === 'quantity'">
            <Label for="habit-target" class="block pt-1">{{ t('habits.form.targetLabel') }}</Label>
            <NumberField
              id="habit-target"
              v-model="quantityTarget"
              :min="MIN_QUANTITY_TARGET"
              :max="MAX_QUANTITY_TARGET"
              :step="1"
            >
              <NumberFieldContent>
                <NumberFieldDecrement />
                <NumberFieldInput class="text-center" />
                <NumberFieldIncrement />
              </NumberFieldContent>
            </NumberField>
            <p v-if="quantityTargetError" role="alert" class="text-sm text-destructive">
              {{ quantityTargetError }}
            </p>

            <Label for="habit-unit" class="block pt-1">{{ t('habits.form.unitLabel') }}</Label>
            <Input
              id="habit-unit"
              v-model="quantityUnit"
              :placeholder="t('habits.form.unitPlaceholder')"
              :aria-invalid="unitError !== null"
            />
            <p v-if="unitError" role="alert" class="text-sm text-destructive">{{ unitError }}</p>
          </template>
        </div>

        <!-- Auto-link -->
        <div v-if="kindType === 'binary'" class="flex items-center justify-between">
          <Label for="habit-autolink" class="cursor-pointer pr-4 text-base">
            {{ t('habits.form.autoLinkLabel') }}
            <span class="mt-1 block text-xs font-normal text-muted-foreground">
              {{ t('habits.form.autoLinkDescription') }}
            </span>
          </Label>
          <Switch id="habit-autolink" v-model="autoLink" />
        </div>
      </div>

      <DialogActions v-slot="{ buttonClass }">
        <Button variant="outline" :class="buttonClass" @click="handleCancel">
          {{ t('common.buttons.cancel') }}
        </Button>
        <Button :class="buttonClass" :disabled="!isValid" @click="handleSave">
          {{ t('habits.form.save') }}
        </Button>
      </DialogActions>
    </MobileDialogContent>
  </Dialog>
</template>
