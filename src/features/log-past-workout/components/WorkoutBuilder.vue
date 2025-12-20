<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import StrengthBlockGrid from './StrengthBlockGrid.vue'
import { isStrengthBlock } from '@/types/blocks'
import type { WorkoutBlock, StrengthBlock } from '@/types/blocks'
import type { Set } from '@/types/workout'
import { useExercisesStore } from '@/stores/exercises'

const { blocks } = defineProps<{
  blocks: ReadonlyArray<WorkoutBlock>
}>()

const emit = defineEmits<{
  'add-block': [block: WorkoutBlock]
  'update-sets': [blockId: number, sets: Array<Set>]
}>()

const { t } = useI18n()
const exercisesStore = useExercisesStore()

const exerciseDialogOpen = ref(false)

function handleAddBlock() {
  exerciseDialogOpen.value = true
}

function selectExercise(exercise: { id: string; name: string; icon: string; equipment?: string }) {
  const newBlock: StrengthBlock = {
    kind: 'strength',
    id: blocks.length + 1,
    exerciseDefinitionId: exercise.id,
    name: exercise.name,
    equipment: exercise.equipment ?? '',
    targetReps: 8,
    thumbnail: exercise.icon,
    sets: [
      { id: 1, kg: '', reps: '', rir: '', status: 'completed' },
      { id: 2, kg: '', reps: '', rir: '', status: 'completed' },
      { id: 3, kg: '', reps: '', rir: '', status: 'completed' },
    ],
  }

  emit('add-block', newBlock)
  exerciseDialogOpen.value = false
}

function handleUpdateSets(blockId: number, sets: Array<Set>) {
  emit('update-sets', blockId, sets)
}

function handleAddSet(blockId: number) {
  const block = blocks.find((b) => b.id === blockId)
  if (!block || !isStrengthBlock(block)) return

  const lastSet = block.sets[block.sets.length - 1]
  const newSet: Set = {
    id: block.sets.length + 1,
    kg: lastSet?.kg ?? '',
    reps: lastSet?.reps ?? '',
    rir: lastSet?.rir ?? '',
    status: 'completed',
  }

  emit('update-sets', blockId, [...block.sets, newSet])
}

function handleRemoveSet(blockId: number, setIndex: number) {
  const block = blocks.find((b) => b.id === blockId)
  if (!block || !isStrengthBlock(block)) return

  const newSets = block.sets.filter((_, idx) => idx !== setIndex)
  emit('update-sets', blockId, newSets)
}

const strengthBlocks = computed(() => blocks.filter(isStrengthBlock))
</script>

<template>
  <div class="space-y-4">
    <!-- Strength Blocks -->
    <StrengthBlockGrid
      v-for="(block, index) in strengthBlocks"
      :key="block.id"
      :block="block"
      :block-index="index"
      @update-sets="handleUpdateSets"
      @add-set="handleAddSet"
      @remove-set="handleRemoveSet"
    />

    <!-- Empty State / Add Block -->
    <Button
      variant="outline"
      class="w-full h-16"
      @click="handleAddBlock"
    >
      <Plus class="w-5 h-5 mr-2" />
      {{ blocks.length === 0 ? t('logPastWorkout.addFirstBlock', 'Add First Block') : t('logPastWorkout.addBlock', 'Add Block') }}
    </Button>

    <!-- Exercise Selection Dialog -->
    <Dialog v-model:open="exerciseDialogOpen">
      <DialogContent class="max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{{ t('logPastWorkout.selectExercise', 'Select Exercise') }}</DialogTitle>
          <DialogDescription class="sr-only">
            {{ t('logPastWorkout.selectExerciseDesc', 'Choose an exercise to add to your workout') }}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea class="max-h-[60vh]">
          <div class="space-y-2 pr-4">
            <Button
              v-for="exercise in exercisesStore.customExercises"
              :key="exercise.id"
              variant="ghost"
              class="w-full justify-start h-auto py-3"
              @click="selectExercise(exercise)"
            >
              <span class="text-xl mr-3">{{ exercise.icon }}</span>
              <div class="text-left">
                <div class="font-medium">{{ exercise.name }}</div>
                <div v-if="exercise.equipment" class="text-xs text-muted-foreground">
                  {{ exercise.equipment }}
                </div>
              </div>
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  </div>
</template>
