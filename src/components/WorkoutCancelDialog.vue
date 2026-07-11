<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const { t } = useI18n()

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  confirm: []
}>()
</script>

<template>
  <ConfirmDialog
    v-model:open="open"
    :title="t('dialogs.cancel.title')"
    :description="t('dialogs.cancel.description')"
    :cancel-label="t('dialogs.cancel.keepWorking')"
    :confirm-label="t('dialogs.cancel.deleteWorkout')"
    @confirm="emit('confirm')"
  />
</template>
