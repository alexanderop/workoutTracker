<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { popularExercises } from '@/data/popularExercises'
import { EQUIPMENT_LABELS, MUSCLE_LABELS } from '@/lib/exerciseLabels'

const router = useRouter()
const searchQuery = ref('')

const filteredExercises = computed(() => {
  if (!searchQuery.value.trim()) {
    return popularExercises
  }
  const query = searchQuery.value.toLowerCase()
  return popularExercises.filter(
    (ex) =>
      ex.name.toLowerCase().includes(query) ||
      ex.muscle.toLowerCase().includes(query) ||
      ex.equipment.toLowerCase().includes(query),
  )
})

function handleCreateExercise() {
  router.push('/create-exercise')
}
</script>

<template>
  <div class="flex-1 p-4">
    <Card class="mb-6">
      <CardContent class="pt-6">
        <h1 class="text-3xl font-bold mb-2">Exercises</h1>
        <p class="text-muted-foreground">Browse and manage your exercises</p>
      </CardContent>
    </Card>

    <!-- Search Input -->
    <div class="relative mb-4">
      <Search
        class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
      />
      <Input
        v-model="searchQuery"
        placeholder="Search exercises..."
        class="w-full pl-10 h-12 text-base bg-muted/50 border-transparent focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
      />
    </div>

    <!-- Exercises List -->
    <Card>
      <CardContent class="p-0">
        <button
          v-for="(exercise, index) in filteredExercises"
          :key="exercise.name"
          class="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors active:bg-muted/50 group"
          :class="index !== filteredExercises.length - 1 ? 'border-b border-border/50' : ''"
        >
          <span class="text-2xl flex-shrink-0 group-active:scale-110 transition-transform">{{
            exercise.icon
          }}</span>
          <div class="min-w-0 flex-1">
            <p class="font-medium text-[15px] truncate">
              {{ exercise.name }}
            </p>
            <div class="flex gap-1.5 mt-0.5">
              <Badge variant="secondary" class="text-xs font-normal">
                {{ MUSCLE_LABELS[exercise.muscle] }}
              </Badge>
              <Badge variant="outline" class="text-xs font-normal">
                {{ EQUIPMENT_LABELS[exercise.equipment] }}
              </Badge>
            </div>
          </div>
        </button>

        <!-- Empty Search State -->
        <div v-if="filteredExercises.length === 0" class="text-center py-12">
          <Search class="size-8 text-muted-foreground/30 mx-auto mb-3" />
          <p class="text-sm text-muted-foreground">No exercises found for "{{ searchQuery }}"</p>
        </div>
      </CardContent>
    </Card>

    <!-- Create Custom Exercise Button -->
    <div class="mt-6">
      <Button class="w-full" @click="handleCreateExercise"> + Create Custom Exercise </Button>
    </div>
  </div>
</template>
