<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { RouteNames } from '@/router'
import { WorkoutExercisePicker } from '@/features/workout'
import TemplateExerciseList from '@/features/templates/components/TemplateExerciseList.vue'
import type { TemplateExercise } from '@/features/templates/components/TemplateExerciseList.vue'
import PageLayout from '@/components/PageLayout.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { templatesRepository } from '@/db/repositories/templates'
import { popularExercises } from '@/data/popularExercises'
import { tryCatch } from '@/lib/tryCatch'

const router = useRouter()
const { t } = useI18n()

const templateName = ref('')
const exercises = ref<ReadonlyArray<TemplateExercise>>([])
const isAddExerciseOpen = ref(false)
const isSaving = ref(false)

const isValid = computed(() => templateName.value.trim().length > 0 && exercises.value.length > 0)

function handleAddExercise(exercise: { name: string; icon: string }): void {
  const popularExercise = popularExercises.find((ex) => ex.name === exercise.name)
  if (!popularExercise) return

  // Generate unique ID for this exercise in the template
  const exerciseId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`

  const newExercise: TemplateExercise = {
    exerciseId,
    name: exercise.name,
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
  const [error, template] = await tryCatch(
    templatesRepository.create({
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
    }),
  )

  if (error) {
    isSaving.value = false
    return
  }

  await router.push({ name: RouteNames.TemplateDetail, params: { id: template.id } })
  isSaving.value = false
}

function handleCancel(): void {
  router.back()
}
</script>

<template>
  <PageLayout :title="t('workouts.templates.create')" :subtitle="t('workouts.templates.subtitle')">
    <div class="flex flex-1 flex-col p-4">
      <!-- Template name input -->
      <div class="mb-6">
        <label for="template-name" class="mb-2 block text-sm font-medium">{{
          t('workouts.templates.name')
        }}</label>
        <Input
          id="template-name"
          v-model="templateName"
          :placeholder="t('workouts.templates.namePlaceholder')"
          class="w-full"
        />
      </div>

      <!-- Exercises section -->
      <div class="mb-6 flex flex-1 flex-col">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold">{{ t('workouts.templates.exercises') }}</h2>
          <span class="text-sm text-muted-foreground">{{ exercises.length }}</span>
        </div>

        <div v-if="exercises.length > 0" class="mb-4 flex-1 overflow-y-auto">
          <TemplateExerciseList
            :exercises="exercises"
            @update:exercises="handleExercisesUpdate"
            @remove-exercise="handleRemoveExercise"
          />
        </div>

        <div
          v-else
          class="mb-4 flex flex-1 items-center justify-center text-center text-muted-foreground"
        >
          <div>
            <p class="mb-2">{{ t('workouts.templates.empty.title') }}</p>
            <p class="text-sm">{{ t('workouts.templates.empty.description') }}</p>
          </div>
        </div>

        <Button variant="outline" class="w-full" @click="isAddExerciseOpen = true">
          + {{ t('workouts.templates.addExercise') }}
        </Button>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-3 p-4">
        <Button variant="outline" class="flex-1" :disabled="isSaving" @click="handleCancel">
          {{ t('common.buttons.cancel') }}
        </Button>
        <Button class="flex-1" :disabled="!isValid || isSaving" @click="handleSave">
          {{ isSaving ? t('common.states.saving') : t('workouts.templates.saveTemplate') }}
        </Button>
      </div>
    </template>

    <!-- Add Exercise Dialog -->
    <WorkoutExercisePicker
      v-model:open="isAddExerciseOpen"
      presentation="dialog"
      :show-create="true"
      @select="handleAddExercise"
    />
  </PageLayout>
</template>
