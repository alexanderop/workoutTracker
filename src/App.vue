<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import Layout from '@/components/Layout.vue'
import ResumeWorkoutDialog from '@/components/ResumeWorkoutDialog.vue'
import { useAppInitialization } from '@/composables/useAppInitialization'
import { useTheme } from '@/composables/useTheme'

useTheme()

const { initState, initialize, resumeWorkout, discardWorkout } = useAppInitialization()

const showResumeDialog = computed(() => initState.value.status === 'prompt-resume')
const resumeDialogData = computed(() => {
  if (initState.value.status === 'prompt-resume') {
    return {
      workoutName: initState.value.workoutName,
      exerciseCount: initState.value.exerciseCount,
    }
  }
  return { workoutName: '', exerciseCount: 0 }
})

onMounted(() => {
  initialize()
})
</script>

<template>
  <Layout>
    <RouterView />
  </Layout>

  <!-- Resume workout dialog -->
  <ResumeWorkoutDialog
    :open="showResumeDialog"
    :workout-name="resumeDialogData.workoutName"
    :exercise-count="resumeDialogData.exerciseCount"
    @resume="resumeWorkout"
    @discard="discardWorkout"
  />
</template>

