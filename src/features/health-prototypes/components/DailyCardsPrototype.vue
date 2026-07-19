<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Apple,
  BedDouble,
  Brain,
  ChevronRight,
  Dumbbell,
  Droplets,
  Plus,
  Scale,
  Sparkles,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

const moods = [
  { value: 1, emoji: '😔', label: 'Low' },
  { value: 2, emoji: '😕', label: 'Off' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😊', label: 'Great' },
] as const

const selectedMood = ref(4)
const waterGlasses = ref(5)
const calorieTarget = 2200
const caloriesConsumed = 1650
const calorieProgress = computed(() => (caloriesConsumed / calorieTarget) * 100)

function addWater() {
  waterGlasses.value = Math.min(waterGlasses.value + 1, 10)
}
</script>

<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -- prototype-only sample copy -->
  <div class="min-h-full bg-background pb-24">
    <header class="border-b bg-card px-4 pb-5 pt-6">
      <div class="mx-auto max-w-lg">
        <p class="text-sm font-medium text-primary">Sunday, 19 July</p>
        <div class="mt-1 flex items-start justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold tracking-tight">Good morning, Alex</h2>
            <p class="mt-1 text-sm text-muted-foreground">How are you feeling today?</p>
          </div>
          <div class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles class="size-6 text-primary" />
          </div>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-lg space-y-4 p-4">
      <section
        aria-labelledby="quick-checkin-title"
        class="rounded-2xl border bg-card p-4 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <div>
            <h3 id="quick-checkin-title" class="font-semibold">Quick check-in</h3>
            <p class="text-xs text-muted-foreground">One tap is enough</p>
          </div>
          <Brain class="size-5 text-primary" />
        </div>
        <div class="mt-4 grid grid-cols-5 gap-2">
          <button
            v-for="mood in moods"
            :key="mood.value"
            type="button"
            class="flex min-h-16 flex-col items-center justify-center rounded-xl border text-xs transition"
            :class="
              selectedMood === mood.value
                ? 'border-primary bg-primary/10 font-semibold text-primary'
                : 'border-border bg-background text-muted-foreground'
            "
            :aria-pressed="selectedMood === mood.value"
            :aria-label="`Mood: ${mood.label}`"
            @click="selectedMood = mood.value"
          >
            <span aria-hidden="true" class="text-2xl">{{ mood.emoji }}</span>
            <span>{{ mood.label }}</span>
          </button>
        </div>
        <div class="mt-4 grid grid-cols-3 divide-x rounded-xl bg-muted/60 py-3 text-center">
          <div>
            <p class="text-xs text-muted-foreground">Energy</p>
            <p class="mt-1 font-semibold">4 / 5</p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground">Stress</p>
            <p class="mt-1 font-semibold">2 / 5</p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground">Sleep</p>
            <p class="mt-1 font-semibold">Good</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="today-title">
        <div class="mb-3 flex items-center justify-between px-1">
          <h3 id="today-title" class="font-semibold">Your day</h3>
          <button type="button" class="text-sm font-medium text-primary">Customize</button>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <article class="col-span-2 rounded-2xl border bg-card p-4 shadow-sm">
            <div class="grid grid-cols-[auto_1fr_auto] items-center gap-3">
              <Apple class="size-10 rounded-xl bg-primary/10 p-2.5 text-primary" />
              <div>
                <p class="font-semibold">Nutrition</p>
                <p class="text-xs text-muted-foreground">550 kcal remaining</p>
              </div>
              <ChevronRight class="size-5 text-muted-foreground" />
            </div>
            <Progress :model-value="calorieProgress" class="mt-4" />
            <div class="mt-3 grid grid-cols-3 text-sm">
              <div>
                <span class="font-semibold">122g</span
                ><span class="text-muted-foreground"> protein</span>
              </div>
              <div class="text-center">
                <span class="font-semibold">180g</span
                ><span class="text-muted-foreground"> carbs</span>
              </div>
              <div class="text-right">
                <span class="font-semibold">51g</span
                ><span class="text-muted-foreground"> fat</span>
              </div>
            </div>
          </article>

          <article class="rounded-2xl border bg-card p-4 shadow-sm">
            <div class="flex size-9 items-center justify-center rounded-xl bg-primary/10">
              <BedDouble class="size-5 text-primary" />
            </div>
            <p class="mt-4 text-2xl font-bold">7h 20m</p>
            <p class="text-sm text-muted-foreground">Sleep · Good</p>
          </article>

          <article class="rounded-2xl border bg-card p-4 shadow-sm">
            <div class="flex items-start justify-between">
              <div class="flex size-9 items-center justify-center rounded-xl bg-primary/10">
                <Droplets class="size-5 text-primary" />
              </div>
              <button
                type="button"
                class="flex size-9 items-center justify-center rounded-full border"
                aria-label="Add one glass of water"
                @click="addWater"
              >
                <Plus class="size-4" />
              </button>
            </div>
            <p class="mt-4 text-2xl font-bold">{{ waterGlasses }} / 8</p>
            <p class="text-sm text-muted-foreground">Glasses of water</p>
          </article>

          <article class="rounded-2xl border bg-card p-4 shadow-sm">
            <div class="flex size-9 items-center justify-center rounded-xl bg-primary/10">
              <Scale class="size-5 text-primary" />
            </div>
            <p class="mt-4 text-2xl font-bold">81.4 kg</p>
            <p class="text-sm text-success">0.4 kg toward goal</p>
          </article>

          <article class="rounded-2xl border bg-card p-4 shadow-sm">
            <div class="flex size-9 items-center justify-center rounded-xl bg-primary/10">
              <Dumbbell class="size-5 text-primary" />
            </div>
            <p class="mt-4 font-semibold">Upper body</p>
            <p class="text-sm text-muted-foreground">Planned · 18:00</p>
          </article>
        </div>
      </section>
    </main>

    <div class="pointer-events-none fixed inset-x-0 bottom-5 z-10 flex justify-center px-4">
      <Button class="pointer-events-auto h-12 rounded-full px-6 shadow-lg">
        <Plus class="mr-2 size-5" />
        Log something
      </Button>
    </div>
    <!-- eslint-enable @intlify/vue-i18n/no-raw-text -->
  </div>
</template>
