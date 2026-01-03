<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import OnboardingSlide from './OnboardingSlide.vue'
import OnboardingBenchmarkPreview from './previews/OnboardingBenchmarkPreview.vue'
import { sampleBenchmarks } from '../constants/previewData'

const { t } = useI18n()
</script>

<template>
  <OnboardingSlide
    :title="t('onboarding.benchmarks.title')"
    :description="t('onboarding.benchmarks.description')"
  >
    <div class="space-y-3">
      <OnboardingBenchmarkPreview
        v-for="benchmark in sampleBenchmarks"
        :key="benchmark.name"
        :benchmark="benchmark"
      />
    </div>
  </OnboardingSlide>
</template>
