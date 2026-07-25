<script setup lang="ts">
import { ref, watch } from 'vue'
import type { BlockExercise, ForTimeConfig as ForTimeBlockConfig } from '@/blocks'
import { BLOCK_ICONS } from '@/blocks'
import ConfigureTimedBlockDialog from '@/blocks/ui/ConfigureTimedBlockDialog.vue'
import ForTimeConfigComponent, {
  type ForTimeConfigModel,
} from '@/blocks/fortime/ui/ForTimeConfig.vue'

type Emits = {
  confirm: [config: ForTimeBlockConfig, exercises: ReadonlyArray<BlockExercise>]
}

const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<Emits>()

const config = ref<ForTimeConfigModel>({ hasCap: true, capMinutes: 15 })

watch(open, (isOpen) => {
  if (!isOpen) {
    return
  }

  config.value = { hasCap: true, capMinutes: 15 }
})

function handleConfirm(exercises: ReadonlyArray<BlockExercise>) {
  emit(
    'confirm',
    { timeCapSeconds: config.value.hasCap ? config.value.capMinutes * 60 : null },
    exercises,
  )
}
</script>

<template>
  <ConfigureTimedBlockDialog
    v-model:open="open"
    :icon="BLOCK_ICONS.fortime"
    translation-prefix="dialogs.fortimeConfig"
    @confirm="handleConfirm"
  >
    <ForTimeConfigComponent v-model="config" />
  </ConfigureTimedBlockDialog>
</template>
