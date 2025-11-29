<script setup lang="ts">
interface Props {
  label: string
  value: string
  placeholder?: string
}

withDefaults(defineProps<Props>(), {
  placeholder: 'Please select',
})

const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <button
    class="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900 border-b border-border last:border-b-0 transition-colors text-left"
    @click="emit('click')"
  >
    <span class="text-sm font-medium">{{ label }}</span>
    <div class="flex items-center gap-2">
      <span class="text-sm text-muted-foreground">
        {{ value || placeholder }}
      </span>
      <span class="text-muted-foreground">›</span>
    </div>
  </button>
</template>
