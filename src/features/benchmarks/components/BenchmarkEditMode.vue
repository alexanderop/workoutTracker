<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NumberField, NumberFieldInput } from '@/components/ui/number-field'
import { Clock, Plus, RotateCw } from 'lucide-vue-next'
import BenchmarkTypeCard from './BenchmarkTypeCard.vue'
import BenchmarkExerciseList from './BenchmarkExerciseList.vue'
import type { BenchmarkFormExercise } from '../composables/useBenchmarkForm'
import type { BenchmarkType } from '@/types/benchmark'

type BenchmarkFormState = {
  name: string
  type: BenchmarkType
  rounds: number
  exercises: Array<BenchmarkFormExercise>
}

type Emits = {
  'add-exercise': []
  'remove-exercise': [index: number]
  'reorder-exercises': [fromIndex: number, toIndex: number]
  'update:form': [value: BenchmarkFormState]
}

const { showRoundsInput } = defineProps<{
  showRoundsInput: boolean
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

      <!-- Type Selection -->
      <div class="space-y-2">
        <Label>{{ t('workouts.benchmarks.type.label') }}</Label>
        <div class="grid grid-cols-2 gap-3">
          <BenchmarkTypeCard
            type="fortime"
            :is-selected="form.type === 'fortime'"
            :icon="Clock"
            :label="t('workouts.benchmarks.type.fortime')"
            :description="t('workouts.benchmarks.type.fortimeDescription')"
            @select="form.type = $event"
          />

          <BenchmarkTypeCard
            type="rounds"
            :is-selected="form.type === 'rounds'"
            :icon="RotateCw"
            :label="t('workouts.benchmarks.type.rounds')"
            :description="t('workouts.benchmarks.type.roundsDescription')"
            @select="form.type = $event"
          />
        </div>
      </div>

      <!-- Rounds Input (Conditional) -->
      <div v-if="showRoundsInput" class="space-y-2">
        <Label for="rounds">{{ t('workouts.benchmarks.rounds.label') }}</Label>
        <NumberField id="rounds" v-model="form.rounds" :min="1">
          <NumberFieldInput />
        </NumberField>
      </div>

      <!-- Exercise List Section -->
      <div v-if="form.exercises.length > 0" class="space-y-2">
        <Label>{{ t('workouts.benchmarks.exercises') }}</Label>
        <BenchmarkExerciseList
          :exercises="form.exercises"
          @remove="(index) => emit('remove-exercise', index)"
          @reorder="(from, to) => emit('reorder-exercises', from, to)"
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
