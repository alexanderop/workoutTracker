<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import CompletionScreen from '@/components/CompletionScreen.vue'

type Props = {
  completionTime: number
  benchmarkName: string
}

const { completionTime, benchmarkName } = defineProps<Props>()

const emit = defineEmits<{
  'view-details': []
}>()

const { t } = useI18n()
</script>

<template>
  <CompletionScreen
    :name="benchmarkName"
    :duration="completionTime"
    :duration-label="t('workouts.benchmarks.completion.finalTime')"
    @view-details="emit('view-details')"
  />
</template>
