<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ClipboardList, History, Plus } from '@lucide/vue'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getTemplatesRepository, getWorkoutsRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'
import { getCurrentLocale } from '@/lib/dateLocale'
import type { DbWorkoutTemplate, DbCompletedWorkout } from '@/db/schema'

const emit = defineEmits<{
  select: [source: 'template' | 'history' | 'blank', id?: string]
}>()

const { t } = useI18n()

const templateDialogOpen = ref(false)
const historyDialogOpen = ref(false)
const templates = ref<ReadonlyArray<DbWorkoutTemplate>>([])
const recentWorkouts = ref<ReadonlyArray<DbCompletedWorkout>>([])

onMounted(async () => {
  // Load templates and recent workouts for the dialogs
  const [templatesError, templatesData] = await tryCatch(getTemplatesRepository().getAll())
  if (!templatesError && templatesData) {
    templates.value = templatesData
  }

  const [workoutsError, workoutsData] = await tryCatch(
    getWorkoutsRepository().getHistory({ limit: 20 }),
  )
  if (!workoutsError && workoutsData) {
    recentWorkouts.value = workoutsData
  }
})

function handleFromTemplate() {
  templateDialogOpen.value = true
}

function handleFromHistory() {
  historyDialogOpen.value = true
}

function handleBlank() {
  emit('select', 'blank')
}

function selectTemplate(template: DbWorkoutTemplate) {
  templateDialogOpen.value = false
  emit('select', 'template', template.id)
}

function selectWorkout(workout: DbCompletedWorkout) {
  historyDialogOpen.value = false
  emit('select', 'history', workout.id)
}

function formatDate(timestamp: number): string {
  const locale = getCurrentLocale()
  return new Date(timestamp).toLocaleDateString(locale === 'en' ? 'en-US' : 'de-DE', {
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-muted-foreground text-sm text-center">
      {{ t('logPastWorkout.sourcePrompt', 'How would you like to start?') }}
    </p>

    <div class="grid gap-3">
      <!-- From Template -->
      <Card
        role="button"
        tabindex="0"
        class="cursor-pointer hover:bg-accent/50 transition-colors"
        @click="handleFromTemplate"
        @keydown.enter="handleFromTemplate"
        @keydown.space.prevent="handleFromTemplate"
      >
        <CardHeader class="flex-row items-center gap-4 p-4">
          <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <ClipboardList class="w-5 h-5 text-primary" />
          </div>
          <div class="flex-1">
            <CardTitle class="text-base">{{
              t('logPastWorkout.fromTemplate', 'From Template')
            }}</CardTitle>
            <CardDescription class="text-xs">{{
              t('logPastWorkout.fromTemplateDesc', 'Start from a saved template')
            }}</CardDescription>
          </div>
        </CardHeader>
      </Card>

      <!-- From History -->
      <Card
        role="button"
        tabindex="0"
        class="cursor-pointer hover:bg-accent/50 transition-colors"
        @click="handleFromHistory"
        @keydown.enter="handleFromHistory"
        @keydown.space.prevent="handleFromHistory"
      >
        <CardHeader class="flex-row items-center gap-4 p-4">
          <div class="w-10 h-10 rounded-full bg-highlight/10 flex items-center justify-center">
            <History class="w-5 h-5 text-highlight" />
          </div>
          <div class="flex-1">
            <CardTitle class="text-base">{{
              t('logPastWorkout.fromHistory', 'From History')
            }}</CardTitle>
            <CardDescription class="text-xs">{{
              t('logPastWorkout.fromHistoryDesc', 'Copy a previous workout')
            }}</CardDescription>
          </div>
        </CardHeader>
      </Card>

      <!-- Blank Workout -->
      <Card
        role="button"
        tabindex="0"
        class="cursor-pointer hover:bg-accent/50 transition-colors"
        @click="handleBlank"
        @keydown.enter="handleBlank"
        @keydown.space.prevent="handleBlank"
      >
        <CardHeader class="flex-row items-center gap-4 p-4">
          <div class="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
            <Plus class="w-5 h-5 text-success" />
          </div>
          <div class="flex-1">
            <CardTitle class="text-base">{{
              t('logPastWorkout.blankWorkout', 'Blank Workout')
            }}</CardTitle>
            <CardDescription class="text-xs">{{
              t('logPastWorkout.blankWorkoutDesc', 'Build from scratch')
            }}</CardDescription>
          </div>
        </CardHeader>
      </Card>
    </div>

    <!-- Template Selection Dialog -->
    <Dialog v-model:open="templateDialogOpen">
      <DialogContent class="max-h-[80dvh]">
        <DialogHeader>
          <DialogTitle>{{ t('logPastWorkout.selectTemplate', 'Select Template') }}</DialogTitle>
          <DialogDescription class="sr-only">
            {{ t('logPastWorkout.selectTemplateDesc', 'Choose a template to start your workout') }}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea class="max-h-[60dvh]">
          <div class="space-y-2 pr-4">
            <Button
              v-for="template in templates"
              :key="template.id"
              variant="ghost"
              class="w-full justify-start h-auto py-3"
              @click="selectTemplate(template)"
            >
              <div class="text-left">
                <div class="font-medium">{{ template.name }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ template.blocks.length }} {{ t('common.exercises', 'exercises') }}
                </div>
              </div>
            </Button>
            <p v-if="templates.length === 0" class="text-center text-muted-foreground py-4">
              {{ t('logPastWorkout.noTemplates', 'No templates yet') }}
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>

    <!-- History Selection Dialog -->
    <Dialog v-model:open="historyDialogOpen">
      <DialogContent class="max-h-[80dvh]">
        <DialogHeader>
          <DialogTitle>{{ t('logPastWorkout.selectWorkout', 'Select Workout') }}</DialogTitle>
          <DialogDescription class="sr-only">
            {{ t('logPastWorkout.selectWorkoutDesc', 'Choose a previous workout to copy') }}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea class="max-h-[60dvh]">
          <div class="space-y-2 pr-4">
            <Button
              v-for="workout in recentWorkouts"
              :key="workout.id"
              variant="ghost"
              class="w-full justify-start h-auto py-3"
              @click="selectWorkout(workout)"
            >
              <div class="text-left">
                <div class="font-medium">{{ workout.name }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ formatDate(workout.completedAt) }} - {{ workout.blocks.length }}
                  {{ t('common.blocks', 'blocks') }}
                </div>
              </div>
            </Button>
            <p v-if="recentWorkouts.length === 0" class="text-center text-muted-foreground py-4">
              {{ t('logPastWorkout.noWorkouts', 'No workout history yet') }}
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  </div>
</template>
