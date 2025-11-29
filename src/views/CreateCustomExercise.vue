<script setup lang="ts">
import type { Equipment, ExerciseType, Metrics, Muscle } from '@/stores/exercises'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ExerciseEquipmentSelector from '@/components/exercise/ExerciseEquipmentSelector.vue'
import ExerciseMetricsSelector from '@/components/exercise/ExerciseMetricsSelector.vue'
import ExerciseMuscleSelector from '@/components/exercise/ExerciseMuscleSelector.vue'
import ExerciseSettingsItem from '@/components/exercise/ExerciseSettingsItem.vue'
import ExerciseTypeSelector from '@/components/exercise/ExerciseTypeSelector.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useExerciseForm } from '@/composables/useExerciseForm'
import {
  EQUIPMENT_LABELS,
  METRICS_LABELS,
  MUSCLE_LABELS,
  TYPE_LABELS,
} from '@/lib/exerciseLabels'
import { useExercisesStore } from '@/stores/exercises'

const router = useRouter()
const exercisesStore = useExercisesStore()

// Form state and validation
const { form, isNameValid, isSaveDisabled, getFormData } = useExerciseForm()

// Modal states
const showEquipmentModal = ref(false)
const showMuscleModal = ref(false)
const showTypeModal = ref(false)
const showMetricsModal = ref(false)

function handleIconClick() {
  // Trigger emoji picker - on most browsers, we can use a hidden input
  const emojiInput = document.getElementById('emoji-input')
  if (emojiInput instanceof HTMLInputElement) {
    emojiInput.click()
  }
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
  showEquipmentModal.value = false
}

function handleMuscleSelect(selected: Muscle) {
  form.value.muscle = selected
  showMuscleModal.value = false
}

function handleTypeSelect(selected: ExerciseType) {
  form.value.type = selected
  showTypeModal.value = false
}

function handleMetricsSelect(selected: Metrics) {
  form.value.metrics = selected
  showMetricsModal.value = false
}

async function handleSave() {
  if (!isNameValid.value)
    return

  await exercisesStore.addExercise(getFormData())
  router.back()
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground flex flex-col">
    <!-- Header -->
    <div class="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between gap-4 z-10">
      <Button
        variant="ghost"
        size="icon"
        @click="router.back()"
      >
        ← Back
      </Button>
      <h1 class="text-lg font-semibold flex-1">
        Create Exercise
      </h1>
      <Button
        :disabled="isSaveDisabled"
        @click="handleSave"
      >
        Save
      </Button>
    </div>

    <!-- Main Content -->
    <div class="flex-1 overflow-y-auto p-4">
      <!-- Icon & Name Section -->
      <div class="flex gap-4 mb-6">
        <!-- Icon Button -->
        <button
          class="flex-shrink-0 w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-2xl hover:bg-slate-600 transition-colors"
          @click="handleIconClick"
        >
          {{ form.icon }}
        </button>

        <!-- Name Input -->
        <div class="flex-1">
          <Input
            v-model="form.name"
            placeholder="Name (e.g., Bulgarian Split Squat)"
            class="w-full"
            autofocus
          />
        </div>
      </div>

      <!-- Configuration List -->
      <div class="space-y-0 border border-border rounded-lg overflow-hidden">
        <ExerciseSettingsItem
          label="Equipment"
          :value="form.equipment ? EQUIPMENT_LABELS[form.equipment] : ''"
          @click="showEquipmentModal = true"
        />
        <ExerciseSettingsItem
          label="Muscle"
          :value="form.muscle ? MUSCLE_LABELS[form.muscle] : ''"
          @click="showMuscleModal = true"
        />
        <ExerciseSettingsItem
          label="Exercise Type"
          :value="TYPE_LABELS[form.type]"
          @click="showTypeModal = true"
        />
        <ExerciseSettingsItem
          label="Metrics"
          :value="METRICS_LABELS[form.metrics]"
          @click="showMetricsModal = true"
        />
      </div>
    </div>

    <!-- Hidden emoji input -->
    <input
      id="emoji-input"
      type="text"
      class="hidden"
      @change="handleEmojiChange"
    >

    <!-- Selection Modals -->
    <ExerciseEquipmentSelector
      :open="showEquipmentModal"
      :selected="form.equipment"
      @update:open="showEquipmentModal = $event"
      @select="handleEquipmentSelect"
    />

    <ExerciseMuscleSelector
      :open="showMuscleModal"
      :selected="form.muscle"
      @update:open="showMuscleModal = $event"
      @select="handleMuscleSelect"
    />

    <ExerciseTypeSelector
      :open="showTypeModal"
      :selected="form.type"
      @update:open="showTypeModal = $event"
      @select="handleTypeSelect"
    />

    <ExerciseMetricsSelector
      :open="showMetricsModal"
      :selected="form.metrics"
      @update:open="showMetricsModal = $event"
      @select="handleMetricsSelect"
    />
  </div>
</template>
