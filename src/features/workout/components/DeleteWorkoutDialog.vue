<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const { workoutName } = defineProps<{
  workoutName: string
}>()

const { t } = useI18n()

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  confirm: []
}>()
</script>

<template>
  <ConfirmDialog
    v-model:open="open"
    :title="t('workouts.deleteWorkout.title')"
    :description="t('workouts.deleteWorkout.description', { name: workoutName })"
    :cancel-label="t('common.buttons.cancel')"
    :confirm-label="t('workouts.deleteWorkout.confirmButton')"
    @confirm="emit('confirm')"
  />
</template>
