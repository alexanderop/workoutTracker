<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-vue-next'
import { RouteNames } from '@/router'
import { useOnboarding } from '../composables/useOnboarding'
import WelcomeSlide from './WelcomeSlide.vue'
import PwaInstallSlide from './PwaInstallSlide.vue'
import QuickWorkoutSlide from './QuickWorkoutSlide.vue'
import TemplatesSlide from './TemplatesSlide.vue'
import BenchmarksSlide from './BenchmarksSlide.vue'
import ChecklistSlide from './ChecklistSlide.vue'

const router = useRouter()
const { t } = useI18n()
const onboarding = useOnboarding()

const carouselApi = ref<CarouselApi>()
const currentSlide = ref(0)

// Slide configuration based on PWA status
const slides = computed(() => {
  const baseSlides = [
    { component: WelcomeSlide, key: 'welcome' },
    { component: QuickWorkoutSlide, key: 'quickWorkout' },
    { component: TemplatesSlide, key: 'templates' },
    { component: BenchmarksSlide, key: 'benchmarks' },
    { component: ChecklistSlide, key: 'checklist' },
  ]

  // Insert PWA slide at position 1 if not installed as PWA
  if (!onboarding.isPWA.value) {
    baseSlides.splice(1, 0, { component: PwaInstallSlide, key: 'pwa' })
  }

  return baseSlides
})

const isFirstSlide = computed(() => currentSlide.value === 0)
const isLastSlide = computed(() => currentSlide.value === slides.value.length - 1)

function setApi(api: CarouselApi) {
  carouselApi.value = api
}

// Track slide changes and persist step
watch(
  () => carouselApi.value?.selectedScrollSnap(),
  (newSlide) => {
    if (newSlide !== undefined && newSlide !== currentSlide.value) {
      currentSlide.value = newSlide
      void onboarding.setStep(newSlide)
    }
  },
)

// Resume to saved step on mount (instant jump)
onMounted(() => {
  if (onboarding.currentStep.value > 0 && carouselApi.value) {
    carouselApi.value.scrollTo(onboarding.currentStep.value, true)
    currentSlide.value = onboarding.currentStep.value
  }
})

function goToSlide(index: number) {
  carouselApi.value?.scrollTo(index)
}

function goBack() {
  carouselApi.value?.scrollPrev()
}

function goNext() {
  carouselApi.value?.scrollNext()
}

async function handleSkip() {
  await onboarding.markComplete()
  void router.push({ name: RouteNames.Home })
}

async function handleFinish() {
  await onboarding.markComplete()
  void router.push({ name: RouteNames.Home })
}

async function handleChecklistNavigate(routeName: string) {
  await onboarding.markComplete()
  void router.push({ name: routeName })
}
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Header with Skip button -->
    <header class="flex h-14 shrink-0 items-center justify-between px-4">
      <Button
        v-if="!isFirstSlide"
        variant="ghost"
        size="sm"
        @click="goBack"
        :aria-label="t('onboarding.navigation.back')"
      >
        <ChevronLeft class="h-5 w-5" />
      </Button>
      <div v-else />

      <Button variant="ghost" size="sm" @click="handleSkip">
        {{ t('onboarding.navigation.skip') }}
      </Button>
    </header>

    <!-- Carousel -->
    <Carousel
      class="flex-1 overflow-hidden"
      :opts="{ loop: false, watchDrag: true }"
      @init-api="setApi"
    >
      <CarouselContent class="h-full">
        <CarouselItem
          v-for="slide in slides"
          :key="slide.key"
          class="h-full"
        >
          <component
            :is="slide.component"
            @skip="handleSkip"
            @next="goNext"
            @finish="handleFinish"
            @navigate="handleChecklistNavigate"
          />
        </CarouselItem>
      </CarouselContent>
    </Carousel>

    <!-- Footer with progress dots and Next/Finish button -->
    <footer class="flex shrink-0 flex-col gap-4 px-4 pb-8 pt-4">
      <!-- Progress dots -->
      <div class="flex justify-center gap-2">
        <button
          v-for="(_, index) in slides"
          :key="index"
          @click="goToSlide(index)"
          :class="[
            'h-2 w-2 rounded-full transition-colors',
            index === currentSlide ? 'bg-primary' : 'bg-muted',
          ]"
          :aria-label="`${t('onboarding.navigation.goToSlide')} ${index + 1}`"
          :aria-current="index === currentSlide ? 'step' : undefined"
        />
      </div>

      <!-- Next/Finish button -->
      <Button
        v-if="!isLastSlide"
        class="w-full"
        size="lg"
        @click="goNext"
      >
        {{ t('onboarding.navigation.next') }}
      </Button>
      <Button
        v-else
        class="w-full"
        size="lg"
        @click="handleFinish"
      >
        {{ t('onboarding.navigation.letsGo') }}
      </Button>
    </footer>
  </div>
</template>
