<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import WorkoutAddExerciseDialog from '@/components/workout/WorkoutAddExerciseDialog.vue'
import TemplateExerciseList from '@/components/templates/TemplateExerciseList.vue'
import type { TemplateExercise } from '@/components/templates/TemplateExerciseList.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { templatesRepository } from '@/db/repositories/templates'
import { popularExercises } from '@/data/popularExercises'

const router = useRouter()

const templateName = ref('')
const exercises = ref<ReadonlyArray<TemplateExercise>>([])
const isAddExerciseOpen = ref(false)
const isSaving = ref(false)

const isValid = computed(() => templateName.value.trim().length > 0 && exercises.value.length > 0)

function handleAddExercise(exerciseName: string): void {
  const popularExercise = popularExercises.find((ex) => ex.name === exerciseName)
  if (!popularExercise) return

  // Generate unique ID for this exercise in the template
  const exerciseId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`

  const newExercise: TemplateExercise = {
    exerciseId,
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

async function handleSave(): Promise<void> {
  if (!isValid.value || isSaving.value) return

  isSaving.value = true
  try {
    const template = await templatesRepository.create({
      name: templateName.value.trim(),
      exercises: exercises.value.map((ex) => ({
        exerciseDefinitionId: null,
        name: ex.name,
        equipment: ex.equipment,
        targetReps: 8,
        thumbnail: ex.thumbnail,
        defaultSetCount: ex.defaultSetCount,
      })),
    })

    await router.push(`/templates/${template.id}`)
  } finally {
    isSaving.value = false
  }
}

function handleCancel(): void {
  router.back()
}
</script>

<template>
  <div class="flex-1 p-4 flex flex-col">
    <!-- Header -->
    <Card class="mb-6">
      <CardContent class="pt-6">
        <h1 class="text-3xl font-bold mb-2">Create Template</h1>
        <p class="text-muted-foreground">Build a new workout template from scratch</p>
      </CardContent>
    </Card>

    <!-- Template name input -->
    <div class="mb-6">
      <label for="template-name" class="block text-sm font-medium mb-2">Template Name</label>
      <Input
        id="template-name"
        v-model="templateName"
        placeholder="e.g., Upper Body Day"
        class="w-full"
      />
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

      <div
        v-else
        class="flex-1 flex items-center justify-center text-center text-muted-foreground mb-4"
      >
        <div>
          <p class="mb-2">No exercises yet</p>
          <p class="text-sm">Add exercises to build your template</p>
        </div>
      </div>

      <Button variant="outline" class="w-full" @click="isAddExerciseOpen = true">
        + Add Exercise
      </Button>
    </div>

    <!-- Action buttons -->
    <div class="flex gap-3">
      <Button variant="outline" class="flex-1" @click="handleCancel" :disabled="isSaving">
        Cancel
      </Button>
      <Button class="flex-1" :disabled="!isValid || isSaving" @click="handleSave">
        {{ isSaving ? 'Saving...' : 'Save Template' }}
      </Button>
    </div>

    <!-- Add Exercise Dialog -->
    <WorkoutAddExerciseDialog
      :open="isAddExerciseOpen"
      @update:open="isAddExerciseOpen = $event"
      @add="handleAddExercise"
    />
  </div>
</template>
