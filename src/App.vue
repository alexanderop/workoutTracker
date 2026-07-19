<script setup lang="ts">
// QA smoke test: verify browser QA pipeline works end-to-end
import { computed, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import Layout from '@/components/Layout.vue'
import ResumeWorkoutDialog from '@/components/ResumeWorkoutDialog.vue'
import ToastViewport from '@/components/ToastViewport.vue'
import ActiveWorkoutFab from '@/features/workout/components/ActiveWorkoutFab.vue'
import { useAppInitialization } from '@/features/workout/composables/useAppInitialization'
import { useTheme } from '@/features/settings/composables/useTheme'
import { useGlobalWakeLock } from '@/composables/useGlobalWakeLock'
import { useKeyboardInset } from '@/composables/useKeyboardInset'
import { useLanguage } from '@/features/settings/composables/useLanguage'
import { usePwaUpdate } from '@/composables/usePwaUpdate'

useTheme()
useGlobalWakeLock()
useKeyboardInset()
useLanguage()
usePwaUpdate()

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
  <div data-testid="app">
    <Layout>
      <RouterView />
    </Layout>

    <ActiveWorkoutFab />

    <!-- Resume workout dialog -->
    <ResumeWorkoutDialog
      :open="showResumeDialog"
      :workout-name="resumeDialogData.workoutName"
      :block-count="resumeDialogData.blockCount"
      @resume="resumeWorkout"
      @discard="discardWorkout"
    />

    <ToastViewport />
  </div>
</template>
