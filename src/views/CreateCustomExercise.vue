<script setup lang="ts">
import type { Equipment, ExerciseType, Metrics, Muscle } from '@/types/exercises'
import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ExerciseSelectorDialog from '@/features/exercises/components/ExerciseSelectorDialog.vue'
import ExerciseSettingsItem from '@/features/exercises/components/ExerciseSettingsItem.vue'
import ExerciseAvatar from '@/components/ExerciseAvatar.vue'
import PageLayout from '@/components/PageLayout.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useExerciseForm } from '@/features/exercises/composables/useExerciseForm'
import { useImageConversion } from '@/composables/useImageConversion'
import {
  EQUIPMENT_OPTIONS,
  METRICS_OPTIONS,
  MUSCLE_OPTIONS,
  TYPE_OPTIONS,
} from '@/features/exercises/data/exerciseOptions'
import { EQUIPMENT_LABELS, METRICS_LABELS, MUSCLE_LABELS, TYPE_LABELS } from '@/lib/exerciseLabels'
import { useExercisesStore } from '@/stores/exercises'

const router = useRouter()
const { t } = useI18n()
const exercisesStore = useExercisesStore()

// Form state and validation
const { form, isNameValid, isSaveDisabled, getFormData } = useExerciseForm()

// Image conversion
const { convert: convertImage } = useImageConversion()
const imageInputRef = useTemplateRef<HTMLInputElement>('imageInput')

// Computed for image upload display
const imageDisplayText = computed(() => {
  if (form.value.image) {
    const sizeKb = Math.round(form.value.image.size / 1024)
    return `${t('exercises.create.imageUploaded')} (${sizeKb} KB)`
  }
  return ''
})

function handleImageClick() {
  imageInputRef.value?.click()
}

// Modal state machine - only one modal can be open at a time
type ModalState =
  | { kind: 'closed' }
  | { kind: 'equipment' }
  | { kind: 'muscle' }
  | { kind: 'type' }
  | { kind: 'metrics' }

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

function openModal(kind: ModalState['kind']) {
  modalState.value = { kind }
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

async function handleImageSelect(event: Event) {
  const input = event.target
  if (!(input instanceof HTMLInputElement)) return

  const file = input.files?.[0]
  input.value = '' // Reset for re-selection
  if (!file) return

  // Clear previous error
  form.value.imageError = undefined

  const result = await convertImage(file)

  if (result.success) {
    form.value.image = result.blob
    return
  }

  form.value.imageError =
    result.error === 'file-too-large'
      ? t('exercises.create.errors.imageTooLarge')
      : result.error === 'invalid-image'
        ? t('exercises.create.errors.invalidImage')
        : t('exercises.create.errors.conversionFailed')
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
      <!-- Avatar with image preview or initials -->
      <div class="mb-6 flex gap-4">
        <button
          type="button"
          :aria-label="t('exercises.create.addImage')"
          class="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          @click="handleImageClick"
        >
          <ExerciseAvatar
            :name="form.name"
            :image="form.image"
            size="lg"
            class="flex-shrink-0 hover:opacity-80 transition-opacity"
          />
        </button>

        <!-- Name Input -->
        <div class="flex-1">
          <label for="exercise-name" class="sr-only">
            {{ t('exercises.create.namePlaceholder') }}
          </label>
          <Input
            id="exercise-name"
            v-model="form.name"
            :placeholder="t('exercises.create.namePlaceholder')"
            class="w-full"
            autofocus
          />
        </div>
      </div>

      <!-- Image Upload Error -->
      <div
        v-if="form.imageError"
        role="alert"
        aria-live="assertive"
        data-testid="image-upload-error"
        class="mt-2 text-sm text-destructive"
      >
        {{ form.imageError }}
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
          :label="t('exercises.create.addImage')"
          :value="imageDisplayText"
          @click="handleImageClick"
        />
      </div>
    </div>

    <!-- Hidden image file input -->
    <input
      ref="imageInput"
      data-testid="exercise-image-upload"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleImageSelect"
    />

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
  </PageLayout>
</template>
