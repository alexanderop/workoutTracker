<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import WorkoutAddExerciseDialog from '@/components/workout/WorkoutAddExerciseDialog.vue'
import TemplateExerciseList from '@/components/templates/TemplateExerciseList.vue'
import type { TemplateExercise } from '@/components/templates/TemplateExerciseList.vue'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { templatesRepository } from '@/db/repositories/templates'
import { restoreWorkout } from '@/composables/useWorkout'
import { activeWorkoutRepository } from '@/db/repositories/activeWorkout'
import { dbToWorkout } from '@/db/converters'
import { popularExercises } from '@/data/popularExercises'
import type { DbWorkoutTemplate, DbTemplateStrengthBlock } from '@/db/schema'

const route = useRoute()
const router = useRouter()

const templateId = String(route.params.id)
const template = ref<DbWorkoutTemplate | null>(null)
const templateName = ref('')
const exercises = ref<ReadonlyArray<TemplateExercise>>([])
const isAddExerciseOpen = ref(false)
const showDeleteDialog = ref(false)
const isLoading = ref(true)
const isSaving = ref(false)
const isStarting = ref(false)

const isEdited = computed(() => {
  if (!template.value) return false
  // Simplified edit detection - just check name and count for now
  const strengthBlocks = template.value.blocks.filter((b) => b.kind === 'strength')
  return (
    templateName.value !== template.value.name || exercises.value.length !== strengthBlocks.length
  )
})

onMounted(async () => {
  try {
    const loaded = await templatesRepository.getById(templateId)
    if (!loaded) {
      await router.push('/workouts')
      return
    }

    template.value = loaded
    templateName.value = loaded.name
    // Extract strength blocks for exercise editing
    exercises.value = loaded.blocks
      .filter((b): b is DbTemplateStrengthBlock => b.kind === 'strength')
      .map((block) => ({
        exerciseId: block.name,
        name: block.name,
        equipment: block.equipment,
        thumbnail: block.thumbnail,
        defaultSetCount: block.defaultSetCount,
      }))
  } finally {
    isLoading.value = false
  }
})

function handleAddExercise(exerciseName: string): void {
  const popularExercise = popularExercises.find((ex) => ex.name === exerciseName)
  if (!popularExercise) return

  const newExercise: TemplateExercise = {
    exerciseId: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: exerciseName,
    equipment: popularExercise.equipment,
    thumbnail: popularExercise.icon,
    defaultSetCount: 3,
  }

  exercises.value = [...exercises.value, newExercise]
}

function handleExercisesUpdate(updated: ReadonlyArray<TemplateExercise>): void {
  exercises.value = updated
}

function handleRemoveExercise(exerciseId: string): void {
  exercises.value = exercises.value.filter((ex) => ex.exerciseId !== exerciseId)
}

async function handleSaveChanges(): Promise<void> {
  if (!template.value || !isEdited.value || isSaving.value) return

  isSaving.value = true
  try {
    await templatesRepository.update(template.value.id, {
      name: templateName.value.trim(),
      blocks: exercises.value.map((ex) => ({
        kind: 'strength' as const,
        exerciseDefinitionId: null,
        name: ex.name,
        equipment: ex.equipment,
        targetReps: 8,
        thumbnail: ex.thumbnail,
        defaultSetCount: ex.defaultSetCount,
      })),
    })

    const updated = await templatesRepository.getById(templateId)
    if (updated) {
      template.value = updated
      templateName.value = updated.name
      // Extract strength blocks for exercise editing
      exercises.value = updated.blocks
        .filter((b): b is DbTemplateStrengthBlock => b.kind === 'strength')
        .map((block) => ({
          exerciseId: block.name,
          name: block.name,
          equipment: block.equipment,
          thumbnail: block.thumbnail,
          defaultSetCount: block.defaultSetCount,
        }))
    }
  } finally {
    isSaving.value = false
  }
}

async function handleDeleteTemplate(): Promise<void> {
  if (!template.value) return
  await templatesRepository.delete(template.value.id)
  await router.push('/workouts')
}

async function handleStartWorkout(): Promise<void> {
  if (!template.value || isStarting.value) return

  isStarting.value = true
  try {
    const activeWorkout = await templatesRepository.startFromTemplate(template.value.id)
    await activeWorkoutRepository.save(activeWorkout)
    const inMemoryWorkout = dbToWorkout(activeWorkout)
    restoreWorkout(inMemoryWorkout)
    await router.push('/workout/active')
  } finally {
    isStarting.value = false
  }
}

function handleCancel(): void {
  if (isEdited.value && !confirm('Discard changes?')) {
    return
  }
  router.back()
}
</script>

<template>
  <div class="flex-1 p-4 flex flex-col">
    <!-- Loading state -->
    <div v-if="isLoading" class="flex items-center justify-center py-8">
      <div class="text-muted-foreground">Loading...</div>
    </div>

    <!-- Main content -->
    <template v-else-if="template">
      <!-- Header -->
      <Card class="mb-6">
        <CardContent class="pt-6">
          <h1 class="text-3xl font-bold mb-2">{{ template.name }}</h1>
          <p class="text-muted-foreground">{{ exercises.length }} exercises</p>
        </CardContent>
      </Card>

      <!-- Template name input -->
      <div class="mb-6">
        <label for="template-name" class="block text-sm font-medium mb-2">Template Name</label>
        <Input id="template-name" v-model="templateName" class="w-full" />
      </div>

      <!-- Exercises section -->
      <div class="flex-1 flex flex-col mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Exercises</h2>
          <span class="text-sm text-muted-foreground">{{ exercises.length }}</span>
        </div>

        <div v-if="exercises.length > 0" class="flex-1 overflow-y-auto mb-4">
          <TemplateExerciseList
            :exercises="exercises"
            @update:exercises="handleExercisesUpdate"
            @remove-exercise="handleRemoveExercise"
          />
        </div>

        <Button variant="outline" class="w-full" @click="isAddExerciseOpen = true">
          + Add Exercise
        </Button>
      </div>

      <!-- Action buttons -->
      <div class="space-y-3">
        <!-- Start Workout button -->
        <Button
          class="w-full"
          size="lg"
          @click="handleStartWorkout"
          :disabled="isStarting || exercises.length === 0"
        >
          {{ isStarting ? 'Starting...' : 'Start Workout' }}
        </Button>

        <!-- Edit buttons -->
        <div v-if="isEdited" class="flex gap-3">
          <Button variant="outline" class="flex-1" @click="handleCancel" :disabled="isSaving">
            Cancel
          </Button>
          <Button class="flex-1" @click="handleSaveChanges" :disabled="!isEdited || isSaving">
            {{ isSaving ? 'Saving...' : 'Save Changes' }}
          </Button>
        </div>

        <!-- Delete button -->
        <Button
          variant="destructive"
          class="w-full"
          @click="showDeleteDialog = true"
          :disabled="isEdited"
        >
          Delete Template
        </Button>
      </div>

      <!-- Add Exercise Dialog -->
      <WorkoutAddExerciseDialog
        :open="isAddExerciseOpen"
        @update:open="isAddExerciseOpen = $event"
        @add="handleAddExercise"
      />

      <!-- Delete Confirmation Dialog -->
      <Dialog :open="showDeleteDialog" @update:open="showDeleteDialog = $event">
        <MobileDialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The template "{{ template.name }}" will be permanently
              deleted.
            </DialogDescription>
          </DialogHeader>
          <div class="flex gap-3 pt-4">
            <Button variant="outline" class="flex-1" @click="showDeleteDialog = false">
              Cancel
            </Button>
            <Button variant="destructive" class="flex-1" @click="handleDeleteTemplate">
              Delete
            </Button>
          </div>
        </MobileDialogContent>
      </Dialog>
    </template>
  </div>
</template>
