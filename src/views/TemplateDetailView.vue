<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { RouteNames } from '@/router'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import PageLayout from '@/components/PageLayout.vue'
import TemplateExerciseList from '@/features/templates/components/TemplateExerciseList.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import ExercisePicker from '@/components/ExercisePicker.vue'
import { useTemplateDetail } from '@/features/templates/composables/useTemplateDetail'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const templateId = String(route.params.id)

const {
  state,
  templateName,
  exercises,
  isSaving,
  isStarting,
  isEdited,
  saveTemplate,
  deleteTemplate,
  startWorkout,
  addExercise,
  removeExercise,
  updateExercises,
} = useTemplateDetail(templateId)

// UI-only dialog states
const isAddExerciseOpen = ref(false)
const showDeleteDialog = ref(false)

// Redirect to workouts list if template not found
watch(
  () => state.value.status,
  (status) => {
    if (status === 'not-found') {
      router.push({ name: RouteNames.Workouts })
    }
  },
)

// Navigation handlers
async function handleStartWorkout(): Promise<void> {
  const success = await startWorkout()
  if (success) {
    router.push({ name: RouteNames.ActiveWorkout })
  }
}

async function handleDeleteTemplate(): Promise<void> {
  await deleteTemplate()
  router.push({ name: RouteNames.Workouts })
}

function handleCancel(): void {
  if (isEdited.value && !confirm('Discard changes?')) {
    return
  }
  router.back()
}

</script>

<template>
  <PageLayout
    :title="state.status === 'success' ? state.template.name : 'Template'"
    :subtitle="state.status === 'success' ? `${exercises.length} exercises` : undefined"
    back-to="/workouts"
  >
    <!-- Loading state -->
    <div v-if="state.status === 'loading'" class="flex items-center justify-center py-8">
      <div class="text-muted-foreground">{{ t('common.states.loading') }}</div>
    </div>

    <!-- Main content -->
    <div v-else-if="state.status === 'success'" class="flex flex-1 flex-col p-4">
      <!-- Template name input -->
      <div class="mb-6">
        <label for="template-name" class="mb-2 block text-sm font-medium">{{
          t('workouts.templates.name')
        }}</label>
        <Input id="template-name" v-model="templateName" class="w-full" />
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

        <Button variant="outline" class="w-full" @click="isAddExerciseOpen = true">
          {{ t('common.buttons.addExercise') }}
        </Button>
      </div>
    </div>

    <template v-if="state.status === 'success'" #footer>
      <div class="space-y-3 p-4">
        <!-- Start Workout button -->
        <Button
          class="w-full"
          size="lg"
          :disabled="isStarting || exercises.length === 0"
          @click="handleStartWorkout"
        >
          {{ isStarting ? t('workouts.templates.starting') : t('workouts.templates.startWorkout') }}
        </Button>

        <!-- Edit buttons -->
        <div v-if="isEdited" class="flex gap-3">
          <Button variant="outline" class="flex-1" :disabled="isSaving" @click="handleCancel">
            {{ t('common.buttons.cancel') }}
          </Button>
          <Button class="flex-1" :disabled="!isEdited || isSaving" @click="saveTemplate">
            {{ isSaving ? t('common.states.saving') : t('workouts.templates.saveChanges') }}
          </Button>
        </div>

        <!-- Delete button -->
        <Button
          variant="destructive"
          class="w-full"
          :disabled="isEdited"
          @click="showDeleteDialog = true"
        >
          {{ t('workouts.templates.deleteTemplate') }}
        </Button>
      </div>
    </template>

    <!-- Add Exercise Dialog -->
    <ExercisePicker
      v-model:open="isAddExerciseOpen"
      presentation="dialog"
      :show-create="true"
      @select="addExercise"
    />

    <!-- Delete Confirmation Dialog -->
    <Dialog :open="showDeleteDialog" @update:open="showDeleteDialog = $event">
      <MobileDialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('workouts.templates.deleteConfirmTitle') }}</DialogTitle>
          <DialogDescription>
            {{
              t('workouts.templates.deleteConfirmDescription', {
                name: state.status === 'success' ? state.template.name : '',
              })
            }}
          </DialogDescription>
        </DialogHeader>
        <div class="flex gap-3 pt-4">
          <Button variant="outline" class="flex-1" @click="showDeleteDialog = false">
            {{ t('common.buttons.cancel') }}
          </Button>
          <Button variant="destructive" class="flex-1" @click="handleDeleteTemplate">
            {{ t('common.buttons.delete') }}
          </Button>
        </div>
      </MobileDialogContent>
    </Dialog>
  </PageLayout>
</template>
