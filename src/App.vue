<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import Layout from '@/components/Layout.vue'
import PwaUpdatePrompt from '@/components/PwaUpdatePrompt.vue'
import ResumeWorkoutDialog from '@/components/ResumeWorkoutDialog.vue'
import { useAppInitialization } from '@/features/workout/composables/useAppInitialization'
import { useTheme } from '@/features/settings/composables/useTheme'
import { useGlobalWakeLock } from '@/composables/useGlobalWakeLock'
import { useLanguage } from '@/features/settings/composables/useLanguage'

useTheme()
useGlobalWakeLock()
useLanguage()

const { initState, initialize, resumeWorkout, discardWorkout } = useAppInitialization()

const showResumeDialog = computed(() => initState.value.status === 'prompt-resume')
const resumeDialogData = computed(() => {
  if (initState.value.status === 'prompt-resume') {
    return {
      workoutName: initState.value.workoutName,
      blockCount: initState.value.blockCount,
    }
  }
  return { workoutName: '', blockCount: 0 }
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
    :block-count="resumeDialogData.blockCount"
    @resume="resumeWorkout"
    @discard="discardWorkout"
  />

  <!-- PWA update prompt -->
  <PwaUpdatePrompt />
</template>
