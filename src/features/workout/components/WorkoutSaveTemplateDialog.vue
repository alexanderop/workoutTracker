<script setup lang="ts">
import { ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import DialogActions from '@/components/DialogActions.vue'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const { t } = useI18n()

const open = defineModel<boolean>('open', { required: true })

const { initialName = '', isSaving = false } = defineProps<{
  initialName?: string
  isSaving?: boolean
}>()

const emit = defineEmits<{
  confirm: [name: string]
}>()

const templateName = ref('')
const inputId = useId()

// Reset name when dialog opens
watch(open, (isOpen) => {
  if (isOpen) {
    templateName.value = initialName
  }
})

function handleConfirm() {
  const trimmedName = templateName.value.trim()
  if (!trimmedName) return
  emit('confirm', trimmedName)
}
</script>

<template>
  <Dialog v-model:open="open">
    <MobileDialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('dialogs.saveTemplate.title') }}</DialogTitle>
        <DialogDescription>
          {{ t('dialogs.saveTemplate.description') }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-2 py-4">
        <Label :for="inputId">{{ t('dialogs.saveTemplate.templateName') }}</Label>
        <Input
          :id="inputId"
          v-model="templateName"
          :placeholder="t('dialogs.saveTemplate.templateNamePlaceholder')"
          :aria-label="t('dialogs.saveTemplate.templateName')"
        />
      </div>

      <DialogActions variant="inline" v-slot="{ buttonClass }">
        <Button variant="outline" :class="buttonClass" :disabled="isSaving" @click="open = false">
          {{ t('common.buttons.cancel') }}
        </Button>
        <Button :class="buttonClass" :disabled="!templateName.trim() || isSaving" @click="handleConfirm">
          {{ isSaving ? t('dialogs.saveTemplate.saving') : t('dialogs.saveTemplate.saveTemplate') }}
        </Button>
      </DialogActions>
    </MobileDialogContent>
  </Dialog>
</template>
