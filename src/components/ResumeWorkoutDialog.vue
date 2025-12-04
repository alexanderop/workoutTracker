<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import MobileDialogContent from '@/components/MobileDialogContent.vue'

defineProps<{
  open: boolean
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
  <Dialog :open="open">
    <MobileDialogContent :show-close-button="false">
      <DialogHeader>
        <DialogTitle>{{ t('dialogs.resume.title') }}</DialogTitle>
        <DialogDescription>
          {{ t('dialogs.resume.description') }} <strong>{{ workoutName }}</strong>
          {{
            t('dialogs.resume.descriptionWithBlocks', {
              count: blockCount,
              blocks: blockCount === 1 ? t('dialogs.resume.block') : t('dialogs.resume.blocks'),
            })
          }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" class="w-full sm:w-auto" @click="emit('discard')">
          {{ t('common.buttons.discard') }}
        </Button>
        <Button class="w-full sm:w-auto" @click="emit('resume')">{{
          t('dialogs.resume.resumeButton')
        }}</Button>
      </div>
    </MobileDialogContent>
  </Dialog>
</template>
