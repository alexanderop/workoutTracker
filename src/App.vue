<script setup lang="ts">
// QA smoke test: verify browser QA pipeline works end-to-end
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { RouterView } from 'vue-router'
import Layout from '@/components/Layout.vue'
import ResumeWorkoutDialog from '@/features/workout/components/ResumeWorkoutDialog.vue'
import ToastViewport from '@/components/ToastViewport.vue'
import ActiveWorkoutFab from '@/features/workout/components/ActiveWorkoutFab.vue'
import { useQuickAddStore } from '@/stores/quickAdd'

// Loaded on first use so the quick-add machinery (and the weight dialog's
// live query) stays off the startup path — the app has a Lighthouse
// performance budget on first paint.
const QuickAddSheet = defineAsyncComponent(() => import('@/components/QuickAddSheet.vue'))
const WeightQuickLogDialog = defineAsyncComponent(
  () => import('@/features/weight/components/WeightQuickLogDialog.vue'),
)
import { useAppInitialization } from '@/features/workout/composables/useAppInitialization'
import { useTheme } from '@/composables/useTheme'
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

const quickAdd = useQuickAddStore()
const weightQuickLogOpen = ref(false)
// Stays true after the first request so the dialog (and its exit animation)
// survives closing; it just never mounts before it's needed.
const weightQuickLogRequested = ref(false)

function handleQuickLogWeight() {
  weightQuickLogRequested.value = true
  weightQuickLogOpen.value = true
}

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

    <QuickAddSheet
      v-if="quickAdd.hasOpened"
      v-model:open="quickAdd.isOpen"
      @log-weight="handleQuickLogWeight"
    />
    <WeightQuickLogDialog v-if="weightQuickLogRequested" v-model:open="weightQuickLogOpen" />

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
