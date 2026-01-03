<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel'
import { RouteNames, type RouteName } from '@/router'
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

const isFirstSlide = computed(() => currentSlide.value === 0)
const isLastSlide = computed(() => currentSlide.value === onboarding.totalSlides - 1)

function setApi(api: CarouselApi): void {
  carouselApi.value = api
}

// Update current slide when carousel changes
watch(carouselApi, (api) => {
  if (!api) return

  currentSlide.value = api.selectedScrollSnap()

  api.on('select', () => {
    currentSlide.value = api.selectedScrollSnap()
  })
})

// Persist current step and jump to saved position on mount
watch(currentSlide, (step) => {
  onboarding.setCurrentStep(step)
})

onMounted(async () => {
  await onboarding.loadFromDb()

  // Resume from saved position (instant jump, no animation)
  if (onboarding.currentStep > 0 && carouselApi.value) {
    carouselApi.value.scrollTo(onboarding.currentStep, true)
  }
})

function scrollNext(): void {
  carouselApi.value?.scrollNext()
}

function scrollPrev(): void {
  carouselApi.value?.scrollPrev()
}

async function handleSkip(): Promise<void> {
  await onboarding.skipOnboarding()
  await router.push({ name: RouteNames.Home })
}

async function handleComplete(): Promise<void> {
  await onboarding.completeOnboarding()
  await router.push({ name: RouteNames.Home })
}

async function handleNavigate(routeName: RouteName): Promise<void> {
  await onboarding.completeOnboarding()
  await router.push({ name: routeName })
}

function handleStartTour(): void {
  scrollNext()
}

defineExpose({})
</script>

<template>
  <div class="flex h-full flex-col bg-background">
    <!-- Header with skip button -->
    <header class="flex items-center justify-between p-4">
      <Button
        v-if="!isFirstSlide"
        variant="ghost"
        size="icon"
        :aria-label="t('onboarding.navigation.back')"
        @click="scrollPrev"
      >
        <ArrowLeft :size="20" />
      </Button>
      <div v-else class="w-10" />

      <Button variant="ghost" size="sm" class="text-muted-foreground" @click="handleSkip">
        <X :size="16" class="mr-1" />
        {{ t('onboarding.navigation.skip') }}
      </Button>
    </header>

    <!-- Carousel -->
    <div class="flex-1 overflow-hidden">
      <Carousel class="h-full" :opts="{ loop: false, watchDrag: false }" @init-api="setApi">
        <CarouselContent class="h-full">
          <!-- Welcome Slide -->
          <CarouselItem class="h-full">
            <WelcomeSlide
              :is-returning-user="onboarding.isReturningUser"
              @start-tour="handleStartTour"
              @skip="handleSkip"
            />
          </CarouselItem>

          <!-- PWA Install Slide (only if not installed) -->
          <CarouselItem v-if="!onboarding.isPwaInstalled" class="h-full">
            <PwaInstallSlide />
          </CarouselItem>

          <!-- Quick Workout Slide -->
          <CarouselItem class="h-full">
            <QuickWorkoutSlide />
          </CarouselItem>

          <!-- Templates Slide -->
          <CarouselItem class="h-full">
            <TemplatesSlide />
          </CarouselItem>

          <!-- Benchmarks Slide -->
          <CarouselItem class="h-full">
            <BenchmarksSlide />
          </CarouselItem>

          <!-- Checklist Slide -->
          <CarouselItem class="h-full">
            <ChecklistSlide @navigate="handleNavigate" @complete="handleComplete" />
          </CarouselItem>
        </CarouselContent>
      </Carousel>
    </div>

    <!-- Footer with progress dots and next button -->
    <footer class="flex flex-col items-center gap-4 p-4 pb-8">
      <!-- Progress dots -->
      <div class="flex gap-2" role="tablist" :aria-label="t('onboarding.aria.progressDot')">
        <button
          v-for="n in onboarding.totalSlides"
          :key="n"
          type="button"
          class="h-2 w-2 rounded-full transition-colors"
          :class="n - 1 === currentSlide ? 'bg-primary' : 'bg-muted'"
          :aria-label="t('onboarding.aria.goToSlide', { n })"
          :aria-selected="n - 1 === currentSlide"
          role="tab"
          @click="carouselApi?.scrollTo(n - 1, false)"
        />
      </div>

      <!-- Next button (hidden on welcome and checklist slides) -->
      <Button
        v-if="!isFirstSlide && !isLastSlide"
        size="lg"
        class="w-full max-w-md"
        @click="scrollNext"
      >
        {{ t('onboarding.navigation.next') }}
      </Button>
    </footer>
  </div>
</template>
