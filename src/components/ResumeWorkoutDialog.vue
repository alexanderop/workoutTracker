<script setup lang="ts">
import { computed } from 'vue'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import MobileDialogContent from '@/components/MobileDialogContent.vue'

const props = defineProps<{
  open: boolean
  workoutName: string
  blockCount: number
}>()

const emit = defineEmits<{
  resume: []
  discard: []
}>()

const blockText = computed(() =>
  props.blockCount === 1 ? '1 block' : `${props.blockCount} blocks`,
)
</script>

<template>
  <Dialog :open="open">
    <MobileDialogContent :show-close-button="false">
      <DialogHeader>
        <DialogTitle>Resume Workout?</DialogTitle>
        <DialogDescription>
          You have an unfinished workout: <strong>{{ workoutName }}</strong> with {{ blockText }}.
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" class="w-full sm:w-auto" @click="emit('discard')">
          Discard
        </Button>
        <Button class="w-full sm:w-auto" @click="emit('resume')"> Resume Workout </Button>
      </div>
    </MobileDialogContent>
  </Dialog>
</template>
