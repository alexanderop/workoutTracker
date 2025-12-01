<script setup lang="ts">
import { Plus, Search, Trash2, X } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { popularExercises } from '@/data/popularExercises'
import { generateId } from '@/db/index'
import type {
  AmrapConfig,
  BlockExercise,
  EmomConfig,
  ForTimeConfig,
  TabataConfig,
  TimedBlockKind,
} from '@/types/blocks'
import { BLOCK_ICONS, BLOCK_LABELS } from '@/types/blocks'
import WorkoutAmrapConfig, { type AmrapConfigModel } from './WorkoutAmrapConfig.vue'
import WorkoutEmomConfig, { type EmomConfigModel } from './WorkoutEmomConfig.vue'
import WorkoutForTimeConfig, { type ForTimeConfigModel } from './WorkoutForTimeConfig.vue'
import WorkoutTabataConfig, { type TabataConfigModel } from './WorkoutTabataConfig.vue'

type Props = {
  open: boolean
  blockKind: TimedBlockKind | null
}

type Emits = {
  'update:open': [value: boolean]
  'confirm-amrap': [config: AmrapConfig, exercises: ReadonlyArray<BlockExercise>]
  'confirm-emom': [config: EmomConfig, exercises: ReadonlyArray<BlockExercise>]
  'confirm-tabata': [config: TabataConfig, exercise: BlockExercise]
  'confirm-fortime': [config: ForTimeConfig, exercises: ReadonlyArray<BlockExercise>]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Config state for each block type
const amrapConfig = ref<AmrapConfigModel>({ durationMinutes: 12 })
const emomConfig = ref<EmomConfigModel>({ minutes: 10, rotation: 'full-round' })
const tabataConfig = ref<TabataConfigModel>({ rounds: 8, workSeconds: 20, restSeconds: 10 })
const fortimeConfig = ref<ForTimeConfigModel>({ hasCap: true, capMinutes: 15 })

// Exercises for multi-exercise blocks
const blockExercises = ref<Array<BlockExercise>>([])

// Single exercise for Tabata
const tabataExercise = ref<BlockExercise | null>(null)

// Exercise picker state
const showExercisePicker = ref(false)
const exerciseSearch = ref('')

const filteredExercises = computed(() => {
  if (!exerciseSearch.value.trim()) {
    return popularExercises.slice(0, 10)
  }
  const query = exerciseSearch.value.toLowerCase()
  return popularExercises.filter((ex) => ex.name.toLowerCase().includes(query)).slice(0, 10)
})

// Reset state when dialog opens
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      resetConfig()
    }
  },
)

function resetConfig() {
  amrapConfig.value = { durationMinutes: 12 }
  emomConfig.value = { minutes: 10, rotation: 'full-round' }
  tabataConfig.value = { rounds: 8, workSeconds: 20, restSeconds: 10 }
  fortimeConfig.value = { hasCap: true, capMinutes: 15 }
  blockExercises.value = []
  tabataExercise.value = null
  showExercisePicker.value = false
  exerciseSearch.value = ''
}

function addExercise(name: string, icon: string) {
  const newExercise: BlockExercise = {
    id: generateId(),
    name,
    prescribedReps: 10,
    load: null,
    thumbnail: icon,
  }

  if (props.blockKind === 'tabata') {
    tabataExercise.value = newExercise
    showExercisePicker.value = false
    exerciseSearch.value = ''
    return
  }

  blockExercises.value = [...blockExercises.value, newExercise]
  showExercisePicker.value = false
  exerciseSearch.value = ''
}

function removeExercise(index: number) {
  blockExercises.value = blockExercises.value.filter((_, i) => i !== index)
}

function updateExerciseReps(index: number, reps: number) {
  const exercise = blockExercises.value[index]
  if (exercise) {
    exercise.prescribedReps = reps
  }
}

function updateExerciseLoad(index: number, load: string) {
  const exercise = blockExercises.value[index]
  if (exercise) {
    exercise.load = load || null
  }
}

function handleConfirm() {
  switch (props.blockKind) {
    case 'amrap':
      emit(
        'confirm-amrap',
        { durationSeconds: amrapConfig.value.durationMinutes * 60 },
        blockExercises.value,
      )
      break
    case 'emom':
      emit(
        'confirm-emom',
        { minutes: emomConfig.value.minutes, exerciseRotation: emomConfig.value.rotation },
        blockExercises.value,
      )
      break
    case 'tabata':
      if (tabataExercise.value) {
        emit(
          'confirm-tabata',
          {
            rounds: tabataConfig.value.rounds,
            workSeconds: tabataConfig.value.workSeconds,
            restSeconds: tabataConfig.value.restSeconds,
          },
          tabataExercise.value,
        )
      }
      break
    case 'fortime':
      emit(
        'confirm-fortime',
        { timeCapSeconds: fortimeConfig.value.hasCap ? fortimeConfig.value.capMinutes * 60 : null },
        blockExercises.value,
      )
      break
  }
  emit('update:open', false)
}

const canConfirm = computed(() => {
  if (props.blockKind === 'tabata') {
    return tabataExercise.value !== null
  }
  return blockExercises.value.length > 0
})

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <MobileDialogContent
      :show-close-button="false"
      class="max-w-md h-[100dvh] sm:h-auto sm:max-h-[85vh] flex flex-col rounded-t-none sm:rounded-lg"
    >
      <!-- Close button -->
      <button
        class="absolute right-4 top-4 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-10"
        @click="handleClose"
      >
        <X class="size-5" />
        <span class="sr-only">Close</span>
      </button>

      <DialogHeader>
        <div class="flex items-center gap-2">
          <span class="text-2xl">{{ blockKind ? BLOCK_ICONS[blockKind] : '' }}</span>
          <DialogTitle>Configure {{ blockKind ? BLOCK_LABELS[blockKind] : '' }}</DialogTitle>
        </div>
        <DialogDescription> Set the duration and add exercises for this block </DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto space-y-6 py-4">
        <!-- Block-specific config -->
        <WorkoutAmrapConfig v-if="blockKind === 'amrap'" v-model="amrapConfig" />
        <WorkoutEmomConfig v-else-if="blockKind === 'emom'" v-model="emomConfig" />
        <WorkoutTabataConfig v-else-if="blockKind === 'tabata'" v-model="tabataConfig" />
        <WorkoutForTimeConfig v-else-if="blockKind === 'fortime'" v-model="fortimeConfig" />

        <Separator />

        <!-- Exercise List (for multi-exercise blocks) -->
        <!-- eslint-disable vue/max-template-depth -->
        <div v-if="blockKind !== 'tabata'" class="space-y-3">
          <Label>Exercises</Label>

          <p v-if="blockExercises.length === 0" class="text-center py-6 text-muted-foreground">
            No exercises added yet
          </p>

          <div
            v-for="(exercise, index) in blockExercises"
            :key="exercise.id"
            class="flex items-center gap-3 bg-secondary/30 rounded-lg p-3"
          >
            <span class="text-xl">{{ exercise.thumbnail }}</span>
            <div class="flex-1 min-w-0">
              <p class="font-medium truncate">{{ exercise.name }}</p>
              <div class="flex gap-2 mt-1">
                <Input
                  :model-value="exercise.prescribedReps"
                  type="number"
                  min="1"
                  class="h-8 w-20"
                  placeholder="Reps"
                  @update:model-value="updateExerciseReps(index, Number($event))"
                />
                <Input
                  :model-value="exercise.load ?? ''"
                  class="h-8 flex-1"
                  placeholder="Load (optional)"
                  @update:model-value="updateExerciseLoad(index, String($event))"
                />
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              class="text-destructive"
              @click="removeExercise(index)"
            >
              <Trash2 class="w-4 h-4" />
            </Button>
          </div>

          <Button variant="outline" class="w-full" @click="showExercisePicker = true">
            <Plus class="w-4 h-4 mr-2" />
            Add Exercise
          </Button>
        </div>
        <!-- eslint-enable vue/max-template-depth -->

        <!-- Single Exercise (for Tabata) -->
        <template v-if="blockKind === 'tabata'">
          <div class="space-y-3">
            <Label>Exercise</Label>

            <div v-if="!tabataExercise" class="text-center py-6 text-muted-foreground">
              <p>Select an exercise for Tabata</p>
            </div>

            <div v-else class="flex items-center gap-3 bg-secondary/30 rounded-lg p-3">
              <span class="text-xl">{{ tabataExercise.thumbnail }}</span>
              <div class="flex-1">
                <p class="font-medium">{{ tabataExercise.name }}</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                class="text-destructive"
                @click="tabataExercise = null"
              >
                <Trash2 class="w-4 h-4" />
              </Button>
            </div>

            <Button
              v-if="!tabataExercise"
              variant="outline"
              class="w-full"
              @click="showExercisePicker = true"
            >
              <Plus class="w-4 h-4 mr-2" />
              Select Exercise
            </Button>
          </div>
        </template>
      </div>

      <!-- Exercise Picker Overlay -->
      <div v-if="showExercisePicker" class="absolute inset-0 bg-background flex flex-col z-20">
        <div class="p-4 border-b">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold">Add Exercise</h3>
            <Button variant="ghost" size="icon-sm" @click="showExercisePicker = false">
              <X class="w-4 h-4" />
            </Button>
          </div>

          <div class="relative">
            <Search
              class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
            />
            <Input
              v-model="exerciseSearch"
              placeholder="Search exercises..."
              class="pl-10"
              autofocus
            />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4">
          <button
            v-for="exercise in filteredExercises"
            :key="exercise.name"
            class="w-full flex items-center gap-3 py-3 text-left hover:bg-muted/50 rounded-lg px-2 transition-colors"
            @click="addExercise(exercise.name, exercise.icon)"
          >
            <span class="text-2xl">{{ exercise.icon }}</span>
            <span class="font-medium">{{ exercise.name }}</span>
          </button>
        </div>
      </div>

      <!-- Confirm Button -->
      <div class="pt-4 border-t flex gap-3">
        <Button variant="outline" class="flex-1" @click="handleClose"> Cancel </Button>
        <Button class="flex-1" :disabled="!canConfirm" @click="handleConfirm"> Add Block </Button>
      </div>
    </MobileDialogContent>
  </Dialog>
</template>
