<script setup lang="ts">
/* eslint-disable vue/no-unused-refs -- imageInput ref used by useImageUpload composable */
import type { Equipment, ExerciseType, Metrics, Muscle } from '@/types/exercises'
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ExerciseSelectorDialog from '@/features/exercises/components/ExerciseSelectorDialog.vue'
import ExerciseSettingsItem from '@/features/exercises/components/ExerciseSettingsItem.vue'
import ExerciseAvatar from '@/components/ExerciseAvatar.vue'
import PageLayout from '@/components/PageLayout.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDialogState } from '@/composables/useDialogState'
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
const { form, isNameValid, isSaveDisabled, getFormData, populateFromExercise } = useExerciseForm()

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
  if (!isNameValid.value) return

  const formData = getFormData()

  if (isEditMode.value && id) {
    await exercisesStore.updateExercise(id, formData)
    router.back()
    return
  }

  await exercisesStore.addExercise(formData)
  router.back()
}
</script>

<template>
  <PageLayout :title="pageTitle">
    <template #header-actions>
      <Button :disabled="isSaveDisabled" @click="handleSave">{{
        saveButtonText
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
