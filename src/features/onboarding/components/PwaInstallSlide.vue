<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Download, Share, MoreVertical } from '@lucide/vue'
import OnboardingSlide from './OnboardingSlide.vue'

const { t } = useI18n()
</script>

<template>
  <OnboardingSlide
    :title="t('onboarding.pwa.title')"
    :description="t('onboarding.pwa.description')"
  >
    <div class="space-y-4">
      <!-- iOS instruction -->
      <div class="flex items-start gap-3 rounded-lg bg-muted/50 p-4 text-left">
        <Share class="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div class="text-sm">
          <p class="font-medium">{{ t('onboarding.pwa.ios.title') }}</p>
          <p class="text-muted-foreground">{{ t('onboarding.pwa.ios.instruction') }}</p>
        </div>
      </div>

      <!-- Android instruction -->
      <div class="flex items-start gap-3 rounded-lg bg-muted/50 p-4 text-left">
        <MoreVertical class="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div class="text-sm">
          <p class="font-medium">{{ t('onboarding.pwa.android.title') }}</p>
          <p class="text-muted-foreground">{{ t('onboarding.pwa.android.instruction') }}</p>
        </div>
      </div>

      <!-- Desktop instruction -->
      <div class="flex items-start gap-3 rounded-lg bg-muted/50 p-4 text-left">
        <Download class="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div class="text-sm">
          <p class="font-medium">{{ t('onboarding.pwa.desktop.title') }}</p>
          <p class="text-muted-foreground">{{ t('onboarding.pwa.desktop.instruction') }}</p>
        </div>
      </div>
    </div>
  </OnboardingSlide>
</template>
