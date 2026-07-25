<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { RouteNames } from '@/router'
import { WorkoutBlockDialogs } from '@/blocks/ui'
import TemplateBlockList from '@/features/templates/components/TemplateBlockList.vue'
import PageLayout from '@/components/PageLayout.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTemplateCreation } from '@/features/templates/composables/useTemplateCreation'
import { useFormDraft } from '@/composables/useFormDraft'
import { useWorkoutBlockDialogs } from '@/blocks/ui/useWorkoutBlockDialogs'
import { Trash2 } from '@lucide/vue'

const router = useRouter()
const { t } = useI18n()

const {
  templateName,
  blocks,
  formState,
  isSaving,
  isValid,
  reset,
  addStrengthBlock,
  addAmrapBlock,
  addEmomBlock,
  addTabataBlock,
  addForTimeBlock,
  addCardioBlock,
  removeBlock,
  updateBlocks,
  reorderBlocks,
  save,
} = useTemplateCreation()

// Auto-save draft to IndexedDB
const { hasDraft, clearDraft } = useFormDraft('template-create', formState, {
  isEmpty: (state) => !state.name && state.blocks.length === 0,
})

const {
  addBlockDialogOpen,
  configureAmrapOpen,
  configureEmomOpen,
  configureTabataOpen,
  configureForTimeOpen,
  configureCardioOpen,
  openAddBlockDialog,
  openTimedBlockDialog,
  openCardioBlockDialog,
} = useWorkoutBlockDialogs()

function handleDiscard(): void {
  reset()
  clearDraft()
}

async function handleSave(): Promise<void> {
  const template = await save()
  if (template) {
    await clearDraft()
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

      <!-- Blocks section -->
      <div class="mb-6 flex flex-1 flex-col">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-section-title font-semibold">{{ t('workouts.templates.blocks') }}</h2>
          <span class="text-sm text-muted-foreground">{{ blocks.length }}</span>
        </div>

        <div v-if="blocks.length > 0" class="mb-4 flex-1 overflow-y-auto">
          <TemplateBlockList
            :blocks="blocks"
            @update:blocks="updateBlocks"
            @remove-block="removeBlock"
            @reorder="reorderBlocks"
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

        <Button variant="outline" class="w-full" @click="openAddBlockDialog">
          + {{ t('workouts.templates.addBlock') }}
        </Button>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-3 p-4">
        <Button variant="outline" class="flex-1" :disabled="isSaving" @click="handleCancel">
          {{ t('common.buttons.cancel') }}
        </Button>
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
        <Button class="flex-1" :disabled="!isValid || isSaving" @click="handleSave">
          {{ isSaving ? t('common.states.saving') : t('workouts.templates.saveTemplate') }}
        </Button>
      </div>
    </template>

    <!-- Dialogs -->
    <WorkoutBlockDialogs
      v-model:add-block-open="addBlockDialogOpen"
      v-model:amrap-open="configureAmrapOpen"
      v-model:emom-open="configureEmomOpen"
      v-model:tabata-open="configureTabataOpen"
      v-model:for-time-open="configureForTimeOpen"
      v-model:cardio-open="configureCardioOpen"
      @add-exercise="addStrengthBlock"
      @add-timed-block="openTimedBlockDialog"
      @add-cardio-block="openCardioBlockDialog"
      @confirm-amrap="addAmrapBlock"
      @confirm-emom="addEmomBlock"
      @confirm-tabata="addTabataBlock"
      @confirm-for-time="addForTimeBlock"
      @confirm-cardio="addCardioBlock"
    />
  </PageLayout>
</template>
