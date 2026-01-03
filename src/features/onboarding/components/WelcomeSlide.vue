<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import OnboardingSlide from './OnboardingSlide.vue'

type Emits = {
  'start-tour': []
  skip: []
}

const { isReturningUser = false } = defineProps<{
  isReturningUser?: boolean
}>()

const emit = defineEmits<Emits>()
const { t } = useI18n()

defineExpose({})
</script>

<template>
  <OnboardingSlide
    :title="isReturningUser ? t('onboarding.welcomeBack.title') : t('onboarding.welcome.title')"
  >
    <!-- App icon/logo -->
    <div class="flex justify-center py-8">
      <img
        src="/pwa-192x192.png"
        :alt="t('onboarding.welcome.title')"
        class="h-24 w-24 rounded-2xl shadow-lg"
      />
    </div>

    <template #actions>
      <Button size="lg" class="w-full" @click="emit('start-tour')">
        {{
          isReturningUser
            ? t('onboarding.welcomeBack.resumeTour')
            : t('onboarding.welcome.startTour')
        }}
      </Button>
      <Button variant="outline" size="lg" class="w-full" @click="emit('skip')">
        {{ t('onboarding.welcome.skipToApp') }}
      </Button>
    </template>
  </OnboardingSlide>
</template>
