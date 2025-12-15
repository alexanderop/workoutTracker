<script setup lang="ts">
import PageHeader from '@/components/PageHeader.vue'

const {
  title,
  subtitle,
  backTo,
  scrollable = true,
  preventNavigation = false,
  maxWidth = 'xl',
} = defineProps<{
  title: string
  subtitle?: string
  backTo?: string
  scrollable?: boolean
  preventNavigation?: boolean
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}>()

const emit = defineEmits<{
  back: []
}>()

defineSlots<{
  'header-actions': () => unknown
  default: () => unknown
  footer: () => unknown
}>()

const maxWidthClasses: Record<typeof maxWidth, string> = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  '2xl': 'max-w-screen-2xl',
  full: '',
}
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
      <div
        class="mx-auto w-full px-4 sm:px-6 lg:px-8"
        :class="maxWidthClasses[maxWidth]"
      >
        <slot />
      </div>
    </div>

    <footer v-if="$slots.footer" class="sticky bottom-0 border-t bg-background">
      <div
        class="mx-auto w-full px-4 sm:px-6 lg:px-8"
        :class="maxWidthClasses[maxWidth]"
      >
        <slot name="footer" />
      </div>
    </footer>
  </div>
</template>
