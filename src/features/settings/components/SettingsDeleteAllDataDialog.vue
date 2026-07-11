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
    :title="t('settings.dialogs.deleteAllData.title')"
    :description="t('settings.dialogs.deleteAllData.description')"
    :cancel-label="t('settings.dialogs.deleteAllData.cancel')"
    :confirm-label="t('settings.dialogs.deleteAllData.confirm')"
    @confirm="emit('confirm')"
  />
</template>
