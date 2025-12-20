<script setup lang="ts">
import type {
  Equipment,
  ExerciseType,
  Metrics,
  MovementPattern,
  Muscle,
  PatternColor,
} from '@/types/exercises'
import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ExerciseSelectorDialog from '@/features/exercises/components/ExerciseSelectorDialog.vue'
import ExerciseSettingsItem from '@/features/exercises/components/ExerciseSettingsItem.vue'
import PageLayout from '@/components/PageLayout.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useExerciseForm } from '@/features/exercises/composables/useExerciseForm'
import {
  COLOR_OPTIONS,
  EQUIPMENT_OPTIONS,
  METRICS_OPTIONS,
  MUSCLE_OPTIONS,
  PATTERN_OPTIONS,
  TYPE_OPTIONS,
} from '@/features/exercises/data/exerciseOptions'
import {
  COLOR_LABELS,
  EQUIPMENT_LABELS,
  METRICS_LABELS,
  MUSCLE_LABELS,
  PATTERN_LABELS,
  TYPE_LABELS,
} from '@/lib/exerciseLabels'
import { PATTERN_COLOR_CLASSES } from '@/lib/patternIcons'
import { useExercisesStore } from '@/stores/exercises'

const router = useRouter()
const { t } = useI18n()
const exercisesStore = useExercisesStore()

// Form state and validation
const { form, isNameValid, isSaveDisabled, getFormData } = useExerciseForm()

// Modal state machine - only one modal can be open at a time
type ModalState =
  | { kind: 'closed' }
  | { kind: 'equipment' }
  | { kind: 'muscle' }
  | { kind: 'type' }
  | { kind: 'metrics' }
  | { kind: 'pattern' }
  | { kind: 'color' }

const modalState = ref<ModalState>({ kind: 'closed' })

// Writable computed helpers for v-model compatibility
const showEquipmentModal = computed({
  get: () => modalState.value.kind === 'equipment',
  set: (val) => {
    if (!val) modalState.value = { kind: 'closed' }
  },
})
const showMuscleModal = computed({
  get: () => modalState.value.kind === 'muscle',
  set: (val) => {
    if (!val) modalState.value = { kind: 'closed' }
  },
})
const showTypeModal = computed({
  get: () => modalState.value.kind === 'type',
  set: (val) => {
    if (!val) modalState.value = { kind: 'closed' }
  },
})
const showMetricsModal = computed({
  get: () => modalState.value.kind === 'metrics',
  set: (val) => {
    if (!val) modalState.value = { kind: 'closed' }
  },
})
const showPatternModal = computed({
  get: () => modalState.value.kind === 'pattern',
  set: (val) => {
    if (!val) modalState.value = { kind: 'closed' }
  },
})
const showColorModal = computed({
  get: () => modalState.value.kind === 'color',
  set: (val) => {
    if (!val) modalState.value = { kind: 'closed' }
  },
})

function openModal(kind: ModalState['kind']) {
  modalState.value = { kind }
}

const emojiInputRef = useTemplateRef<HTMLInputElement>('emojiInput')

function handleIconClick() {
  emojiInputRef.value?.click()
}

function handleEmojiChange(event: Event) {
  const input = event.target
  if (!(input instanceof HTMLInputElement)) return
  const value = input.value
  if (value) {
    // Take the last character which should be the emoji
    form.value.icon = value.charAt(value.length - 1)
    input.value = ''
  }
}

function handleEquipmentSelect(selected: Equipment) {
  form.value.equipment = selected
}

function handleMuscleSelect(selected: Muscle) {
  form.value.muscle = selected
}

function handleTypeSelect(selected: ExerciseType) {
  form.value.type = selected
}

function handleMetricsSelect(selected: Metrics) {
  form.value.metrics = selected
}

function handlePatternSelect(selected: MovementPattern) {
  form.value.pattern = selected
}

function handleColorSelect(selected: PatternColor) {
  form.value.color = selected
  modalState.value = { kind: 'closed' }
}

async function handleSave() {
  if (!isNameValid.value) return

  await exercisesStore.addExercise(getFormData())
  router.back()
}
</script>

<template>
  <PageLayout :title="t('exercises.create.title')">
    <template #header-actions>
      <Button :disabled="isSaveDisabled" @click="handleSave">{{
        t('exercises.create.save')
      }}</Button>
    </template>

    <!-- Main Content -->
    <div class="p-4">
      <!-- Icon & Name Section -->
      <div class="mb-6 flex gap-4">
        <!-- Icon Button -->
        <Button
          variant="ghost"
          class="size-12 flex-shrink-0 rounded-full bg-muted text-2xl p-0 hover:bg-muted/80"
          :aria-label="t('exercises.create.selectIcon')"
          @click="handleIconClick"
        >
          {{ form.icon }}
        </Button>

        <!-- Name Input -->
        <div class="flex-1">
          <Input
            v-model="form.name"
            :placeholder="t('exercises.create.namePlaceholder')"
            class="w-full"
            autofocus
          />
        </div>
      </div>

      <!-- Configuration List -->
      <div class="space-y-0 overflow-hidden rounded-lg border border-border">
        <ExerciseSettingsItem
          :label="t('exercises.labels.equipment')"
          :value="form.equipment ? EQUIPMENT_LABELS[form.equipment] : ''"
          @click="openModal('equipment')"
        />
        <ExerciseSettingsItem
          :label="t('exercises.labels.muscle')"
          :value="form.muscle ? MUSCLE_LABELS[form.muscle] : ''"
          @click="openModal('muscle')"
        />
        <ExerciseSettingsItem
          :label="t('exercises.labels.exerciseType')"
          :value="TYPE_LABELS[form.type]"
          @click="openModal('type')"
        />
        <ExerciseSettingsItem
          :label="t('exercises.labels.metrics')"
          :value="METRICS_LABELS[form.metrics]"
          @click="openModal('metrics')"
        />
        <ExerciseSettingsItem
          :label="t('exercises.labels.pattern')"
          :value="form.pattern ? PATTERN_LABELS[form.pattern] : ''"
          @click="openModal('pattern')"
        />
        <ExerciseSettingsItem
          :label="t('exercises.labels.color')"
          :value="form.color ? COLOR_LABELS[form.color] : ''"
          @click="openModal('color')"
        >
          <template v-if="form.color" #prefix>
            <span
              :class="[PATTERN_COLOR_CLASSES[form.color].bg, 'size-4 rounded-full']"
            />
          </template>
        </ExerciseSettingsItem>
      </div>
    </div>

    <!-- Hidden emoji input -->
    <input ref="emojiInput" type="text" class="hidden" @change="handleEmojiChange" />

    <!-- Selection Modals -->
    <ExerciseSelectorDialog
      v-model:open="showEquipmentModal"
      :title="t('exercises.selectors.equipment.title')"
      :description="t('exercises.selectors.equipment.description')"
      :options="EQUIPMENT_OPTIONS"
      :selected="form.equipment"
      layout="grid"
      @select="handleEquipmentSelect"
    />

    <ExerciseSelectorDialog
      v-model:open="showMuscleModal"
      :title="t('exercises.selectors.muscle.title')"
      :description="t('exercises.selectors.muscle.description')"
      :options="MUSCLE_OPTIONS"
      :selected="form.muscle"
      @select="handleMuscleSelect"
    />

    <ExerciseSelectorDialog
      v-model:open="showTypeModal"
      :title="t('exercises.selectors.type.title')"
      :description="t('exercises.selectors.type.description')"
      :options="TYPE_OPTIONS"
      :selected="form.type"
      @select="handleTypeSelect"
    />

    <ExerciseSelectorDialog
      v-model:open="showMetricsModal"
      :title="t('exercises.selectors.metrics.title')"
      :description="t('exercises.selectors.metrics.description')"
      :options="METRICS_OPTIONS"
      :selected="form.metrics"
      @select="handleMetricsSelect"
    />

    <ExerciseSelectorDialog
      v-model:open="showPatternModal"
      :title="t('exercises.selectors.pattern.title')"
      :description="t('exercises.selectors.pattern.description')"
      :options="PATTERN_OPTIONS"
      :selected="form.pattern"
      @select="handlePatternSelect"
    />

    <!-- Color Picker Dialog using ToggleGroup -->
    <Dialog v-model:open="showColorModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ t('exercises.selectors.color.title') }}</DialogTitle>
          <DialogDescription>{{ t('exercises.selectors.color.description') }}</DialogDescription>
        </DialogHeader>
        <ToggleGroup
          type="single"
          :model-value="form.color"
          class="flex flex-wrap gap-3 justify-center py-4"
          @update:model-value="(val) => val && typeof val === 'string' && handleColorSelect(val as PatternColor)"
        >
          <ToggleGroupItem
            v-for="color in COLOR_OPTIONS"
            :key="color.value"
            :value="color.value"
            :aria-label="color.label"
            :class="[
              'size-10 rounded-full p-0 ring-2 ring-offset-2 ring-offset-background transition-all',
              PATTERN_COLOR_CLASSES[color.value].bg,
              form.color === color.value
                ? PATTERN_COLOR_CLASSES[color.value].ring
                : 'ring-transparent hover:ring-muted-foreground/30',
            ]"
          />
        </ToggleGroup>
      </DialogContent>
    </Dialog>
  </PageLayout>
</template>
