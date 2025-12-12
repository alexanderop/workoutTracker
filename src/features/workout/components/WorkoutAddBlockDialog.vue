<script setup lang="ts">
import { Repeat, Search, Timer, Zap } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { RouteNames } from '@/router'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Empty, EmptyDescription, EmptyMedia } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import WorkoutAddBlockDialogExerciseItem from './WorkoutAddBlockDialogExerciseItem.vue'
import { useExercisesStore } from '@/stores/exercises'
import type { CustomExercise } from '@/types/exercises'
import type { TimedBlockKind } from '@/types/blocks'
import { BLOCK_ICONS, BLOCK_LABELS } from '@/types/blocks'

const { t } = useI18n()

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  'add-exercise': [exerciseId: string, name: string]
  'add-timed-block': [kind: TimedBlockKind]
}>()

const router = useRouter()
const exercisesStore = useExercisesStore()
const searchQuery = ref('')
const activeTab = ref('exercises')

const filteredExercises = computed(() => {
  const allExercises = exercisesStore.customExercises
  if (!searchQuery.value.trim()) {
    return allExercises
  }
  const query = searchQuery.value.toLowerCase()
  return allExercises.filter((ex) => ex.name.toLowerCase().includes(query))
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

function handleSelectExercise(exercise: CustomExercise) {
  emit('add-exercise', exercise.id, exercise.name)
  open.value = false
  searchQuery.value = ''
}

function handleSelectTimedBlock(kind: TimedBlockKind) {
  // Don't set open.value = false here - the parent will change activeDialog
  // which will automatically close this dialog via the computed getter
  emit('add-timed-block', kind)
}

function handleCreateNew() {
  open.value = false
  searchQuery.value = ''
  router.push({ name: RouteNames.CreateCustomExercise })
}

function handleOpenChange(value: boolean) {
  open.value = value
  if (!value) {
    searchQuery.value = ''
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
          <!-- Search Input -->
          <div class="relative">
            <Search
              class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
            />
            <Input
              v-model="searchQuery"
              :placeholder="t('dialogs.addBlock.searchPlaceholder')"
              class="w-full pl-10 h-12 text-base bg-muted/50 border-transparent focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
              autofocus
            />
          </div>

          <!-- Exercise List -->
          <div class="flex-1 overflow-y-auto -mx-4 px-4 mt-4">
            <WorkoutAddBlockDialogExerciseItem
              v-for="(exercise, index) in filteredExercises"
              :key="exercise.id"
              :exercise="exercise"
              :show-border="index !== filteredExercises.length - 1"
              @select="handleSelectExercise(exercise)"
            />

            <!-- Empty State -->
            <Empty v-if="filteredExercises.length === 0" class="border-0 py-12">
              <EmptyMedia variant="icon" class="bg-muted text-muted-foreground">
                <Search class="size-5" />
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
