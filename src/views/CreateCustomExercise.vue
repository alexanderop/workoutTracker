<script setup lang="ts">
import type { Equipment, ExerciseType, Metrics, Muscle } from '@/stores/exercises'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import ExerciseEquipmentSelector from '@/components/exercise/ExerciseEquipmentSelector.vue'
import ExerciseMetricsSelector from '@/components/exercise/ExerciseMetricsSelector.vue'
import ExerciseMuscleSelector from '@/components/exercise/ExerciseMuscleSelector.vue'
import ExerciseTypeSelector from '@/components/exercise/ExerciseTypeSelector.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useExercisesStore } from '@/stores/exercises'

const router = useRouter()
const exercisesStore = useExercisesStore()

// Form state
const icon = ref('💪')
const name = ref('')
const equipment = ref<Equipment | undefined>()
const muscle = ref<Muscle | undefined>()
const type = ref<ExerciseType>('isolation')
const metrics = ref<Metrics>('weight-reps')

// Modal states
const showEquipmentModal = ref(false)
const showMuscleModal = ref(false)
const showTypeModal = ref(false)
const showMetricsModal = ref(false)

// Computed
const isNameValid = computed(() => name.value.trim().length > 0)
const isSaveDisabled = computed(() => !isNameValid.value)

// Equipment display
const equipmentLabel: Record<Equipment, string> = {
  'barbell': 'Barbell',
  'dumbbell': 'Dumbbell',
  'machine': 'Machine',
  'cable': 'Cable',
  'bodyweight': 'Bodyweight',
  'kettlebell': 'Kettlebell',
  'band': 'Band',
  'ez-bar': 'EZ Bar',
  'hex-bar': 'Hex Bar',
}

// Muscle display
const muscleLabel: Record<Muscle, string> = {
  chest: 'Chest',
  back: 'Back',
  legs: 'Legs',
  shoulders: 'Shoulders',
  arms: 'Arms',
  core: 'Core',
}

// Type display
const typeLabel: Record<ExerciseType, string> = {
  compound: 'Compound Movement',
  isolation: 'Isolation Movement',
  stability: 'Stability/Core',
  cardio: 'Cardio',
}

// Metrics display
const metricsLabel: Record<Metrics, string> = {
  'weight-reps': 'Weight + Reps',
  'reps-only': 'Reps Only',
  'duration': 'Duration',
  'distance-duration': 'Distance + Duration',
  'weight-distance': 'Weight + Distance',
}

function handleIconClick() {
  // Trigger emoji picker - on most browsers, we can use a hidden input
  const emojiInput = document.getElementById('emoji-input') as HTMLInputElement
  if (emojiInput) {
    emojiInput.click()
  }
}

function handleEmojiChange(event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.value
  if (value) {
    // Take the last character which should be the emoji
    icon.value = value.charAt(value.length - 1)
    input.value = ''
  }
}

function handleEquipmentSelect(selected: Equipment) {
  equipment.value = selected
  showEquipmentModal.value = false
}

function handleMuscleSelect(selected: Muscle) {
  muscle.value = selected
  showMuscleModal.value = false
}

function handleTypeSelect(selected: ExerciseType) {
  type.value = selected
  showTypeModal.value = false
}

function handleMetricsSelect(selected: Metrics) {
  metrics.value = selected
  showMetricsModal.value = false
}

function handleSave() {
  if (!isNameValid.value)
    return

  exercisesStore.addExercise({
    icon: icon.value,
    name: name.value.trim(),
    equipment: equipment.value,
    muscle: muscle.value,
    type: type.value,
    metrics: metrics.value,
  })

  // Navigate back to active workout
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
          {{ icon }}
        </button>

        <!-- Name Input -->
        <div class="flex-1">
          <Input
            v-model="name"
            placeholder="Name (e.g., Bulgarian Split Squat)"
            class="w-full"
            autofocus
          />
        </div>
      </div>

      <!-- Configuration List -->
      <div class="space-y-0 border border-border rounded-lg overflow-hidden">
        <!-- Equipment -->
        <button
          class="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900 border-b border-border last:border-b-0 transition-colors text-left"
          @click="showEquipmentModal = true"
        >
          <span class="text-sm font-medium">Equipment</span>
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">
              {{ equipment ? equipmentLabel[equipment] : 'Please select' }}
            </span>
            <span class="text-muted-foreground">›</span>
          </div>
        </button>

        <!-- Muscle -->
        <button
          class="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900 border-b border-border last:border-b-0 transition-colors text-left"
          @click="showMuscleModal = true"
        >
          <span class="text-sm font-medium">Muscle</span>
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">
              {{ muscle ? muscleLabel[muscle] : 'Please select' }}
            </span>
            <span class="text-muted-foreground">›</span>
          </div>
        </button>

        <!-- Exercise Type -->
        <button
          class="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900 border-b border-border last:border-b-0 transition-colors text-left"
          @click="showTypeModal = true"
        >
          <span class="text-sm font-medium">Exercise Type</span>
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">
              {{ typeLabel[type] }}
            </span>
            <span class="text-muted-foreground">›</span>
          </div>
        </button>

        <!-- Metrics -->
        <button
          class="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900 border-b border-border last:border-b-0 transition-colors text-left"
          @click="showMetricsModal = true"
        >
          <span class="text-sm font-medium">Metrics</span>
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">
              {{ metricsLabel[metrics] }}
            </span>
            <span class="text-muted-foreground">›</span>
          </div>
        </button>
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
      :selected="equipment"
      @update:open="showEquipmentModal = $event"
      @select="handleEquipmentSelect"
    />

    <ExerciseMuscleSelector
      :open="showMuscleModal"
      :selected="muscle"
      @update:open="showMuscleModal = $event"
      @select="handleMuscleSelect"
    />

    <ExerciseTypeSelector
      :open="showTypeModal"
      :selected="type"
      @update:open="showTypeModal = $event"
      @select="handleTypeSelect"
    />

    <ExerciseMetricsSelector
      :open="showMetricsModal"
      :selected="metrics"
      @update:open="showMetricsModal = $event"
      @select="handleMetricsSelect"
    />
  </div>
</template>
