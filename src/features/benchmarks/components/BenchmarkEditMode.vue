<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, MoreHorizontal } from '@lucide/vue'
import RoundTabs from './RoundTabs.vue'
import BenchmarkExerciseList from './BenchmarkExerciseList.vue'
import type { ExerciseFormState, RoundFormState } from '../composables/useBenchmarkForm'

type BenchmarkFormState = {
  name: string
  rounds: Array<RoundFormState>
}

type Emits = {
  'add-exercise': []
  'remove-exercise': [index: number]
  'reorder-exercises': [fromIndex: number, toIndex: number]
  'click-exercise': [index: number]
  'copy-round': []
  'delete-round': []
  'navigate-to-round': [index: number]
  'update:form': [value: BenchmarkFormState]
}

const {
  currentRoundIndex,
  displayRounds,
  currentExercises,
  roundCount,
  canDeleteRound,
} = defineProps<{
  currentRoundIndex: number
  displayRounds: Array<RoundFormState>
  currentExercises: Array<ExerciseFormState>
  roundCount: number
  canDeleteRound: boolean
}>()

const form = defineModel<BenchmarkFormState>('form', { required: true })

const emit = defineEmits<Emits>()

const { t } = useI18n()
</script>

<template>
  <div class="flex-1 overflow-y-auto p-4">
    <div class="mx-auto max-w-md space-y-6">
      <!-- Workout Name -->
      <div class="space-y-2">
        <Label for="workout-name">{{ t('workouts.benchmarks.name') }}</Label>
        <Input
          id="workout-name"
          v-model="form.name"
          :placeholder="t('workouts.benchmarks.namePlaceholder')"
        />
      </div>

      <!-- Round Tabs -->
      <RoundTabs
        :rounds="displayRounds"
        :active-index="currentRoundIndex"
        @select="emit('navigate-to-round', $event)"
      />

      <!-- Round Header with Actions -->
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-medium text-muted-foreground">
          {{ t('workouts.benchmarks.round', { current: currentRoundIndex + 1, total: roundCount }) }}
        </h2>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              :aria-label="t('common.buttons.options')"
            >
              <MoreHorizontal class="icon-sm" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @select="emit('copy-round')">
              {{ t('workouts.benchmarks.copyRound') }}
            </DropdownMenuItem>
            <DropdownMenuItem
              :disabled="!canDeleteRound"
              @select="emit('delete-round')"
            >
              {{ t('workouts.benchmarks.deleteRound') }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <!-- Exercise List Section -->
      <div v-if="currentExercises.length > 0" class="space-y-2">
        <Label>{{ t('workouts.benchmarks.exercises') }}</Label>
        <BenchmarkExerciseList
          :exercises="currentExercises"
          @remove="(index) => emit('remove-exercise', index)"
          @reorder="(from, to) => emit('reorder-exercises', from, to)"
          @click="(index) => emit('click-exercise', index)"
        />
      </div>

      <!-- Add Exercise Button -->
      <Button variant="outline" class="w-full border-dashed" @click="emit('add-exercise')">
        <Plus class="mr-2 size-5" />
        {{ t('workouts.benchmarks.addExercise') }}
      </Button>
    </div>
  </div>
</template>
