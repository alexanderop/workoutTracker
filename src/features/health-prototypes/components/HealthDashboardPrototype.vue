<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Apple,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardList,
  Dumbbell,
  Flame,
  History,
  ListChecks,
  Play,
  Plus,
  Scale,
  Target,
  Timer,
  Utensils,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

const calorieTarget = 2200
const baseCalories = 1650
const snackCalories = 180
const snackLogged = ref(false)
const calendarExpanded = ref(false)
const completedHabits = ref([true, true, false, false])

const consumedCalories = computed(() => baseCalories + (snackLogged.value ? snackCalories : 0))
const remainingCalories = computed(() => calorieTarget - consumedCalories.value)
const calorieProgress = computed(() => (consumedCalories.value / calorieTarget) * 100)
const completedHabitCount = computed(() => completedHabits.value.filter(Boolean).length)

const meals = computed(() => [
  { name: 'Breakfast', summary: 'Oats, berries, Greek yogurt', calories: 430 },
  { name: 'Lunch', summary: 'Chicken bowl with rice', calories: 620 },
  { name: 'Dinner', summary: 'Not logged yet', calories: 0 },
  {
    name: 'Snacks',
    summary: snackLogged.value ? 'Apple, protein yogurt' : 'Apple',
    calories: snackLogged.value ? 310 : 130,
  },
])

const habits = ['Morning supplements', '10 minute walk', 'Stretching', 'Read 20 minutes']

const weekDays = [
  { label: 'Mon', day: 13, hasWorkout: true, isToday: false },
  { label: 'Tue', day: 14, hasWorkout: false, isToday: false },
  { label: 'Wed', day: 15, hasWorkout: true, isToday: false },
  { label: 'Thu', day: 16, hasWorkout: false, isToday: false },
  { label: 'Fri', day: 17, hasWorkout: true, isToday: false },
  { label: 'Sat', day: 18, hasWorkout: false, isToday: false },
  { label: 'Sun', day: 19, hasWorkout: false, isToday: true },
] as const

function toggleHabit(index: number) {
  completedHabits.value = completedHabits.value.map((isCompleted, habitIndex) =>
    habitIndex === index ? !isCompleted : isCompleted,
  )
}
</script>

<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -- prototype-only sample copy -->
  <div class="min-h-full bg-muted/30 pb-8">
    <header class="border-b bg-background px-4 pb-5 pt-6">
      <div class="mx-auto max-w-2xl">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays class="size-4" />
              Sunday, 19 July
            </div>
            <h2 class="mt-1 text-2xl font-bold tracking-tight">Today</h2>
            <p class="mt-1 text-sm text-muted-foreground">
              Nutrition, training, weight, and habits in one place.
            </p>
          </div>
          <button
            type="button"
            class="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-card"
            aria-label="Open goals"
          >
            <Target class="size-5 text-primary" />
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-2xl space-y-4 p-4">
      <section class="rounded-2xl border bg-card p-4 shadow-sm">
        <button
          type="button"
          class="w-full text-left"
          :aria-expanded="calendarExpanded"
          @click="calendarExpanded = !calendarExpanded"
        >
          <span class="mb-3 flex items-center justify-between">
            <span class="text-sm font-medium text-muted-foreground">July 2026</span>
            <span class="flex items-center gap-1 text-sm font-semibold">
              2h 08m <ChevronRight class="size-4 text-muted-foreground" />
            </span>
          </span>
          <span class="grid grid-cols-7 gap-1">
            <span v-for="day in weekDays" :key="day.day" class="flex flex-col items-center gap-1">
              <span class="text-xs text-muted-foreground">{{ day.label }}</span>
              <span
                class="flex size-8 items-center justify-center rounded-full text-sm font-medium"
                :class="day.isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'"
              >
                {{ day.day }}
              </span>
              <span class="flex h-1.5 items-center justify-center">
                <span v-if="day.hasWorkout" class="size-1.5 rounded-full bg-success" />
              </span>
            </span>
          </span>
        </button>
        <div
          v-if="calendarExpanded"
          class="mt-3 flex items-center justify-between border-t pt-3 text-sm"
        >
          <span class="text-muted-foreground">3 workouts this week · 8 this month</span>
          <button type="button" class="font-semibold text-primary">Open calendar</button>
        </div>
      </section>

      <section aria-labelledby="nutrition-heading" class="rounded-2xl border bg-card p-5 shadow-sm">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <span class="flex size-11 items-center justify-center rounded-xl bg-primary/10">
              <Apple class="size-5 text-primary" />
            </span>
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-primary">Nutrition</p>
              <h3 id="nutrition-heading" class="text-lg font-semibold">Daily energy</h3>
            </div>
          </div>
          <button type="button" class="flex items-center text-sm font-semibold text-primary">
            Diary <ChevronRight class="ml-1 size-4" />
          </button>
        </div>

        <div class="mt-5 grid grid-cols-[auto_1fr] items-center gap-5">
          <div class="relative flex size-28 items-center justify-center rounded-full bg-primary/10">
            <div
              class="absolute inset-2 rounded-full border-[7px] border-primary/20 border-r-primary border-t-primary"
            />
            <div class="relative text-center">
              <p class="text-2xl font-bold">{{ remainingCalories }}</p>
              <p class="text-xs text-muted-foreground">kcal left</p>
            </div>
          </div>
          <div>
            <p class="text-sm text-muted-foreground">Consumed</p>
            <p class="text-3xl font-bold">
              {{ consumedCalories.toLocaleString() }}
              <span class="text-sm font-medium text-muted-foreground"
                >/ {{ calorieTarget.toLocaleString() }}</span
              >
            </p>
            <Progress :model-value="calorieProgress" class="mt-3" />
            <p class="mt-2 text-xs text-muted-foreground">Exercise calories are not included.</p>
          </div>
        </div>

        <div class="mt-5 grid grid-cols-3 divide-x rounded-xl bg-muted/60 py-3 text-center">
          <div>
            <p class="text-lg font-bold">122g</p>
            <p class="text-xs text-muted-foreground">Protein · 160g</p>
          </div>
          <div>
            <p class="text-lg font-bold">180g</p>
            <p class="text-xs text-muted-foreground">Carbs · 240g</p>
          </div>
          <div>
            <p class="text-lg font-bold">51g</p>
            <p class="text-xs text-muted-foreground">Fat · 70g</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="workout-actions-heading">
        <div class="mb-3 flex items-center justify-between px-1">
          <h3 id="workout-actions-heading" class="font-semibold">Workout</h3>
          <span class="text-xs text-muted-foreground">Quick actions</span>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <button
            type="button"
            class="flex min-h-24 flex-col items-center justify-center rounded-2xl border bg-card p-2 text-center shadow-sm"
          >
            <span class="flex size-10 items-center justify-center rounded-full bg-primary/10">
              <Play class="ml-0.5 size-5 text-primary" />
            </span>
            <span class="mt-2 text-xs font-semibold">Start workout</span>
          </button>
          <button
            type="button"
            class="flex min-h-24 flex-col items-center justify-center rounded-2xl border bg-card p-2 text-center shadow-sm"
          >
            <span class="flex size-10 items-center justify-center rounded-full bg-success/10">
              <ClipboardList class="size-5 text-success" />
            </span>
            <span class="mt-2 text-xs font-semibold">Log past</span>
          </button>
          <button
            type="button"
            class="flex min-h-24 flex-col items-center justify-center rounded-2xl border bg-card p-2 text-center shadow-sm"
          >
            <span class="flex size-10 items-center justify-center rounded-full bg-highlight/10">
              <Timer class="size-5 text-highlight" />
            </span>
            <span class="mt-2 text-xs font-semibold">Quick timer</span>
          </button>
        </div>
      </section>

      <section aria-labelledby="meals-heading" class="rounded-2xl border bg-card shadow-sm">
        <div class="flex items-center justify-between px-4 pb-2 pt-4">
          <div>
            <h3 id="meals-heading" class="font-semibold">Today's meals</h3>
            <p class="text-xs text-muted-foreground">Tap a meal to add or review food</p>
          </div>
          <Button size="sm" variant="outline" :disabled="snackLogged" @click="snackLogged = true">
            <Plus v-if="!snackLogged" class="mr-1 size-4" />
            <Check v-else class="mr-1 size-4" />
            {{ snackLogged ? 'Snack added' : 'Quick snack' }}
          </Button>
        </div>
        <ul class="divide-y" role="list">
          <li v-for="meal in meals" :key="meal.name">
            <button type="button" class="flex w-full items-center gap-3 px-4 py-3 text-left">
              <span
                class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10"
              >
                <Utensils class="size-4 text-primary" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block font-medium">{{ meal.name }}</span>
                <span class="block truncate text-xs text-muted-foreground">{{ meal.summary }}</span>
              </span>
              <span class="text-sm font-semibold"
                >{{ meal.calories || '+'
                }}<span v-if="meal.calories" class="ml-1 text-xs font-normal text-muted-foreground"
                  >kcal</span
                ></span
              >
              <ChevronRight class="size-4 shrink-0 text-muted-foreground" />
            </button>
          </li>
        </ul>
      </section>

      <div class="grid grid-cols-2 gap-3">
        <section class="rounded-2xl border bg-card p-4 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="flex size-9 items-center justify-center rounded-xl bg-primary/10">
              <Scale class="size-4 text-primary" />
            </span>
            <span class="text-xs font-medium text-success">−0.4 kg</span>
          </div>
          <p class="mt-4 text-sm text-muted-foreground">Weight</p>
          <p class="text-2xl font-bold">
            81.4 <span class="text-xs font-medium text-muted-foreground">kg</span>
          </p>
          <button type="button" class="mt-2 text-xs font-semibold text-primary">
            View progress
          </button>
        </section>

        <section class="rounded-2xl border bg-card p-4 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="flex size-9 items-center justify-center rounded-xl bg-primary/10">
              <ListChecks class="size-4 text-primary" />
            </span>
            <span class="text-xs font-medium text-muted-foreground"
              >{{ completedHabitCount }} / {{ habits.length }}</span
            >
          </div>
          <p class="mt-4 text-sm text-muted-foreground">Habits</p>
          <p class="text-2xl font-bold">{{ completedHabitCount }} done</p>
          <button type="button" class="mt-2 text-xs font-semibold text-primary">Open habits</button>
        </section>
      </div>

      <section
        aria-labelledby="habit-list-heading"
        class="rounded-2xl border bg-card p-4 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <div>
            <h3 id="habit-list-heading" class="font-semibold">Today's habits</h3>
            <p class="text-xs text-muted-foreground">Small actions, kept visible</p>
          </div>
          <Flame class="size-5 text-highlight" />
        </div>
        <div class="mt-4 grid grid-cols-2 gap-2">
          <button
            v-for="(habit, index) in habits"
            :key="habit"
            type="button"
            class="flex min-h-12 items-center gap-2 rounded-xl border p-3 text-left text-sm"
            :class="completedHabits[index] ? 'border-success/40 bg-success/10' : 'bg-background'"
            :aria-pressed="completedHabits[index]"
            @click="toggleHabit(index)"
          >
            <span
              class="flex size-6 shrink-0 items-center justify-center rounded-full border"
              :class="
                completedHabits[index]
                  ? 'border-success bg-success text-success-foreground'
                  : 'border-border'
              "
            >
              <Check v-if="completedHabits[index]" class="size-3.5" />
            </span>
            <span :class="completedHabits[index] && 'line-through opacity-70'">{{ habit }}</span>
          </button>
        </div>
      </section>

      <section aria-labelledby="recent-workouts-heading">
        <div class="mb-3 flex items-center justify-between px-1">
          <h3 id="recent-workouts-heading" class="font-semibold">Recent workouts</h3>
          <button type="button" class="flex items-center text-sm font-semibold text-primary">
            View all <ChevronRight class="ml-1 size-4" />
          </button>
        </div>
        <div class="space-y-2">
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-2xl border bg-card p-4 text-left shadow-sm"
          >
            <span
              class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10"
            >
              <Dumbbell class="size-5 text-primary" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block font-semibold">Upper-body strength</span>
              <span class="block text-xs text-muted-foreground"
                >Friday · 58 min · 16 working sets</span
              >
            </span>
            <ChevronRight class="size-4 shrink-0 text-muted-foreground" />
          </button>
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-2xl border bg-card p-4 text-left shadow-sm"
          >
            <span
              class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-highlight/10"
            >
              <History class="size-5 text-highlight" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block font-semibold">Conditioning · 20 min AMRAP</span>
              <span class="block text-xs text-muted-foreground"
                >Wednesday · 8 rounds + 12 reps</span
              >
            </span>
            <ChevronRight class="size-4 shrink-0 text-muted-foreground" />
          </button>
        </div>
      </section>
    </main>

    <!-- eslint-enable @intlify/vue-i18n/no-raw-text -->
  </div>
</template>
