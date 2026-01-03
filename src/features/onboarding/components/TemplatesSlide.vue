<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import OnboardingSlide from './OnboardingSlide.vue'
import OnboardingTemplatePreview from './previews/OnboardingTemplatePreview.vue'
import { sampleTemplates } from '../constants/previewData'

const { t } = useI18n()
</script>

<template>
  <OnboardingSlide
    :title="t('onboarding.templates.title')"
    :description="t('onboarding.templates.description')"
  >
    <div class="space-y-3">
      <OnboardingTemplatePreview
        v-for="template in sampleTemplates"
        :key="template.name"
        :template="template"
      />
    </div>
  </OnboardingSlide>
</template>
