<script setup lang="ts">
import PageHeader from '@/components/PageHeader.vue'

const {
  title,
  subtitle,
  backTo,
  scrollable = true,
  preventNavigation = false,
} = defineProps<{
  title: string
  subtitle?: string
  backTo?: string
  scrollable?: boolean
  preventNavigation?: boolean
}>()

const emit = defineEmits<{
  back: []
}>()

defineSlots<{
  'header-actions': () => unknown
  default: () => unknown
  footer: () => unknown
}>()
</script>

<template>
  <div class="flex h-full flex-col">
    <PageHeader
      :title="title"
      :subtitle="subtitle"
      :back-to="backTo"
      :prevent-navigation="preventNavigation"
      @back="emit('back')"
    >
      <template #actions>
        <slot name="header-actions" />
      </template>
    </PageHeader>

    <div class="flex-1" :class="scrollable ? 'overflow-y-auto' : 'overflow-hidden'">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="sticky bottom-0 border-t bg-background">
      <slot name="footer" />
    </footer>
  </div>
</template>
