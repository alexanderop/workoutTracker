<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const open = defineModel<boolean>('open', { required: true })

const { workoutName, blockCount } = defineProps<{
  workoutName: string
  blockCount: number
}>()

const emit = defineEmits<{
  resume: []
  discard: []
}>()

const { t } = useI18n()
</script>

<template>
  <ConfirmDialog
    v-model:open="open"
    :title="t('dialogs.resume.title')"
    :cancel-label="t('common.buttons.discard')"
    :confirm-label="t('dialogs.resume.resumeButton')"
    confirm-variant="default"
    :show-close-button="false"
    @confirm="emit('resume')"
    @cancel="emit('discard')"
  >
    <template #description>
      {{ t('dialogs.resume.description') }} <strong>{{ workoutName }}</strong>
      {{
        t('dialogs.resume.descriptionWithBlocks', {
          count: blockCount,
          blocks: blockCount === 1 ? t('dialogs.resume.block') : t('dialogs.resume.blocks'),
        })
      }}
    </template>
  </ConfirmDialog>
</template>
