<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Card, CardContent } from '@/components/ui/card'
import { useStreak } from '../composables/useStreak'

const { t } = useI18n()
const { streak } = useStreak()

const shouldRender = computed(() => streak.value.hasEverTrained)
const isActive = computed(() => streak.value.current > 0)
const icon = computed(() => (isActive.value ? '\u{1F525}' : '\u{1F4AA}'))
</script>

<template>
  <Card v-if="shouldRender" class="w-full max-w-md" data-testid="streak-card">
    <CardContent class="flex items-center gap-4 p-4">
      <div
        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl"
        aria-hidden="true"
      >
        <span>{{ icon }}</span>
      </div>
      <div class="flex flex-col">
        <p class="text-base font-semibold leading-tight">
          <template v-if="isActive">
            {{ t('activityStreak.current', { count: streak.current }) }}
          </template>
          <template v-else>
            {{ t('activityStreak.startNew') }}
          </template>
        </p>
        <p class="text-sm text-muted-foreground">
          {{ t('activityStreak.longest', { count: streak.longest }) }}
        </p>
      </div>
    </CardContent>
  </Card>
</template>
