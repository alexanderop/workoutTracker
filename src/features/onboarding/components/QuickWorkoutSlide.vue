<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import OnboardingSlide from './OnboardingSlide.vue'
import OnboardingBlockPreview from './previews/OnboardingBlockPreview.vue'
import { sampleBlocks } from '../constants/previewData'

const { t } = useI18n()

defineExpose({})
</script>

<template>
  <OnboardingSlide
    :title="t('onboarding.quickWorkout.title')"
    :description="t('onboarding.quickWorkout.description')"
  >
    <div class="space-y-3">
      <OnboardingBlockPreview v-for="(block, index) in sampleBlocks" :key="index" :block="block" />
    </div>
  </OnboardingSlide>
</template>
