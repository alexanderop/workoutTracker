<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import OnboardingSlide from './OnboardingSlide.vue'
import OnboardingTemplatePreview from './previews/OnboardingTemplatePreview.vue'
import { sampleTemplates } from '../constants/previewData'

const { t } = useI18n()

defineExpose({})
</script>

<template>
  <OnboardingSlide
    :title="t('onboarding.templates.title')"
    :description="t('onboarding.templates.description')"
  >
    <div class="space-y-3">
      <OnboardingTemplatePreview
        v-for="(template, index) in sampleTemplates"
        :key="index"
        :template="template"
      />
    </div>
  </OnboardingSlide>
</template>
