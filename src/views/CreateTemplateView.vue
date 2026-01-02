<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { RouteNames } from '@/router'
import {
  AddBlockDialog,
  ConfigureAmrapDialog,
  ConfigureEmomDialog,
  ConfigureTabataDialog,
  ConfigureForTimeDialog,
  ConfigureCardioDialog,
} from '@/components/blocks'
import TemplateBlockList from '@/features/templates/components/TemplateBlockList.vue'
import PageLayout from '@/components/PageLayout.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTemplateCreation } from '@/features/templates/composables/useTemplateCreation'
import { useFormDraft } from '@/composables/useFormDraft'
import { useDialogState } from '@/composables/useDialogState'
import { Trash2 } from 'lucide-vue-next'
import type {
  AmrapConfig,
  BlockExercise,
  CardioConfig,
  EmomConfig,
  ForTimeConfig,
  TabataConfig,
  TimedBlockKind,
} from '@/types/blocks'

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

// Dialog state management
type TemplateDialog =
  | 'addBlock'
  | 'configureAmrap'
  | 'configureEmom'
  | 'configureTabata'
  | 'configureForTime'
  | 'configureCardio'

const { createDialogModel, open: openDialog } = useDialogState<TemplateDialog>()

const addBlockDialogOpen = createDialogModel('addBlock')
const configureAmrapOpen = createDialogModel('configureAmrap')
const configureEmomOpen = createDialogModel('configureEmom')
const configureTabataOpen = createDialogModel('configureTabata')
const configureForTimeOpen = createDialogModel('configureForTime')
const configureCardioOpen = createDialogModel('configureCardio')

// Handlers
function handleAddTimedBlock(kind: TimedBlockKind): void {
  const dialogMap: Record<TimedBlockKind, TemplateDialog> = {
    amrap: 'configureAmrap',
    emom: 'configureEmom',
    tabata: 'configureTabata',
    fortime: 'configureForTime',
  }
  openDialog(dialogMap[kind])
}

function handleAddCardioBlock(): void {
  openDialog('configureCardio')
}

function handleConfirmAmrap(config: AmrapConfig, exercises: ReadonlyArray<BlockExercise>): void {
  addAmrapBlock(config, exercises)
}

function handleConfirmEmom(config: EmomConfig, exercises: ReadonlyArray<BlockExercise>): void {
  addEmomBlock(config, exercises)
}

function handleConfirmTabata(config: TabataConfig, exercise: BlockExercise): void {
  addTabataBlock(config, exercise)
}

function handleConfirmForTime(config: ForTimeConfig, exercises: ReadonlyArray<BlockExercise>): void {
  addForTimeBlock(config, exercises)
}

function handleConfirmCardio(config: CardioConfig): void {
  addCardioBlock(config)
}

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
          <h2 class="text-lg font-semibold">{{ t('workouts.templates.blocks') }}</h2>
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

        <Button variant="outline" class="w-full" @click="openDialog('addBlock')">
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
    <AddBlockDialog
      v-model:open="addBlockDialogOpen"
      @add-exercise="addStrengthBlock"
      @add-timed-block="handleAddTimedBlock"
      @add-cardio-block="handleAddCardioBlock"
    />

    <ConfigureAmrapDialog
      v-model:open="configureAmrapOpen"
      @confirm="handleConfirmAmrap"
    />
    <ConfigureEmomDialog
      v-model:open="configureEmomOpen"
      @confirm="handleConfirmEmom"
    />
    <ConfigureTabataDialog
      v-model:open="configureTabataOpen"
      @confirm="handleConfirmTabata"
    />
    <ConfigureForTimeDialog
      v-model:open="configureForTimeOpen"
      @confirm="handleConfirmForTime"
    />
    <ConfigureCardioDialog
      v-model:open="configureCardioOpen"
      @confirm="handleConfirmCardio"
    />
  </PageLayout>
</template>
