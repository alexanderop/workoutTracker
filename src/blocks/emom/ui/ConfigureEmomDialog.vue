<script setup lang="ts">
import { ref, watch } from 'vue'
import type { BlockExercise, EmomConfig as EmomBlockConfig } from '@/blocks'
import { BLOCK_ICONS } from '@/blocks'
import ConfigureTimedBlockDialog from '@/blocks/ui/ConfigureTimedBlockDialog.vue'
import EmomConfigComponent, { type EmomConfigModel } from '@/blocks/emom/ui/EmomConfig.vue'

type Emits = {
  confirm: [config: EmomBlockConfig, exercises: ReadonlyArray<BlockExercise>]
}

const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<Emits>()

const config = ref<EmomConfigModel>({ minutes: 10, rotation: 'full-round' })

watch(open, (isOpen) => {
  if (!isOpen) {
    return
  }

  config.value = { minutes: 10, rotation: 'full-round' }
})

function handleConfirm(exercises: ReadonlyArray<BlockExercise>) {
  emit(
    'confirm',
    { minutes: config.value.minutes, exerciseRotation: config.value.rotation },
    exercises,
  )
}
</script>

<template>
  <ConfigureTimedBlockDialog
    v-model:open="open"
    :icon="BLOCK_ICONS.emom"
    translation-prefix="dialogs.emomConfig"
    @confirm="handleConfirm"
  >
    <EmomConfigComponent v-model="config" />
  </ConfigureTimedBlockDialog>
</template>
