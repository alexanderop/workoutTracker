<script setup lang="ts">
import { ref } from 'vue'
import { useBenchmarkForm } from '@/features/benchmarks/composables/useBenchmarkForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NumberField, NumberFieldInput } from '@/components/ui/number-field'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { RouteNames } from '@/router'
import { ArrowLeft, Clock, Plus, RotateCw } from 'lucide-vue-next'
import WorkoutExercisePicker from '@/features/workout/components/WorkoutExercisePicker.vue'
import BenchmarkRepsDialog from '@/features/benchmarks/components/BenchmarkRepsDialog.vue'
import BenchmarkExerciseList from '@/features/benchmarks/components/BenchmarkExerciseList.vue'
import type { Exercise } from '@/composables/useExerciseSearch'
import { getRepositoryProvider } from '@/db/provider'
import { tryCatch } from '@/lib/tryCatch'

const { t } = useI18n()
const router = useRouter()
const {
  form,
  isSaveDisabled,
  showRoundsInput,
  addExercise,
  removeExercise,
  reorderExercises,
  getFormData,
} = useBenchmarkForm()

const showExercisePicker = ref(false)
const showRepsDialog = ref(false)
const selectedExercise = ref<Exercise | null>(null)

function handleBack() {
  router.push({ name: RouteNames.Workouts })
}

function handleAddExercise() {
  showExercisePicker.value = true
}

function handleExerciseSelected(exercise: Exercise) {
  selectedExercise.value = exercise
  showRepsDialog.value = true
}

function handleRepsConfirm(reps: number) {
  if (selectedExercise.value) {
    addExercise(selectedExercise.value, reps)
    selectedExercise.value = null
  }
}

function handleRepsCancel() {
  selectedExercise.value = null
}

async function handleSave() {
  const data = getFormData()
  const repo = getRepositoryProvider().benchmarks

  const [error] = await tryCatch(
    repo.create({
      name: data.name,
      type: data.type,
      rounds: data.rounds,
      exercises: data.exercises,
    }),
  )

  if (error) {
    console.error('Failed to save benchmark:', error)
    return
  }

  router.push({ name: RouteNames.Workouts })
}
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Header -->
    <header class="flex items-center justify-between border-b p-4">
      <div class="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          :aria-label="t('common.goBack')"
          @click="handleBack"
        >
          <ArrowLeft :size="20" />
        </Button>
        <h1 class="text-lg font-semibold">{{ t('workouts.benchmarks.create') }}</h1>
      </div>
      <Button
        :disabled="isSaveDisabled"
        @click="handleSave"
      >
        {{ t('common.buttons.save') }}
      </Button>
    </header>

    <!-- Form Content -->
    <div class="flex-1 overflow-y-auto p-4">
      <div class="mx-auto max-w-md space-y-6">
        <!-- Workout Name -->
        <div class="space-y-2">
          <Label for="workout-name">{{ t('workouts.benchmarks.name') }}</Label>
          <Input
            id="workout-name"
            v-model="form.name"
            :placeholder="t('workouts.benchmarks.namePlaceholder')"
          />
        </div>

        <!-- Type Selection -->
        <div class="space-y-2">
          <Label>{{ t('workouts.benchmarks.type.label') }}</Label>
          <div class="grid grid-cols-2 gap-3">
            <!-- For Time Card -->
            <button
              type="button"
              :class="[
                'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors',
                form.type === 'fortime'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-accent',
              ]"
              @click="form.type = 'fortime'"
            >
              <Clock :size="32" />
              <div class="text-center">
                <div class="font-semibold">{{ t('workouts.benchmarks.type.fortime') }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ t('workouts.benchmarks.type.fortimeDescription') }}
                </div>
              </div>
            </button>

            <!-- Rounds Card -->
            <button
              type="button"
              :class="[
                'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors',
                form.type === 'rounds'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-accent',
              ]"
              @click="form.type = 'rounds'"
            >
              <RotateCw :size="32" />
              <div class="text-center">
                <div class="font-semibold">{{ t('workouts.benchmarks.type.rounds') }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ t('workouts.benchmarks.type.roundsDescription') }}
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Rounds Input (Conditional) -->
        <div v-if="showRoundsInput" class="space-y-2">
          <Label for="rounds">{{ t('workouts.benchmarks.rounds.label') }}</Label>
          <NumberField id="rounds" v-model="form.rounds" :min="1">
            <NumberFieldInput />
          </NumberField>
        </div>

        <!-- Exercise List Section -->
        <div v-if="form.exercises.length > 0" class="space-y-2">
          <Label>{{ t('workouts.benchmarks.exercises') }}</Label>
          <BenchmarkExerciseList
            :exercises="form.exercises"
            @remove="removeExercise"
            @reorder="reorderExercises"
          />
        </div>

        <!-- Add Exercise Button -->
        <Button variant="outline" class="w-full border-dashed" @click="handleAddExercise">
          <Plus class="mr-2 size-5" />
          {{ t('workouts.benchmarks.addExercise') }}
        </Button>
      </div>
    </div>

    <!-- Exercise Picker Dialog -->
    <WorkoutExercisePicker
      v-model:open="showExercisePicker"
      presentation="dialog"
      mode="single"
      :show-create="true"
      @select="handleExerciseSelected"
    />

    <!-- Reps Input Dialog -->
    <BenchmarkRepsDialog
      v-model:open="showRepsDialog"
      :exercise="selectedExercise"
      @confirm="handleRepsConfirm"
      @cancel="handleRepsCancel"
    />
  </div>
</template>
