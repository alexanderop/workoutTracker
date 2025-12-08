<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import PageLayout from '@/components/PageLayout.vue'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import BenchmarkViewMode from '@/features/benchmarks/components/BenchmarkViewMode.vue'
import BenchmarkEditMode from '@/features/benchmarks/components/BenchmarkEditMode.vue'
import BenchmarkRepsDialog from '@/features/benchmarks/components/BenchmarkRepsDialog.vue'
import WorkoutExercisePicker from '@/features/workout/components/WorkoutExercisePicker.vue'
import { useEnterAnimation } from '@/composables/useEnterAnimation'
import { useBenchmarkDetail } from '@/features/benchmarks/composables/useBenchmarkDetail'
import { useBenchmarkForm } from '@/features/benchmarks/composables/useBenchmarkForm'
import { formatBenchmarkType } from '@/lib/formatters'
import { RouteNames } from '@/router'
import type { Exercise } from '@/composables/useExerciseSearch'

const { t } = useI18n()

const { id } = defineProps<{
  id: string
}>()

const router = useRouter()
const { state, isStarting, startWorkout, saveBenchmark, deleteBenchmark } = useBenchmarkDetail(id)
const { isVisible: showContent } = useEnterAnimation(100)
const {
  form,
  isSaveDisabled,
  showRoundsInput,
  addExercise,
  removeExercise,
  reorderExercises,
  getFormData,
  initialize,
} = useBenchmarkForm()
const isEditMode = ref(false)
const isSaving = ref(false)

// Exercise picker state
const showExercisePicker = ref(false)
const showRepsDialog = ref(false)
const selectedExercise = ref<Exercise | null>(null)

// Delete dialog state
const showDeleteDialog = ref(false)

async function handleStartWorkout() {
  const success = await startWorkout()
  if (success) {
    router.push({ name: RouteNames.ActiveWorkout })
  }
}

function enterEditMode() {
  if (state.value.status === 'success') {
    initialize(state.value.benchmark)
    isEditMode.value = true
  }
}

async function handleSave() {
  if (state.value.status !== 'success' || isSaving.value) return

  isSaving.value = true
  const data = getFormData()
  const { success } = await saveBenchmark(data)

  if (success) {
    isEditMode.value = false
  }
  isSaving.value = false
}

function handleCancel() {
  isEditMode.value = false
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

async function handleDeleteBenchmark(): Promise<void> {
  await deleteBenchmark()
  router.push({ name: RouteNames.Workouts })
}
</script>

<template>
  <PageLayout
    :title="state.status === 'success' && !isEditMode ? state.benchmark.name : ''"
    :subtitle="
      state.status === 'success' && !isEditMode
        ? formatBenchmarkType(state.benchmark.type, state.benchmark.rounds)
        : undefined
    "
    back-to="/workouts"
  >
    <!-- Loading state -->
    <div v-if="state.status === 'loading'" class="flex items-center justify-center py-16">
      <div class="text-muted-foreground">{{ t('common.states.loading') }}</div>
    </div>

    <!-- View Mode -->
    <BenchmarkViewMode
      v-else-if="state.status === 'success' && !isEditMode"
      :benchmark="state.benchmark"
      :personal-best="state.personalBest"
      :show-content="showContent"
    />

    <!-- Edit Mode -->
    <BenchmarkEditMode
      v-else-if="state.status === 'success' && isEditMode"
      v-model:form="form"
      :show-rounds-input="showRoundsInput"
      @add-exercise="handleAddExercise"
      @remove-exercise="removeExercise"
      @reorder-exercises="reorderExercises"
    />

    <!-- Error state -->
    <div v-else-if="state.status === 'error'" class="flex flex-col items-center justify-center py-16">
      <p class="mb-4 text-muted-foreground">{{ t('workouts.benchmarks.detail.error') }}</p>
      <Button variant="outline" @click="router.push('/workouts')">
        {{ t('workouts.detail.goBack') }}
      </Button>
    </div>

    <!-- Not found state -->
    <div v-else class="flex flex-col items-center justify-center py-16">
      <p class="mb-4 text-muted-foreground">{{ t('workouts.benchmarks.detail.notFound') }}</p>
      <Button variant="outline" @click="router.push('/workouts')">
        {{ t('workouts.detail.goBack') }}
      </Button>
    </div>

    <!-- Footer with prominent Start button or Edit/Save/Cancel buttons -->
    <template v-if="state.status === 'success'" #footer>
      <!-- View mode: Show Start Workout button and Delete button -->
      <div v-if="!isEditMode" class="space-y-3 p-4">
        <div class="flex gap-2">
          <Button variant="outline" class="flex-1" @click="enterEditMode">
            {{ t('workouts.benchmarks.edit') }}
          </Button>
          <Button class="flex-1" size="lg" :disabled="isStarting" @click="handleStartWorkout">
            {{
              isStarting
                ? t('workouts.benchmarks.detail.starting')
                : t('workouts.benchmarks.detail.startWorkout')
            }}
          </Button>
        </div>

        <!-- Delete button -->
        <Button variant="destructive" class="w-full" @click="showDeleteDialog = true">
          {{ t('workouts.benchmarks.deleteBenchmark') }}
        </Button>
      </div>

      <!-- Edit mode: Show Save/Cancel buttons -->
      <div v-else class="flex gap-2 p-4">
        <Button variant="outline" class="flex-1" @click="handleCancel">
          {{ t('workouts.benchmarks.cancelEdit') }}
        </Button>
        <Button class="flex-1" :disabled="isSaveDisabled || isSaving" @click="handleSave">
          {{ isSaving ? t('common.states.saving') : t('workouts.benchmarks.saveChanges') }}
        </Button>
      </div>
    </template>

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

    <!-- Delete Confirmation Dialog -->
    <Dialog :open="showDeleteDialog" @update:open="showDeleteDialog = $event">
      <MobileDialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('workouts.benchmarks.deleteConfirmTitle') }}</DialogTitle>
          <DialogDescription>
            {{
              t('workouts.benchmarks.deleteConfirmDescription', {
                name: state.status === 'success' ? state.benchmark.name : '',
              })
            }}
          </DialogDescription>
        </DialogHeader>
        <div class="flex gap-3 pt-4">
          <Button variant="outline" class="flex-1" @click="showDeleteDialog = false">
            {{ t('common.buttons.cancel') }}
          </Button>
          <Button variant="destructive" class="flex-1" @click="handleDeleteBenchmark">
            {{ t('common.buttons.delete') }}
          </Button>
        </div>
      </MobileDialogContent>
    </Dialog>
  </PageLayout>
</template>
