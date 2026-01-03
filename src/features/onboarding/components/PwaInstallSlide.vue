<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Download } from 'lucide-vue-next'
import OnboardingSlide from './OnboardingSlide.vue'

const { t } = useI18n()

defineExpose({})
</script>

<template>
  <OnboardingSlide
    :title="t('onboarding.pwa.title')"
    :description="t('onboarding.pwa.description')"
  >
    <div class="flex flex-col items-center gap-4 py-8">
      <div class="rounded-full bg-primary/10 p-6">
        <Download :size="48" class="text-primary" />
      </div>
      <p class="text-sm text-muted-foreground">
        {{ t('onboarding.pwa.instruction') }}
      </p>
    </div>
  </OnboardingSlide>
</template>
