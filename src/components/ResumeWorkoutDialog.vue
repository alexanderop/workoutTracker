<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import DialogActions from '@/components/DialogActions.vue'
import MobileDialogContent from '@/components/MobileDialogContent.vue'

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
  <Dialog v-model:open="open">
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

      <DialogActions v-slot="{ buttonClass }">
        <Button variant="outline" :class="buttonClass" @click="emit('discard')">
          {{ t('common.buttons.discard') }}
        </Button>
        <Button :class="buttonClass" @click="emit('resume')">
          {{ t('dialogs.resume.resumeButton') }}
        </Button>
      </DialogActions>
    </MobileDialogContent>
  </Dialog>
</template>
