<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { Home, Dumbbell, Activity, Settings } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()

const navItems = [
  { path: '/', name: 'Home', icon: Home, label: 'Home' },
  { path: '/workouts', name: 'Workouts', icon: Dumbbell, label: 'Workouts' },
  { path: '/exercises', name: 'Exercises', icon: Activity, label: 'Exercises' },
  { path: '/settings', name: 'Settings', icon: Settings, label: 'Settings' },
]

const isActive = (path: string) => {
  return route.path === path
}
</script>

<template>
  <div class="flex flex-col h-screen bg-background">
    <!-- Header -->
    <header class="border-b bg-card sticky top-0 z-10">
      <div class="px-4 py-4">
        <h1 class="text-2xl font-bold text-foreground">Workout Tracker</h1>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto">
      <slot />
    </main>

    <!-- Bottom Navigation -->
    <nav class="border-t bg-card sticky bottom-0">
      <div class="flex justify-around">
        <button
          v-for="item in navItems"
          :key="item.path"
          @click="router.push(item.path)"
          :class="[
            'flex-1 flex flex-col items-center justify-center py-3 px-2 transition-colors',
            isActive(item.path)
              ? 'text-primary border-t-2 border-primary'
              : 'text-muted-foreground hover:text-foreground',
          ]"
        >
          <component :is="item.icon" :size="24" class="mb-1" />
          <span class="text-xs font-medium">{{ item.label }}</span>
        </button>
      </div>
    </nav>
  </div>
</template>

<style scoped></style>
