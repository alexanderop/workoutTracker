<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Plus, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import ExerciseAvatar from '@/components/ExerciseAvatar.vue'
import type { StrengthBlock } from '@/types/blocks'
import type { Set } from '@/types/workout'

const { block, blockIndex } = defineProps<{
  block: StrengthBlock
  blockIndex: number
}>()

const emit = defineEmits<{
  'update-sets': [blockId: number, sets: Array<Set>]
  'add-set': [blockId: number]
  'remove-set': [blockId: number, setIndex: number]
}>()

const { t } = useI18n()

function updateSetValue(setIndex: number, field: 'kg' | 'reps' | 'rir', value: string) {
  const newSets = block.sets.map((set, idx) => {
    if (idx !== setIndex) return set
    return { ...set, [field]: value }
  })
  emit('update-sets', block.id, newSets)
}

function handleAddSet() {
  emit('add-set', block.id)
}

function handleRemoveSet(setIndex: number) {
  emit('remove-set', block.id, setIndex)
}
</script>

<template>
  <Card :data-testid="`strength-block-${blockIndex}`">
    <CardHeader class="pb-3">
      <CardTitle class="text-base flex items-center gap-2">
        <ExerciseAvatar :name="block.name" :image="block.image" size="md" />
        {{ block.name }}
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-2">
      <!-- Set Cards -->
      <div
        v-for="(set, setIndex) in block.sets"
        :key="set.id"
        :data-testid="`set-row-${setIndex}`"
        class="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2"
      >
        <!-- Set Badge -->
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold"
        >
          {{ setIndex + 1 }}
        </div>

        <!-- Input Groups -->
        <div class="flex flex-1 items-center gap-2">
          <!-- Weight -->
          <div class="flex items-center gap-1">
            <Input
              type="number"
              inputmode="decimal"
              :model-value="set.kg"
              :aria-label="`Weight for set ${setIndex + 1}`"
              class="h-10 w-16 text-center tabular-nums"
              @update:model-value="(v) => updateSetValue(setIndex, 'kg', String(v))"
            />
            <span class="text-xs text-muted-foreground">kg</span>
          </div>

          <!-- Reps -->
          <div class="flex items-center gap-1">
            <Input
              type="number"
              inputmode="numeric"
              :model-value="set.reps"
              :aria-label="`Reps for set ${setIndex + 1}`"
              class="h-10 w-14 text-center tabular-nums"
              @update:model-value="(v) => updateSetValue(setIndex, 'reps', String(v))"
            />
            <span class="text-xs text-muted-foreground">{{ t('common.reps', 'reps') }}</span>
          </div>

          <!-- RIR -->
          <div class="flex items-center gap-1">
            <Input
              type="number"
              inputmode="numeric"
              :model-value="set.rir"
              :aria-label="`RIR for set ${setIndex + 1}`"
              class="h-10 w-12 text-center tabular-nums"
              @update:model-value="(v) => updateSetValue(setIndex, 'rir', String(v))"
            />
            <span class="text-xs text-muted-foreground">{{ t('common.rir', 'rir') }}</span>
          </div>
        </div>

        <!-- Delete Button -->
        <Button
          variant="ghost"
          size="icon"
          class="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive"
          :aria-label="`Remove set ${setIndex + 1}`"
          @click="handleRemoveSet(setIndex)"
        >
          <Trash2 class="h-4 w-4" />
        </Button>
      </div>

      <!-- Add Set Button -->
      <Button
        variant="outline"
        size="sm"
        class="w-full"
        @click="handleAddSet"
      >
        <Plus class="h-4 w-4 mr-1" />
        {{ t('logPastWorkout.addSet', 'Add Set') }}
      </Button>
    </CardContent>
  </Card>
</template>
