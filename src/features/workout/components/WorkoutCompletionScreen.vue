<script setup lang="ts">
import CompletionScreen from '@/components/CompletionScreen.vue'

type Properties = {
  workoutName: string
  duration: number
}

const { workoutName, duration } = defineProps<Properties>()

const emit = defineEmits<{
  'view-details': []
}>()
</script>

<template>
  <CompletionScreen
    :name="workoutName"
    :duration="duration"
    @view-details="emit('view-details')"
  />
</template>
