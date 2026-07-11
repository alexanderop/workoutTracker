<script setup lang="ts">
import { ref, watch } from 'vue'
import type { AmrapConfig as AmrapBlockConfig, BlockExercise } from '@/types/blocks'
import { BLOCK_ICONS } from '@/types/blocks'
import AmrapConfigComponent, { type AmrapConfigModel } from './AmrapConfig.vue'
import ConfigureTimedBlockDialog from './ConfigureTimedBlockDialog.vue'

type Emits = {
  confirm: [config: AmrapBlockConfig, exercises: ReadonlyArray<BlockExercise>]
}

const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<Emits>()

const config = ref<AmrapConfigModel>({ durationMinutes: 12 })

watch(open, (isOpen) => {
  if (!isOpen) {
    return
  }

  config.value = { durationMinutes: 12 }
})

function handleConfirm(exercises: ReadonlyArray<BlockExercise>) {
  emit('confirm', { durationSeconds: config.value.durationMinutes * 60 }, exercises)
}
</script>

<template>
  <ConfigureTimedBlockDialog
    v-model:open="open"
    :icon="BLOCK_ICONS.amrap"
    translation-prefix="dialogs.amrapConfig"
    @confirm="handleConfirm"
  >
    <AmrapConfigComponent v-model="config" />
  </ConfigureTimedBlockDialog>
</template>
