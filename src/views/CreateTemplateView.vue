<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { RouteNames } from '@/router'
import { WorkoutExercisePicker } from '@/features/workout'
import TemplateExerciseList from '@/features/templates/components/TemplateExerciseList.vue'
import PageLayout from '@/components/PageLayout.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTemplateCreation } from '@/features/templates/composables/useTemplateCreation'

const router = useRouter()
const { t } = useI18n()

const {
  templateName,
  exercises,
  isAddExerciseOpen,
  isSaving,
  isValid,
  addExercise,
  removeExercise,
  updateExercises,
  save,
} = useTemplateCreation()

async function handleSave(): Promise<void> {
  const template = await save()
  if (template) {
    await router.push({ name: RouteNames.TemplateDetail, params: { id: template.id } })
  }
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
            @update:exercises="updateExercises"
            @remove-exercise="removeExercise"
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
      @select="addExercise"
    />
  </PageLayout>
</template>
