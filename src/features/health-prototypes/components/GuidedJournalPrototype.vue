<script setup lang="ts">
import { ref } from 'vue'
import {
  Apple,
  BedDouble,
  Brain,
  Check,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Feather,
  Scale,
  Search,
  Sparkles,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'

const feelings = ['Heavy', 'Tense', 'Steady', 'Light', 'Energized'] as const
const selectedFeeling = ref<(typeof feelings)[number]>('Steady')
const checkInSaved = ref(false)

function selectFeeling(feeling: (typeof feelings)[number]) {
  selectedFeeling.value = feeling
  checkInSaved.value = false
}
</script>

<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -- prototype-only sample copy -->
  <div class="min-h-full bg-muted/30 pb-10">
    <header class="bg-background px-5 pb-6 pt-7">
      <div class="mx-auto max-w-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-muted-foreground">Sunday, 19 July</p>
            <h2 class="mt-1 text-3xl font-semibold tracking-tight">Your health journal</h2>
          </div>
          <button
            type="button"
            class="flex size-11 items-center justify-center rounded-full border bg-card"
            aria-label="Search journal"
          >
            <Search class="size-5" />
          </button>
        </div>

        <div class="mt-6 rounded-3xl border bg-card p-5 shadow-sm">
          <div class="flex items-center gap-2 text-primary">
            <Sparkles class="size-4" />
            <p class="text-xs font-semibold uppercase tracking-wider">Daily reflection</p>
          </div>
          <h3 class="mt-3 text-xl font-semibold">How does today feel in your body?</h3>
          <div class="mt-4 flex gap-2 overflow-x-auto pb-1">
            <button
              v-for="feeling in feelings"
              :key="feeling"
              type="button"
              class="shrink-0 rounded-full border px-4 py-2 text-sm transition"
              :class="
                selectedFeeling === feeling
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground'
              "
              :aria-pressed="selectedFeeling === feeling"
              @click="selectFeeling(feeling)"
            >
              {{ feeling }}
            </button>
          </div>
          <button
            type="button"
            class="mt-4 flex min-h-20 w-full items-start rounded-2xl bg-muted/60 p-4 text-left text-sm text-muted-foreground"
          >
            <Feather class="mr-3 mt-0.5 size-4 shrink-0" />
            Add a thought, symptom, or moment…
          </button>
          <Button class="mt-4 w-full rounded-xl" @click="checkInSaved = true">
            <Check v-if="checkInSaved" class="mr-2 size-4" />
            {{ checkInSaved ? 'Reflection saved' : 'Save reflection' }}
          </Button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-lg p-5">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Timeline
          </p>
          <h3 class="mt-1 text-lg font-semibold">Today</h3>
        </div>
        <div class="flex gap-1">
          <button
            type="button"
            class="flex size-9 items-center justify-center rounded-full border bg-card"
            aria-label="Previous day"
          >
            <ChevronLeft class="size-4" />
          </button>
          <button
            type="button"
            class="flex size-9 items-center justify-center rounded-full border bg-card"
            aria-label="Next day"
          >
            <ChevronRight class="size-4" />
          </button>
        </div>
      </div>

      <ol
        class="relative mt-5 space-y-1 before:absolute before:bottom-6 before:left-5 before:top-6 before:w-px before:bg-border"
      >
        <li class="relative flex gap-4 py-3">
          <span
            class="z-10 flex size-10 shrink-0 items-center justify-center rounded-full border bg-background"
            ><Apple class="size-4 text-primary"
          /></span>
          <article class="flex-1 rounded-2xl border bg-card p-4">
            <p class="text-xs text-muted-foreground">09:30</p>
            <div class="mt-1 flex items-baseline justify-between gap-3">
              <h4 class="font-semibold">Breakfast</h4>
              <span class="text-sm font-medium">520 kcal</span>
            </div>
            <p class="mt-1 text-sm text-muted-foreground">Oats, berries, Greek yogurt</p>
          </article>
        </li>
        <li class="relative flex gap-4 py-3">
          <span
            class="z-10 flex size-10 shrink-0 items-center justify-center rounded-full border bg-background"
            ><Brain class="size-4 text-primary"
          /></span>
          <article class="flex-1 rounded-2xl border bg-card p-4">
            <p class="text-xs text-muted-foreground">08:15</p>
            <h4 class="mt-1 font-semibold">Morning check-in · Steady</h4>
            <p class="mt-1 text-sm text-muted-foreground">Energy 4/5 · Stress 2/5</p>
          </article>
        </li>
        <li class="relative flex gap-4 py-3">
          <span
            class="z-10 flex size-10 shrink-0 items-center justify-center rounded-full border bg-background"
            ><Scale class="size-4 text-primary"
          /></span>
          <article class="flex-1 rounded-2xl border bg-card p-4">
            <p class="text-xs text-muted-foreground">07:45</p>
            <h4 class="mt-1 font-semibold">Weight · 81.4 kg</h4>
            <p class="mt-1 text-sm text-success">Trending gently toward your goal</p>
          </article>
        </li>
        <li class="relative flex gap-4 py-3">
          <span
            class="z-10 flex size-10 shrink-0 items-center justify-center rounded-full border bg-background"
            ><BedDouble class="size-4 text-primary"
          /></span>
          <article class="flex-1 rounded-2xl border bg-card p-4">
            <p class="text-xs text-muted-foreground">07:30</p>
            <h4 class="mt-1 font-semibold">Sleep · 7h 20m</h4>
            <p class="mt-1 text-sm text-muted-foreground">Quality: good · Woke once</p>
          </article>
        </li>
        <li class="relative flex gap-4 py-3">
          <span
            class="z-10 flex size-10 shrink-0 items-center justify-center rounded-full border bg-background"
            ><Dumbbell class="size-4 text-primary"
          /></span>
          <article class="flex-1 rounded-2xl border bg-card p-4 opacity-80">
            <p class="text-xs text-muted-foreground">Yesterday · 19:30</p>
            <h4 class="mt-1 font-semibold">Upper-body workout</h4>
            <p class="mt-1 text-sm text-muted-foreground">58 min · 16 working sets</p>
          </article>
        </li>
      </ol>
    </main>
    <!-- eslint-enable @intlify/vue-i18n/no-raw-text -->
  </div>
</template>
