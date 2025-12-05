<script setup lang="ts">
import { Plus, Search, X } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ExerciseListItem from '@/components/exercises/ExerciseListItem.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useExerciseSearch } from '@/composables/useExerciseSearch'
import type { Muscle } from '@/types/exercises'

const router = useRouter()
const { t } = useI18n()

const activeFilter = ref<Muscle | 'all'>('all')
const { searchQuery, filteredExercises } = useExerciseSearch({
  muscleFilter: activeFilter,
  searchFields: ['name', 'muscle', 'equipment'],
})

const muscleFilters = computed<Array<{ value: Muscle | 'all'; label: string }>>(() => [
  { value: 'all', label: t('exercises.filters.all') },
  { value: 'chest', label: t('exercises.muscle.chest') },
  { value: 'back', label: t('exercises.muscle.back') },
  { value: 'legs', label: t('exercises.muscle.legs') },
  { value: 'shoulders', label: t('exercises.muscle.shoulders') },
  { value: 'arms', label: t('exercises.muscle.arms') },
  { value: 'core', label: t('exercises.muscle.core') },
])

const exerciseCount = computed(() => filteredExercises.value.length)

function clearSearch() {
  searchQuery.value = ''
}

function handleCreateExercise() {
  router.push('/create-exercise')
}
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0">
    <!-- Sticky Header -->
    <div class="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-5 pt-6 pb-4">
      <!-- Title & Count -->
      <div class="mb-5">
        <h1 class="text-4xl font-semibold tracking-tight">{{ t('exercises.title') }}</h1>
        <p class="text-sm text-muted-foreground mt-1">
          {{ t('exercises.count', { count: exerciseCount }) }}
        </p>
      </div>

      <!-- Search Input -->
      <div class="relative mb-4">
        <Search
          class="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/60 pointer-events-none transition-colors"
        />
        <Input
          v-model="searchQuery"
          :placeholder="t('exercises.searchPlaceholder')"
          class="w-full pl-12 pr-10 h-14 text-base rounded-2xl bg-muted/40 border-transparent placeholder:text-muted-foreground/50 focus:bg-background focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all duration-200"
        />
        <button
          v-if="searchQuery"
          class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-muted/80 text-muted-foreground/60 hover:text-foreground transition-colors"
          @click="clearSearch"
        >
          <X class="size-4" />
        </button>
      </div>

      <!-- Filter Pills -->
      <div class="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-1">
        <button
          v-for="filter in muscleFilters"
          :key="filter.value"
          class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
          :class="
            activeFilter === filter.value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
          "
          @click="activeFilter = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <!-- Exercise List -->
    <div class="flex-1 overflow-y-auto px-5 pb-24">
      <div v-if="filteredExercises.length > 0" class="space-y-1">
        <ExerciseListItem
          v-for="exercise in filteredExercises"
          :key="exercise.id ?? exercise.name"
          :exercise="exercise"
          variant="list"
          @select="() => {}"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="flex flex-col items-center justify-center py-20 text-center">
        <div class="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
          <Search class="size-7 text-muted-foreground/40" />
        </div>
        <p class="text-base font-medium text-foreground/80 mb-1">
          {{ t('exercises.empty.title') }}
        </p>
        <p class="text-sm text-muted-foreground max-w-[240px]">
          <template v-if="searchQuery">{{
            t('exercises.empty.noResults', { query: searchQuery })
          }}</template>
          <template v-else>{{ t('exercises.empty.tryDifferent') }}</template>
        </p>
        <Button variant="outline" class="mt-4" @click="handleCreateExercise">
          <Plus class="size-4 mr-2" />
          {{ t('exercises.create.customShort') }}
        </Button>
      </div>
    </div>

    <!-- Floating Create Button -->
    <div class="fixed bottom-20 left-0 right-0 px-5 pb-4 pointer-events-none">
      <div class="max-w-lg mx-auto">
        <Button
          class="w-full h-14 text-base font-medium rounded-2xl shadow-lg shadow-primary/20 pointer-events-auto"
          @click="handleCreateExercise"
        >
          <Plus class="size-5 mr-2" />
          {{ t('exercises.create.custom') }}
        </Button>
      </div>
    </div>
  </div>
</template>
