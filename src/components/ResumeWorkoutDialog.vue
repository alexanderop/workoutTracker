<script setup lang="ts">
import { computed } from 'vue'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import MobileDialogContent from '@/components/MobileDialogContent.vue'

const props = defineProps<{
  open: boolean
  workoutName: string
  exerciseCount: number
}>()

const emit = defineEmits<{
  resume: []
  discard: []
}>()

const exerciseText = computed(() =>
  props.exerciseCount === 1 ? '1 exercise' : `${props.exerciseCount} exercises`,
)
</script>

<template>
  <Dialog :open="open">
    <MobileDialogContent :show-close-button="false">
      <DialogHeader>
        <DialogTitle>Resume Workout?</DialogTitle>
        <DialogDescription>
          You have an unfinished workout: <strong>{{ workoutName }}</strong> with {{ exerciseText }}.
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          class="w-full sm:w-auto"
          @click="emit('discard')"
        >
          Discard
        </Button>
        <Button
          class="w-full sm:w-auto"
          @click="emit('resume')"
        >
          Resume Workout
        </Button>
      </div>
    </MobileDialogContent>
  </Dialog>
</template>
