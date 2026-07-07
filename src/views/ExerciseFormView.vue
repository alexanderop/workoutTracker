<script setup lang="ts">
/* eslint-disable vue/no-unused-refs -- imageInput ref used by useImageUpload composable */
import type { Equipment, ExerciseType, Metrics, Muscle } from '@/types/exercises'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Camera } from '@lucide/vue'
import ExerciseSelectorDialog from '@/features/exercises/components/ExerciseSelectorDialog.vue'
import ExerciseSettingsItem from '@/features/exercises/components/ExerciseSettingsItem.vue'
import ErrorDialog from '@/components/ErrorDialog.vue'
import ExerciseAvatar from '@/components/ExerciseAvatar.vue'
import PageLayout from '@/components/PageLayout.vue'
import UnsavedChangesDialog from '@/components/UnsavedChangesDialog.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDialogState } from '@/composables/useDialogState'
import { useUnsavedChangesGuard } from '@/composables/useUnsavedChangesGuard'
import { useExerciseForm } from '@/features/exercises/composables/useExerciseForm'
import { useImageUpload } from '@/features/exercises/composables/useImageUpload'
import {
  EQUIPMENT_OPTIONS,
  METRICS_OPTIONS,
  MUSCLE_OPTIONS,
  TYPE_OPTIONS,
} from '@/features/exercises/data/exerciseOptions'
import { EQUIPMENT_LABELS, METRICS_LABELS, MUSCLE_LABELS, TYPE_LABELS } from '@/lib/exerciseLabels'
import { useExercisesStore } from '@/stores/exercises'

const { id } = defineProps<{
  id?: string
}>()

const router = useRouter()
const { t } = useI18n()
const exercisesStore = useExercisesStore()

// Mode detection
const isEditMode = computed(() => !!id)
const pageTitle = computed(() =>
  isEditMode.value ? t('exercises.edit.title') : t('exercises.create.title'),
)
const saveButtonText = computed(() =>
  isEditMode.value ? t('exercises.edit.save') : t('exercises.create.save'),
)

// Form state and validation
const {
  form,
  isNameValid,
  isDuplicateName,
  isMuscleValid,
  isSaveDisabled,
  isDirty,
  getFormData,
  populateFromExercise,
  markSaved,
} = useExerciseForm(() => exercisesStore.customExercises)

// Equipment stays optional; the label makes that explicit (Finding M5).
const equipmentLabel = computed(
  () => `${t('exercises.labels.equipment')} (${t('common.labels.optional')})`,
)

// Warn before discarding unsaved changes on back navigation, browser back,
// or tab close (see brain/reference/reviews/ux-ui-review-2026-07-04.md Finding 5).
const {
  showDialog: showUnsavedChangesDialog,
  confirmDiscard,
  cancelDiscard,
} = useUnsavedChangesGuard(isDirty)

// Save operation state
const isSaving = ref(false)
const showError = ref(false)

// Load exercise data when in edit mode
onMounted(() => {
  if (!isEditMode.value || !id) return

  const exercise = exercisesStore.getExerciseById(id)
  if (exercise) {
    populateFromExercise(exercise)
  }
})

// Image upload
const {
  displayText: imageDisplayText,
  trigger: handleImageClick,
  handleSelect: handleImageSelect,
} = useImageUpload(form)

// Modal state - only one modal can be open at a time
type ModalKind = 'equipment' | 'muscle' | 'type' | 'metrics'
const { open: openModal, createDialogModel } = useDialogState<ModalKind>()

const showEquipmentModal = createDialogModel('equipment')
const showMuscleModal = createDialogModel('muscle')
const showTypeModal = createDialogModel('type')
const showMetricsModal = createDialogModel('metrics')

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

async function handleSave() {
  if (!isNameValid.value || isDuplicateName.value) return

  isSaving.value = true
  const formData = getFormData()

  if (isEditMode.value && id) {
    const success = await exercisesStore.updateExercise(id, formData)
    isSaving.value = false
    if (!success) {
      showError.value = true
      return
    }
    markSaved()
    router.back()
    return
  }

  const newExercise = await exercisesStore.addExercise(formData)
  isSaving.value = false
  if (!newExercise) {
    showError.value = true
    return
  }
  markSaved()
  router.back()
}
</script>

<template>
  <PageLayout :title="pageTitle">
    <template #header-actions>
      <Button :disabled="isSaveDisabled || isSaving" @click="handleSave">{{
        isSaving ? t('common.states.saving') : saveButtonText
      }}</Button>
    </template>

    <!-- Main Content -->
    <div class="p-4">
      <!-- Avatar with image preview or initials -- the single control for
           picking an image (previously duplicated by an "Add Image" row
           below, which opened the exact same picker; UX review finding). -->
      <div class="mb-6 flex gap-4">
        <div class="flex flex-col items-center gap-1">
          <button
            type="button"
            :aria-label="t('exercises.create.addImage')"
            class="relative rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            @click="handleImageClick"
          >
            <ExerciseAvatar
              :name="form.name"
              :image="form.image"
              size="lg"
              class="flex-shrink-0 hover:opacity-80 transition-opacity"
            />
            <span
              aria-hidden="true"
              class="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background"
            >
              <Camera class="h-3 w-3" />
            </span>
          </button>
          <span v-if="imageDisplayText" class="text-xs text-muted-foreground">{{
            imageDisplayText
          }}</span>
        </div>

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

      <!-- Duplicate Name Error -->
      <div
        v-if="isDuplicateName"
        role="alert"
        aria-live="assertive"
        data-testid="exercise-name-duplicate-error"
        class="mt-2 text-sm text-destructive"
      >
        {{ t('exercises.form.errors.duplicateName') }}
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
          :label="equipmentLabel"
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
      </div>

      <!-- Muscle Group Required Hint -->
      <div
        v-if="!isMuscleValid"
        role="alert"
        aria-live="polite"
        data-testid="exercise-muscle-required-hint"
        class="mt-2 text-sm text-muted-foreground"
      >
        {{ t('exercises.form.errors.muscleRequired') }}
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

    <ErrorDialog
      v-model:open="showError"
      :error="t('exercises.form.saveError', 'Failed to save exercise. Please try again.')"
      :title="t('exercises.form.saveErrorTitle', 'Save Failed')"
    />

    <UnsavedChangesDialog
      :open="showUnsavedChangesDialog"
      @cancel="cancelDiscard"
      @discard="confirmDiscard"
    />
  </PageLayout>
</template>
