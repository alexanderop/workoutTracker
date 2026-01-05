<script setup lang="ts">
import { ref } from 'vue'
import { useBenchmarkForm } from '@/features/benchmarks/composables/useBenchmarkForm'
import { useFormDraft } from '@/composables/useFormDraft'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { RouteNames } from '@/router'
import { ArrowLeft, Plus, Trash2, MoreHorizontal } from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import ExercisePicker from '@/components/ExercisePicker.vue'
import BenchmarkExerciseList from '@/features/benchmarks/components/BenchmarkExerciseList.vue'
import RoundTabs from '@/features/benchmarks/components/RoundTabs.vue'
import NumericInputModal from '@/components/ui/numeric-input/NumericInputModal.vue'
import type { Exercise } from '@/composables/useExerciseSearch'

const { t } = useI18n()
const router = useRouter()
const {
  form,
  isSaveDisabled,
  isSaving,
  currentRoundIndex,
  displayRounds,
  currentExercises,
  roundCount,
  canDeleteRound,
  reset,
  addExercise,
  removeExercise,
  updateExerciseReps,
  reorderExercises,
  copyRound,
  deleteRound,
  navigateToRound,
  save,
} = useBenchmarkForm()

// Auto-save draft to IndexedDB
const { hasDraft, clearDraft } = useFormDraft('benchmark-create', form, {
  isEmpty: (state) => !state.name && state.rounds.every((r) => r.exercises.length === 0),
})

const showExercisePicker = ref(false)
const showRepsModal = ref(false)
const editingExerciseIndex = ref<number | null>(null)
const editingReps = ref<number>(10)

function handleBack() {
  router.push({ name: RouteNames.Workouts })
}

function handleAddExercise() {
  showExercisePicker.value = true
}

function handleExerciseSelected(exercise: Exercise) {
  // Add exercise immediately with default 10 reps
  addExercise(exercise, 10)
}

function handleExerciseClick(index: number) {
  const exercise = currentExercises.value[index]
  if (!exercise) return

  // Open reps modal for editing
  editingExerciseIndex.value = index
  editingReps.value = exercise.prescribedReps
  showRepsModal.value = true
}

function handleRepsChange(reps: number) {
  if (editingExerciseIndex.value !== null) {
    updateExerciseReps(editingExerciseIndex.value, reps)
  }
}

function handleDiscard() {
  reset()
  clearDraft()
}

function handleCopyRound() {
  copyRound(currentRoundIndex.value)
  navigateToRound(roundCount.value - 1)
}

function handleDeleteRound() {
  if (!canDeleteRound.value) return
  deleteRound(currentRoundIndex.value)
}

async function handleSave() {
  const benchmark = await save()
  if (!benchmark) return

  await clearDraft()
  router.push({ name: RouteNames.BenchmarkDetail, params: { id: benchmark.id } })
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
      <div class="flex items-center gap-2">
        <Button
          v-if="hasDraft"
          variant="ghost"
          size="sm"
          :disabled="isSaving"
          @click="handleDiscard"
        >
          <Trash2 class="mr-1 icon-sm" />
          {{ t('common.buttons.discard') }}
        </Button>
        <Button
          :disabled="isSaveDisabled || isSaving"
          @click="handleSave"
        >
          {{ isSaving ? t('common.states.saving') : t('common.buttons.save') }}
        </Button>
      </div>
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

        <!-- Round Tabs -->
        <RoundTabs
          :rounds="displayRounds"
          :active-index="currentRoundIndex"
          @select="navigateToRound"
        />

        <!-- Round Header with Actions -->
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-medium text-muted-foreground">
            {{ t('workouts.benchmarks.round', { current: currentRoundIndex + 1, total: roundCount }) }}
          </h2>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                :aria-label="t('common.buttons.options')"
              >
                <MoreHorizontal class="icon-sm" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @select="handleCopyRound">
                {{ t('workouts.benchmarks.copyRound') }}
              </DropdownMenuItem>
              <DropdownMenuItem
                :disabled="!canDeleteRound"
                @select="handleDeleteRound"
              >
                {{ t('workouts.benchmarks.deleteRound') }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <!-- Exercise List Section -->
        <div v-if="currentExercises.length > 0" class="space-y-2">
          <Label>{{ t('workouts.benchmarks.exercises') }}</Label>
          <BenchmarkExerciseList
            :exercises="currentExercises"
            @remove="removeExercise"
            @reorder="reorderExercises"
            @click="handleExerciseClick"
          />
        </div>

        <!-- Add Exercise Button -->
        <Button variant="outline" class="w-full border-dashed" @click="handleAddExercise">
          <Plus class="mr-2 icon-md" />
          {{ t('workouts.benchmarks.addExercise') }}
        </Button>
      </div>
    </div>

    <!-- Exercise Picker Dialog -->
    <ExercisePicker
      v-model:open="showExercisePicker"
      presentation="dialog"
      mode="single"
      :show-create="true"
      @select="handleExerciseSelected"
    />

    <!-- Reps Input Modal -->
    <NumericInputModal
      v-model="editingReps"
      v-model:open="showRepsModal"
      type="reps"
      @update:model-value="handleRepsChange"
    />
  </div>
</template>
