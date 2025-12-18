<script setup lang="ts">
import type { Exercise } from '@/composables/useExerciseSearch'
import type { Muscle } from '@/types/exercises'
import type { TimedBlockKind } from '@/types/blocks'

import { Activity, Repeat, Search, Timer, X, Zap } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { RouteNames } from '@/router'
import ExerciseListItem from '@/components/ExerciseListItem.vue'
import ExerciseMuscleFilter from '@/components/ExerciseMuscleFilter.vue'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Empty, EmptyDescription, EmptyMedia } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useExerciseSearch } from '@/composables/useExerciseSearch'
import { BLOCK_ICONS, BLOCK_LABELS } from '@/types/blocks'

const { t } = useI18n()

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  'add-exercise': [exercise: Exercise]
  'add-timed-block': [kind: TimedBlockKind]
  'add-cardio-block': []
}>()

const router = useRouter()
const activeTab = ref('exercises')
const muscleFilter = ref<Muscle | 'all'>('all')
const { searchQuery, filteredExercises } = useExerciseSearch({
  muscleFilter,
})

// Reset state when dialog opens
watch(open, (isOpen) => {
  if (isOpen) {
    searchQuery.value = ''
    muscleFilter.value = 'all'
  }
})

const timedBlockTypes: ReadonlyArray<{
  kind: TimedBlockKind
  icon: typeof Timer
  description: string
}> = [
  {
    kind: 'amrap',
    icon: Repeat,
    description: 'As Many Rounds As Possible in a set time',
  },
  {
    kind: 'emom',
    icon: Timer,
    description: 'Every Minute On the Minute',
  },
  {
    kind: 'tabata',
    icon: Zap,
    description: '20s work / 10s rest intervals',
  },
  {
    kind: 'fortime',
    icon: Timer,
    description: 'Complete the work as fast as possible',
  },
]

function handleSelectExercise(exercise: Exercise) {
  emit('add-exercise', exercise)
  open.value = false
  searchQuery.value = ''
  muscleFilter.value = 'all'
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
  searchQuery.value = ''
  muscleFilter.value = 'all'
  router.push({ name: RouteNames.CreateCustomExercise })
}

function handleOpenChange(value: boolean) {
  open.value = value
  if (!value) {
    searchQuery.value = ''
    muscleFilter.value = 'all'
    activeTab.value = 'exercises'
  }
}
</script>

<template>
  <Dialog v-model:open="open" @update:open="handleOpenChange">
    <MobileDialogContent
      class="max-w-md h-[100dvh] sm:h-auto sm:max-h-[85vh] flex flex-col rounded-t-none sm:rounded-lg"
    >
      <DialogHeader class="relative">
        <DialogTitle>{{ t('dialogs.addBlock.title') }}</DialogTitle>
        <DialogDescription> {{ t('dialogs.addBlock.description') }} </DialogDescription>
        <DialogClose
          class="absolute right-0 top-0 p-2 rounded-full hover:bg-muted transition-colors"
        >
          <X class="icon-md text-muted-foreground" />
          <span class="sr-only">{{ t('common.buttons.close') }}</span>
        </DialogClose>
      </DialogHeader>

      <Tabs v-model="activeTab" class="flex-1 flex flex-col min-h-0">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="exercises">{{ t('dialogs.addBlock.exercisesTab') }}</TabsTrigger>
          <TabsTrigger value="timed">{{ t('dialogs.addBlock.timedBlocksTab') }}</TabsTrigger>
        </TabsList>

        <!-- Exercises Tab -->
        <TabsContent value="exercises" class="flex-1 flex flex-col min-h-0 mt-4">
          <!-- Search Input -->
          <div class="relative">
            <Search
              class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Input
              v-model="searchQuery"
              :placeholder="t('dialogs.addBlock.searchPlaceholder')"
              class="w-full pl-10 h-12 text-base bg-muted/50 border-transparent focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
              autofocus
            />
          </div>

          <!-- Filter Pills -->
          <ExerciseMuscleFilter v-model="muscleFilter" class="-mx-4 px-4 mt-3" />

          <!-- Exercise List -->
          <div class="flex-1 overflow-y-auto -mx-4 px-4 mt-4">
            <div class="space-y-1">
              <ExerciseListItem
                v-for="exercise in filteredExercises"
                :key="exercise.id ?? exercise.name"
                :exercise="exercise"
                @select="handleSelectExercise"
              />
            </div>

            <!-- Empty State -->
            <Empty v-if="filteredExercises.length === 0" class="border-0 py-12">
              <EmptyMedia variant="icon" class="bg-muted text-muted-foreground">
                <Search class="size-5" aria-hidden="true" />
              </EmptyMedia>
              <EmptyDescription>
                {{ t('dialogs.addBlock.noResults', { query: searchQuery }) }}
              </EmptyDescription>
            </Empty>
          </div>

          <!-- Create Custom Exercise Button -->
          <div class="pt-4 border-t border-border flex-shrink-0">
            <Button variant="default" class="w-full" @click="handleCreateNew">
              {{ t('dialogs.addBlock.createCustomExercise') }}
            </Button>
          </div>
        </TabsContent>

        <!-- Timed Blocks Tab -->
        <TabsContent value="timed" class="flex-1 flex flex-col min-h-0 mt-4">
          <div class="space-y-3">
            <button
              v-for="blockType in timedBlockTypes"
              :key="blockType.kind"
              class="w-full flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left"
              @click="handleSelectTimedBlock(blockType.kind)"
            >
              <div
                class="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary"
              >
                <span class="text-2xl">{{ BLOCK_ICONS[blockType.kind] }}</span>
              </div>
              <div class="flex-1">
                <p class="font-semibold text-lg">{{ BLOCK_LABELS[blockType.kind] }}</p>
                <p class="text-sm text-muted-foreground">{{ blockType.description }}</p>
              </div>
              <span class="text-muted-foreground/50 text-xl">›</span>
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
