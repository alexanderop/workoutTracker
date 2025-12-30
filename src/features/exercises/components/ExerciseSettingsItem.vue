<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

type Properties = {
  label: string
  value: string
  placeholder?: string
}

const { t } = useI18n()

const { value, label, placeholder } = defineProps<Properties>()

const emit = defineEmits<{ click: [] }>()

const displayValue = computed(() => value || placeholder || t('common.settings.placeholder'))
</script>

<template>
  <button
    class="w-full px-4 py-3 flex items-center justify-between hover:bg-muted border-b border-border last:border-b-0 transition-colors text-left"
    @click="emit('click')"
  >
    <span class="text-sm font-medium">{{ label }}</span>
    <div class="flex items-center gap-2">
      <span class="text-sm text-muted-foreground">
        {{ displayValue }}
      </span>
      <span class="text-muted-foreground">›</span>
    </div>
  </button>
</template>
