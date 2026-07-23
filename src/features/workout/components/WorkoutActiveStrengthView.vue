<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { NumberField, NumberFieldInput } from '@/components/ui/number-field'
import { NumericInputModal, type InputType } from '@/components/ui/numeric-input'
import { Button } from '@/components/ui/button'
import { useWeightDisplay } from '@/composables/useWeightDisplay'
import { useTouchDevice } from '@/composables/useTouchDevice'
import { useNumberLocale } from '@/composables/useNumberLocale'
import { useExercisesStore } from '@/stores/exercises'
import { isSetReady, isSetReadyForDuration } from '@/features/workout/lib/workoutSetValidation'
import { calculate10RM } from '@/lib/workout-utils'
import { cn } from '@/lib/utils'
import type { StrengthBlock } from '@/types/blocks'
import type { Set } from '@/types/workout'
import { Check, Plus } from '@lucide/vue'
import SetContextMenu from './SetContextMenu.vue'

// Strength-specific input types (subset of InputType)
type StrengthInputType = Extract<InputType, 'weight' | 'reps' | 'rir' | 'duration'>

const { t } = useI18n()
const { isTouchDevice } = useTouchDevice()
const { intlLocale, formatNumber } = useNumberLocale()
const exercisesStore = useExercisesStore()

type Properties = {
  block: StrengthBlock
  activeSetIndex: number
}

const emit = defineEmits<{
  'update-set': [
    setId: number,
    field: 'kg' | 'reps' | 'rir' | 'duration',
    value: number | undefined,
  ]
  'toggle-complete': [set: Set]
  'add-set': []
  'delete-set': [setId: number]
  'duplicate-set': [setId: number]
  // Readiness of the active set, including not-yet-committed keystrokes. Lets
  // ancestors (e.g. the footer's "Complete Set" CTA) reflect readiness live
  // instead of lagging one blur behind -- see Finding 6, July 2026 UX review.
  'active-set-ready': [ready: boolean]
}>()

const { block, activeSetIndex } = defineProps<Properties>()

// Check if this is a duration-based exercise (isometric)
const isDurationBased = computed(() => {
  if (!block.exerciseDefinitionId) return false
  const exercise = exercisesStore.getExerciseById(block.exerciseDefinitionId)
  return exercise?.metrics === 'duration'
})

const { unitLabel, toDisplayValue, toStorageValue } = useWeightDisplay()

const weightLabel = computed(() => unitLabel.value.toUpperCase())

const tableAriaLabel = computed(() => t('common.aria.workoutSetsTable', { exercise: block.name }))

// Class generation functions (extracted to reduce computed complexity)
const baseInputClass =
  'border-0 shadow-none focus-visible:ring-1 focus-visible:ring-primary h-11 font-bold text-base tabular-nums rounded-lg text-center'

// Allow 2 decimal places for weight (micro plates like 0.25kg)
const weightFormatOptions = {
  maximumFractionDigits: 2,
  useGrouping: false,
}

function getRowClass(isActive: boolean, isCompleted: boolean) {
  return cn(
    'border-none transition-all duration-200 hover:bg-transparent',
    isActive && 'bg-primary/10',
    isCompleted && 'opacity-50',
  )
}

function getInputClass(isActive: boolean) {
  return cn(baseInputClass, isActive ? 'bg-secondary' : 'bg-transparent')
}

function getRepsInputClass(isActive: boolean) {
  return cn(baseInputClass, isActive ? 'bg-secondary text-primary' : 'bg-transparent')
}

function getRirInputClass(isActive: boolean) {
  const base =
    'border-0 shadow-none focus-visible:ring-1 focus-visible:ring-primary h-11 text-muted-foreground tabular-nums rounded-lg text-center'
  return cn(base, isActive ? 'bg-secondary' : 'bg-transparent')
}

function getCompleteButtonClass(isCompleted: boolean, ready: boolean): string {
  const base = 'h-11 w-11 rounded-lg transition-all duration-200'

  if (isCompleted) {
    return cn(base, 'bg-success hover:bg-success/90 text-success-foreground')
  }
  if (ready) {
    return cn(base, 'bg-success hover:bg-success/90 text-success-foreground hover:scale-105')
  }
  return cn(base, 'bg-secondary hover:bg-secondary/80 text-muted-foreground')
}

function getCheckIconClass(isCompleted: boolean, ready: boolean): string {
  const base = 'w-4 h-4 transition-all'

  if (isCompleted) {
    return cn(base, 'animate-in zoom-in-50 duration-200')
  }
  if (ready) {
    return cn(base, 'opacity-100')
  }
  return cn(base, 'opacity-30')
}

function getEstimated10RM(kg: string | number | undefined, reps: string | number | undefined) {
  if (!kg || !reps) return '—'
  const calculated = toDisplayValue(calculate10RM(Number(kg), Number(reps)))
  return calculated?.toString() ?? '—'
}

// Live (uncommitted) input tracking, keyed by set id.
//
// reka-ui's NumberField only commits a typed value on blur/Enter (see
// NumberFieldInput's `@blur="applyInputValue"` -- there is no equivalent on `@input`,
// by design, so it doesn't reformat/disrupt the value while the user is still typing).
// That means `set.kg`/`set.reps`/`set.rir` lag one blur behind what's on screen. The
// readiness indicator (checkmark tint) and the footer "Complete Set" CTA must not lag
// with it, so we shadow-track the raw typed text here via native `input` events
// (delegated on the row) purely for readiness checks -- the authoritative commit to
// the domain `Set` still only happens through `update-set` (blur/Enter/step buttons),
// so typing decimals like "60.5" is never disrupted. See Finding 6, July 2026 UX review.
type LiveField = 'kg' | 'reps' | 'rir' | 'duration'
const liveValuesBySetId = ref<Record<number, Partial<Record<LiveField, string>>>>({})

function isLiveField(field: string | undefined): field is LiveField {
  return field === 'kg' || field === 'reps' || field === 'rir' || field === 'duration'
}

function handleRowInput(setId: number, event: Event) {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) return
  const field = target.dataset.field
  if (!isLiveField(field)) return

  liveValuesBySetId.value = {
    ...liveValuesBySetId.value,
    [setId]: { ...liveValuesBySetId.value[setId], [field]: target.value },
  }
}

// A commit (blur/Enter) makes the domain `Set` the source of truth again, so
// drop the shadow-tracked keystrokes for that field. This also ends the clamp
// signal below, since it derives from the live value.
function clearLiveValue(setId: number, field: LiveField) {
  const live = liveValuesBySetId.value[setId]
  if (!live || live[field] === undefined) return
  const rest = { ...live }
  delete rest[field]
  liveValuesBySetId.value = { ...liveValuesBySetId.value, [setId]: rest }
}

// Bound to the NumberField `:max` props in the template below -- one place, so
// the clamp-signal detection and the inputs' actual bounds never drift.
const FIELD_MAX: Record<LiveField, number> = {
  kg: 999,
  reps: 999,
  rir: 10,
  duration: 9999,
}

type ClampSignal = { class: string | undefined; title: string | undefined }

// reka-ui's NumberField silently clamps to `max` on blur/Enter with no feedback --
// while the user is typing past the limit this drives a brief shake animation +
// title hint on the input itself. Derived from the live (uncommitted) text, so it
// clears when the field commits. See UX review Low finding "Weight/reps clamp
// silently at 999".
function getClampSignal(setId: number, field: LiveField): ClampSignal {
  const raw = liveValuesBySetId.value[setId]?.[field]
  const clamped = raw !== undefined && Number(raw) > FIELD_MAX[field]
  return {
    class: clamped ? 'animate-shake-clamp' : undefined,
    title: clamped
      ? t('workouts.active.strength.valueClamped', { max: FIELD_MAX[field] })
      : undefined,
  }
}

// Pre-compute all derived state for each set
const setStates = computed(() =>
  block.sets.map((set, index) => {
    const isCompleted = set.status === 'completed'
    const isActive = index === activeSetIndex
    // Merge in not-yet-committed keystrokes so readiness reflects what's on screen,
    // not just the last blurred value.
    const live = liveValuesBySetId.value[set.id]
    const effectiveSet = live ? { ...set, ...live } : set
    // Use appropriate readiness check based on exercise metrics
    const ready = isDurationBased.value
      ? isSetReadyForDuration(effectiveSet)
      : isSetReady(effectiveSet)

    return {
      set,
      index,
      setNumber: index + 1,
      isCompleted,
      isActive,
      isPending: !isCompleted && !isActive,
      ready,
      // The checkmark toggles a completed set back to active regardless of
      // current field validity (editing a completed set's values shouldn't trap
      // it as "completed"), but must otherwise mirror the footer CTA's readiness
      // gate -- an empty/incomplete set's checkmark should look and behave
      // disabled instead of doing nothing on tap. See Finding "Row checkmarks
      // look enabled on empty sets but do nothing", July 2026 UX review.
      canToggleComplete: isCompleted || ready,
      weightValue: toDisplayValue(set.kg),
      repsValue: set.reps ? Number(set.reps) : undefined,
      durationValue: set.duration ? Number(set.duration) : undefined,
      rirValue: set.rir === undefined || set.rir === '' ? undefined : Number(set.rir),
      estimated10RM: getEstimated10RM(set.kg, set.reps),
      rowClass: getRowClass(isActive, isCompleted),
      inputClass: getInputClass(isActive),
      repsInputClass: getRepsInputClass(isActive),
      rirInputClass: getRirInputClass(isActive),
      completeButtonClass: getCompleteButtonClass(isCompleted, ready),
      checkIconClass: getCheckIconClass(isCompleted, ready),
      kgClamp: getClampSignal(set.id, 'kg'),
      repsClamp: getClampSignal(set.id, 'reps'),
      rirClamp: getClampSignal(set.id, 'rir'),
      durationClamp: getClampSignal(set.id, 'duration'),
    }
  }),
)

// Surface the active set's live readiness to the parent (it drives the footer
// "Complete Set" CTA). Emitting the derived boolean -- not raw keystrokes --
// keeps this component the single owner of the readiness rule.
const activeSetReady = computed(() => setStates.value[activeSetIndex]?.ready ?? false)
watch(activeSetReady, (ready) => emit('active-set-ready', ready), { immediate: true })

function handleWeightChange(set: Set, displayValue: number | undefined) {
  clearLiveValue(set.id, 'kg')
  emit('update-set', set.id, 'kg', toStorageValue(displayValue))
}

function handleRepsChange(set: Set, value: number | undefined) {
  clearLiveValue(set.id, 'reps')
  emit('update-set', set.id, 'reps', value)
}

function handleRirChange(set: Set, value: number | undefined) {
  clearLiveValue(set.id, 'rir')
  emit('update-set', set.id, 'rir', value)
}

function handleDurationChange(set: Set, value: number | undefined) {
  clearLiveValue(set.id, 'duration')
  emit('update-set', set.id, 'duration', value)
}

// Modal state for touch input
const modalOpen = ref(false)
const modalType = ref<StrengthInputType>('weight')
const modalSetId = ref<number | null>(null)
const modalValue = ref(0)

function openModal(type: StrengthInputType, set: Set, currentValue: number | undefined) {
  modalType.value = type
  modalSetId.value = set.id
  modalValue.value = currentValue ?? 0
  modalOpen.value = true
}

function handleModalConfirm(value: number) {
  if (modalSetId.value === null) return

  const fieldMap: Record<StrengthInputType, 'kg' | 'reps' | 'rir' | 'duration'> = {
    weight: 'kg',
    reps: 'reps',
    rir: 'rir',
    duration: 'duration',
  }
  const field = fieldMap[modalType.value]
  const emitValue = modalType.value === 'weight' ? toStorageValue(value) : value
  emit('update-set', modalSetId.value, field, emitValue)
}

// Format value for display in touch trigger button
function formatDisplayValue(value: number | undefined, type: StrengthInputType): string {
  if (value === undefined) return '—'
  if (type === 'weight') {
    return formatNumber(value, { maximumFractionDigits: 2, useGrouping: false })
  }
  return String(value)
}

// Context menu state -- tracks which row's menu is open. Opened either by the
// per-row overflow button (keyboard/screen-reader-reachable, see SetContextMenu.vue)
// or by long-pressing the row (secondary shortcut, kept for touch users who
// discover it). See Finding 9, July 2026 UX review.
const contextMenuOpenSetId = ref<number | null>(null)

function setContextMenuOpen(setId: number, isOpen: boolean) {
  contextMenuOpenSetId.value = isOpen ? setId : null
}

// Long press configuration
const LONG_PRESS_DELAY = 500
const LONG_PRESS_DISTANCE_THRESHOLD = 10
let longPressTimer: ReturnType<typeof setTimeout> | null = null
let pointerStartPosition: { x: number; y: number } | null = null

function handlePointerDown(setId: number, event: PointerEvent) {
  // Don't trigger on inputs/buttons - use instanceof for type-safe check
  const target = event.target
  if (target instanceof HTMLElement && target.closest('input, button')) return

  pointerStartPosition = { x: event.clientX, y: event.clientY }

  longPressTimer = setTimeout(() => {
    contextMenuOpenSetId.value = setId
    longPressTimer = null
  }, LONG_PRESS_DELAY)
}

function handlePointerMove(event: PointerEvent) {
  if (!longPressTimer || !pointerStartPosition) return

  const distance = Math.hypot(
    event.clientX - pointerStartPosition.x,
    event.clientY - pointerStartPosition.y,
  )

  if (distance > LONG_PRESS_DISTANCE_THRESHOLD) {
    clearTimeout(longPressTimer)
    longPressTimer = null
    pointerStartPosition = null
  }
}

function handlePointerUp() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
  pointerStartPosition = null
}

function handlePointerCancel() {
  handlePointerUp()
}

const isDeleteDisabled = computed(() => block.sets.length <= 1)

// Cleanup on unmount
onUnmounted(() => {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
  }
})
</script>

<template>
  <div class="flex-1 flex flex-col px-4 py-4">
    <!-- Compact Header -->
    <header class="mb-4">
      <h1 class="text-base font-bold uppercase tracking-widest text-foreground/90">
        {{ block.name }}
      </h1>
      <p class="text-sm text-muted-foreground">
        {{ block.equipment }}
      </p>
    </header>

    <!-- Sets Table -->
    <div class="flex-1 overflow-auto">
      <Table :aria-label="tableAriaLabel">
        <TableHeader>
          <TableRow class="border-none hover:bg-transparent">
            <TableHead class="w-12 h-8 p-1 text-xs">#</TableHead>
            <TableHead class="h-8 p-1 text-xs text-center">{{ weightLabel }}</TableHead>
            <TableHead class="h-8 p-1 text-xs text-center">
              {{
                isDurationBased
                  ? t('workouts.table.headers.duration').toUpperCase()
                  : t('workouts.table.headers.reps').toUpperCase()
              }}
            </TableHead>
            <TableHead v-if="!isDurationBased" class="h-8 p-1 text-xs text-center">{{
              t('workouts.table.headers.rir').toUpperCase()
            }}</TableHead>
            <TableHead
              v-if="!isDurationBased"
              class="h-8 p-1 text-xs text-center hidden sm:table-cell"
              >{{ t('workouts.table.headers.tenRm') }}</TableHead
            >
            <TableHead class="w-14 h-8 p-1">
              <span class="sr-only">{{ t('common.aria.statusColumn') }}</span>
            </TableHead>
            <TableHead class="w-11 h-8 p-1">
              <span class="sr-only">{{ t('common.aria.actionsColumn') }}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="state in setStates"
            :key="state.set.id"
            :class="state.rowClass"
            :aria-current="state.isActive ? 'true' : undefined"
            @pointerdown="handlePointerDown(state.set.id, $event)"
            @pointermove="handlePointerMove"
            @pointerup="handlePointerUp"
            @pointercancel="handlePointerCancel"
            @input="handleRowInput(state.set.id, $event)"
          >
            <!-- Set Number -->
            <TableCell class="p-1 h-14">
              <div
                v-if="state.isCompleted"
                class="w-7 h-7 rounded-md bg-success/20 flex items-center justify-center"
              >
                <Check class="w-3.5 h-3.5 text-success" aria-hidden="true" />
              </div>
              <div
                v-else-if="state.isActive"
                class="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm tabular-nums"
              >
                {{ state.setNumber }}
              </div>
              <span v-else class="text-muted-foreground tabular-nums pl-2">{{
                state.setNumber
              }}</span>
            </TableCell>

            <!-- Weight -->
            <TableCell class="p-1 h-14">
              <!-- Touch: Trigger button -->
              <button
                v-if="isTouchDevice"
                type="button"
                :aria-label="t('common.aria.weightForSet', { number: state.setNumber })"
                :class="cn(state.inputClass, 'w-full cursor-pointer')"
                @click="openModal('weight', state.set, state.weightValue)"
              >
                {{ formatDisplayValue(state.weightValue, 'weight') }}
              </button>
              <!-- Desktop: Inline NumberField -->
              <NumberField
                v-else
                :model-value="state.weightValue"
                :min="0"
                :max="FIELD_MAX.kg"
                :step="0.01"
                :format-options="weightFormatOptions"
                :locale="intlLocale"
                @update:model-value="handleWeightChange(state.set, $event)"
              >
                <NumberFieldInput
                  placeholder="—"
                  data-field="kg"
                  :aria-label="t('common.aria.weightForSet', { number: state.setNumber })"
                  :class="cn(state.inputClass, state.kgClamp.class)"
                  :title="state.kgClamp.title"
                />
              </NumberField>
            </TableCell>

            <!-- Reps or Duration -->
            <TableCell class="p-1 h-14">
              <!-- Duration mode: Touch trigger -->
              <button
                v-if="isDurationBased && isTouchDevice"
                type="button"
                :aria-label="t('common.aria.durationForSet', { number: state.setNumber })"
                :class="cn(state.repsInputClass, 'w-full cursor-pointer')"
                @click="openModal('duration', state.set, state.durationValue)"
              >
                {{ formatDisplayValue(state.durationValue, 'duration') }}
              </button>
              <!-- Duration mode: Desktop NumberField -->
              <NumberField
                v-else-if="isDurationBased"
                :model-value="state.durationValue"
                :min="0"
                :max="FIELD_MAX.duration"
                @update:model-value="handleDurationChange(state.set, $event)"
              >
                <NumberFieldInput
                  placeholder="—"
                  data-field="duration"
                  :aria-label="t('common.aria.durationForSet', { number: state.setNumber })"
                  :class="cn(state.repsInputClass, state.durationClamp.class)"
                  :title="state.durationClamp.title"
                />
              </NumberField>
              <!-- Reps mode: Touch trigger -->
              <button
                v-else-if="isTouchDevice"
                type="button"
                :aria-label="t('common.aria.repsForSet', { number: state.setNumber })"
                :class="cn(state.repsInputClass, 'w-full cursor-pointer')"
                @click="openModal('reps', state.set, state.repsValue)"
              >
                {{ formatDisplayValue(state.repsValue, 'reps') }}
              </button>
              <!-- Reps mode: Desktop NumberField -->
              <NumberField
                v-else
                :model-value="state.repsValue"
                :min="0"
                :max="FIELD_MAX.reps"
                @update:model-value="handleRepsChange(state.set, $event)"
              >
                <NumberFieldInput
                  placeholder="—"
                  data-field="reps"
                  :aria-label="t('common.aria.repsForSet', { number: state.setNumber })"
                  :class="cn(state.repsInputClass, state.repsClamp.class)"
                  :title="state.repsClamp.title"
                />
              </NumberField>
            </TableCell>

            <!-- RIR (hidden for duration-based exercises) -->
            <TableCell v-if="!isDurationBased" class="p-1 h-14">
              <!-- Touch: Trigger button -->
              <button
                v-if="isTouchDevice"
                type="button"
                :aria-label="t('common.aria.repsInReserveForSet', { number: state.setNumber })"
                :class="cn(state.rirInputClass, 'w-full cursor-pointer')"
                @click="openModal('rir', state.set, state.rirValue)"
              >
                {{ formatDisplayValue(state.rirValue, 'rir') }}
              </button>
              <!-- Desktop: Inline NumberField -->
              <NumberField
                v-else
                :model-value="state.rirValue"
                :min="0"
                :max="FIELD_MAX.rir"
                @update:model-value="handleRirChange(state.set, $event)"
              >
                <NumberFieldInput
                  placeholder="—"
                  data-field="rir"
                  :aria-label="t('common.aria.repsInReserveForSet', { number: state.setNumber })"
                  :class="cn(state.rirInputClass, state.rirClamp.class)"
                  :title="state.rirClamp.title"
                />
              </NumberField>
            </TableCell>

            <!-- 10RM (hidden on small screens and for duration-based exercises) -->
            <TableCell
              v-if="!isDurationBased"
              class="p-1 h-14 text-center text-xs text-muted-foreground hidden sm:table-cell"
            >
              {{ state.estimated10RM }}
            </TableCell>

            <!-- Complete Button -->
            <TableCell class="p-1 h-14 text-center">
              <Button
                size="icon"
                :aria-label="t('common.aria.markSetNumberComplete', { number: state.setNumber })"
                :aria-pressed="state.isCompleted"
                :class="state.completeButtonClass"
                :disabled="!state.canToggleComplete"
                @click="emit('toggle-complete', state.set)"
              >
                <Check :class="state.checkIconClass" aria-hidden="true" />
              </Button>
            </TableCell>

            <!-- Options (overflow menu: delete/duplicate) -->
            <TableCell class="p-1 h-14 text-center">
              <SetContextMenu
                :open="contextMenuOpenSetId === state.set.id"
                :set-number="state.setNumber"
                :delete-disabled="isDeleteDisabled"
                @update:open="setContextMenuOpen(state.set.id, $event)"
                @delete="emit('delete-set', state.set.id)"
                @duplicate="emit('duplicate-set', state.set.id)"
              />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Add Set Button -->
    <Button
      variant="ghost"
      class="w-full mt-3 h-11 text-muted-foreground hover:text-foreground"
      @click="emit('add-set')"
    >
      <Plus class="w-4 h-4 mr-2" aria-hidden="true" />
      {{ t('workouts.sets.addSet') }}
    </Button>

    <!-- Numeric Input Modal (touch devices only) -->
    <NumericInputModal
      v-model="modalValue"
      v-model:open="modalOpen"
      :type="modalType"
      :unit="modalType === 'weight' ? unitLabel : ''"
      :equipment="block.equipment"
      @update:model-value="handleModalConfirm"
    />
  </div>
</template>
