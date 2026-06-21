<script setup lang="ts">
import { ChevronLeft } from '@lucide/vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'

const { t } = useI18n()

const {
  title,
  subtitle,
  backTo,
  preventNavigation = false,
} = defineProps<{
  title: string
  subtitle?: string
  backTo?: string
  preventNavigation?: boolean
}>()

const emit = defineEmits<{
  back: []
}>()

defineSlots<{
  actions: () => unknown
}>()

const router = useRouter()

function handleBack() {
  emit('back')
  if (preventNavigation) return
  if (backTo) {
    router.push(backTo)
    return
  }
  router.back()
}
</script>

<template>
  <header
    class="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
  >
    <div class="flex items-center gap-3 px-4 py-3">
      <Button
        variant="ghost"
        size="icon"
        class="shrink-0"
        :aria-label="t('common.aria.goBack')"
        @click="handleBack"
      >
        <ChevronLeft class="h-5 w-5" />
      </Button>
      <div class="min-w-0 flex-1">
        <h1 class="truncate text-xl font-semibold tracking-tight">
          {{ title }}
        </h1>
        <p v-if="subtitle" class="text-sm text-muted-foreground">
          {{ subtitle }}
        </p>
      </div>
      <slot name="actions" />
    </div>
  </header>
</template>
