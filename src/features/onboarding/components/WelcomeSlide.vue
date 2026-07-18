<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { useOnboarding } from '../composables/useOnboarding'

const emit = defineEmits<{
  skip: []
  next: []
}>()

const { t } = useI18n()
const onboarding = useOnboarding()
</script>

<template>
  <div class="flex h-full flex-col items-center justify-center px-6 text-center">
    <!-- App icon -->
    <div class="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10">
      <img src="/pwa-192x192.png" :alt="''" class="h-16 w-16" aria-hidden="true" />
    </div>

    <!-- Title -->
    <h1 class="text-page-title font-bold tracking-tight" tabindex="-1">
      {{
        onboarding.isReturningUser
          ? t('onboarding.welcomeBack.title')
          : t('onboarding.welcome.title')
      }}
    </h1>

    <!-- CTAs -->
    <div class="mt-10 flex w-full max-w-xs flex-col gap-3">
      <Button size="lg" class="w-full" @click="emit('next')">
        {{
          onboarding.isReturningUser
            ? t('onboarding.welcomeBack.resumeTour')
            : t('onboarding.welcome.startTour')
        }}
      </Button>
      <Button variant="outline" size="lg" class="w-full" @click="emit('skip')">
        {{ t('onboarding.welcome.skipToApp') }}
      </Button>
    </div>
  </div>
</template>
