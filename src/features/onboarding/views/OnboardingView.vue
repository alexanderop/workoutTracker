<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useOnboarding } from '../composables/useOnboarding'
import OnboardingCarousel from '../components/OnboardingCarousel.vue'

const route = useRoute()
const onboarding = useOnboarding()

onMounted(() => {
  // Set returning user flag from query param (set by router guard)
  if (route.query.returning === 'true') {
    onboarding.setReturningUser(true)
  }
})

defineExpose({})
</script>

<template>
  <div class="fixed inset-0 bg-background">
    <OnboardingCarousel />
  </div>
</template>
