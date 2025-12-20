<script setup lang="ts">
import type { Exercise } from '@/composables/useExerciseSearch'
import type { TimedBlockKind } from '@/types/blocks'

import { Activity, Clock, Gauge, RefreshCcw, Zap } from 'lucide-vue-next'
import { ref, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { RouteNames } from '@/router'
import type ExercisePickerContent from '@/components/ExercisePickerContent.vue'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BLOCK_COLORS, BLOCK_LABELS } from '@/types/blocks'

const { t } = useI18n()

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  'add-exercise': [exercise: Exercise]
  'add-timed-block': [kind: TimedBlockKind]
  'add-cardio-block': []
}>()

const router = useRouter()
const activeTab = ref('exercises')
const pickerContent = useTemplateRef<InstanceType<typeof ExercisePickerContent>>('pickerContent')

// Reset state when dialog opens
watch(open, (isOpen) => {
  if (isOpen) {
    pickerContent.value?.reset()
  }
})

const timedBlockTypes: ReadonlyArray<{
  kind: TimedBlockKind
  icon: typeof Clock
  description: string
  color: { bg: string; text: string; accent: string }
}> = [
  {
    kind: 'amrap',
    icon: RefreshCcw,
    description: 'As Many Rounds As Possible in a set time',
    color: BLOCK_COLORS.amrap,
  },
  {
    kind: 'emom',
    icon: Clock,
    description: 'Every Minute On the Minute',
    color: BLOCK_COLORS.emom,
  },
  {
    kind: 'tabata',
    icon: Zap,
    description: '20s work / 10s rest intervals',
    color: BLOCK_COLORS.tabata,
  },
  {
    kind: 'fortime',
    icon: Gauge,
    description: 'Complete the work as fast as possible',
    color: BLOCK_COLORS.fortime,
  },
]

function handleSelectExercise(exercise: Exercise) {
  emit('add-exercise', exercise)
  open.value = false
}

function handleSelectTimedBlock(kind: TimedBlockKind) {
  // Don't set open.value = false here - the parent will change activeDialog
  // which will automatically close this dialog via the computed getter
  emit('add-timed-block', kind)
}

function handleSelectCardio() {
  emit('add-cardio-block')
}

function handleCreateNew() {
  open.value = false
  router.push({ name: RouteNames.CreateCustomExercise })
}

function handleOpenChange(value: boolean) {
  open.value = value
  if (!value) {
    activeTab.value = 'exercises'
  }
}
</script>

<template>
  <Dialog v-model:open="open" @update:open="handleOpenChange">
    <MobileDialogContent
      class="max-w-md h-[100dvh] sm:h-auto sm:max-h-[85vh] flex flex-col rounded-t-none sm:rounded-lg"
    >
      <DialogHeader>
        <DialogTitle>{{ t('dialogs.addBlock.title') }}</DialogTitle>
        <DialogDescription> {{ t('dialogs.addBlock.description') }} </DialogDescription>
      </DialogHeader>

      <Tabs v-model="activeTab" class="flex-1 flex flex-col min-h-0">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="exercises">{{ t('dialogs.addBlock.exercisesTab') }}</TabsTrigger>
          <TabsTrigger value="timed">{{ t('dialogs.addBlock.timedBlocksTab') }}</TabsTrigger>
        </TabsList>

        <!-- Exercises Tab -->
        <TabsContent value="exercises" class="flex-1 flex flex-col min-h-0 mt-4">
          <ExercisePickerContent
            ref="pickerContent"
            show-create
            search-placeholder="dialogs.addBlock.searchPlaceholder"
            empty-message="dialogs.addBlock.noResults"
            create-button-text="dialogs.addBlock.createCustomExercise"
            @select="handleSelectExercise"
            @create="handleCreateNew"
          />
        </TabsContent>

        <!-- Timed Blocks Tab -->
        <TabsContent value="timed" class="flex-1 flex flex-col min-h-0 mt-4">
          <div class="space-y-3">
            <button
              v-for="blockType in timedBlockTypes"
              :key="blockType.kind"
              :class="[
                'w-full flex items-center gap-4 p-4 rounded-xl transition-colors text-left border',
                blockType.color.bg,
                'hover:brightness-110',
                'border-current/20',
              ]"
              @click="handleSelectTimedBlock(blockType.kind)"
            >
              <div
                :class="[
                  'flex items-center justify-center w-12 h-12 rounded-lg',
                  blockType.color.bg,
                  blockType.color.text,
                ]"
              >
                <component :is="blockType.icon" class="size-6" />
              </div>
              <div class="flex-1">
                <p :class="['font-semibold text-lg', blockType.color.text]">
                  {{ BLOCK_LABELS[blockType.kind] }}
                </p>
                <p class="text-sm text-muted-foreground">{{ blockType.description }}</p>
              </div>
              <span :class="[blockType.color.text, 'opacity-50 text-xl']">›</span>
            </button>

            <!-- Cardio Block -->
            <button
              class="w-full flex items-center gap-4 p-4 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors text-left border border-cyan-500/20"
              @click="handleSelectCardio"
            >
              <div
                class="flex items-center justify-center w-12 h-12 rounded-lg bg-cyan-500/20 text-cyan-500"
              >
                <Activity class="size-6" />
              </div>
              <div class="flex-1">
                <p class="font-semibold text-lg text-cyan-500">{{ BLOCK_LABELS.cardio }}</p>
                <p class="text-sm text-muted-foreground">{{ t('dialogs.addBlock.cardioDescription') }}</p>
              </div>
              <span class="text-cyan-500/50 text-xl">›</span>
            </button>
          </div>

          <Separator class="my-4" />

          <div class="text-center text-sm text-muted-foreground">
            <p>{{ t('dialogs.addBlock.timedBlocksInfo') }}</p>
            <p class="mt-1">{{ t('dialogs.addBlock.timedBlocksMixing') }}</p>
          </div>
        </TabsContent>
      </Tabs>
    </MobileDialogContent>
  </Dialog>
</template>
