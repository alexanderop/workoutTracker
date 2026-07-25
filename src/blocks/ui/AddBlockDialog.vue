<script setup lang="ts">
import type { Exercise } from '@/exercises/useExerciseSearch'
import type { TimedBlockKind } from '@/blocks'

import { Activity, Clock, Gauge, RefreshCcw, Zap } from '@lucide/vue'
import { ref, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { RouteNames } from '@/router'
import ExercisePickerContent from '@/exercises/ui/ExercisePickerContent.vue'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToastStore } from '@/stores/toast'
import { BLOCK_COLORS, BLOCK_LABELS } from '@/blocks'

const { t } = useI18n()

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  'add-exercise': [exercise: Exercise]
  'add-timed-block': [kind: TimedBlockKind]
  'add-cardio-block': []
}>()

const router = useRouter()
const toastStore = useToastStore()
const activeTab = ref('exercises')
// While the user is actively searching, the sheet's chrome (header, tabs)
// collapses on mobile so the on-screen keyboard leaves room for results.
const pickerCondensed = ref(false)
const pickerContent = useTemplateRef<InstanceType<typeof ExercisePickerContent>>('pickerContent')

// Reset state on open/close. The close branch lives here (not in an
// update:open handler) so it covers every close path, including handlers
// that assign `open.value = false` directly.
watch(open, (isOpen) => {
  if (isOpen) {
    pickerContent.value?.reset()
    return
  }
  activeTab.value = 'exercises'
  // The picker unmounts with the dialog, so it can't sync this back itself.
  pickerCondensed.value = false
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
  // Never-silent guarantee: the sheet closes immediately on selection, so a
  // toast is the only feedback the user gets that anything happened.
  toastStore.showToast(t('common.toast.exerciseAdded', { name: exercise.name }))
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
  router.push({ name: RouteNames.ExerciseForm })
}
</script>

<template>
  <Dialog v-model:open="open">
    <MobileDialogContent
      class="max-w-md h-[100dvh] sm:h-auto sm:max-h-[85vh] flex flex-col rounded-t-none sm:rounded-lg"
    >
      <!-- sr-only (not hidden) while condensed: the dialog's aria wiring keeps
           pointing at a title/description that still exists for screen readers. -->
      <DialogHeader :class="pickerCondensed && 'max-sm:sr-only'">
        <DialogTitle>{{ t('dialogs.addBlock.title') }}</DialogTitle>
        <DialogDescription> {{ t('dialogs.addBlock.description') }} </DialogDescription>
      </DialogHeader>

      <Tabs v-model="activeTab" class="flex-1 flex flex-col min-h-0">
        <TabsList :class="['grid w-full grid-cols-2', pickerCondensed && 'max-sm:hidden']">
          <TabsTrigger value="exercises">{{ t('dialogs.addBlock.exercisesTab') }}</TabsTrigger>
          <TabsTrigger value="timed">{{ t('dialogs.addBlock.timedBlocksTab') }}</TabsTrigger>
        </TabsList>

        <!-- Exercises Tab -->
        <TabsContent
          value="exercises"
          :class="['flex-1 flex flex-col min-h-0 mt-4', pickerCondensed && 'max-sm:mt-0']"
        >
          <ExercisePickerContent
            ref="pickerContent"
            v-model:condensed="pickerCondensed"
            show-create
            search-placeholder="dialogs.addBlock.searchPlaceholder"
            empty-message="dialogs.addBlock.noResults"
            create-button-text="dialogs.addBlock.createCustomExercise"
            @select="handleSelectExercise"
            @create="handleCreateNew"
          />
        </TabsContent>

        <!-- Timed Blocks Tab -->
        <TabsContent value="timed" class="flex-1 flex flex-col min-h-0 mt-4 overflow-y-auto">
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
              class="w-full flex items-center gap-4 p-4 rounded-xl bg-block-cardio/10 hover:bg-block-cardio/20 transition-colors text-left border border-block-cardio/20"
              @click="handleSelectCardio"
            >
              <div
                class="flex items-center justify-center w-12 h-12 rounded-lg bg-block-cardio/20 text-block-cardio"
              >
                <Activity class="size-6" />
              </div>
              <div class="flex-1">
                <p class="font-semibold text-lg text-block-cardio">{{ BLOCK_LABELS.cardio }}</p>
                <p class="text-sm text-muted-foreground">
                  {{ t('dialogs.addBlock.cardioDescription') }}
                </p>
              </div>
              <span class="text-block-cardio/50 text-xl">›</span>
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
