<script setup lang="ts">
import type { Equipment, Muscle } from '@/exercises/types'
import type { Exercise } from '@/exercises/useExerciseSearch'

import { Plus, Search, X } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { RouteNames } from '@/router'
import ExerciseFilters from '@/exercises/ui/ExerciseFilters.vue'
import ExerciseListItem from '@/exercises/ui/ExerciseListItem.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useExerciseSearch } from '@/exercises/useExerciseSearch'

const router = useRouter()
const { t } = useI18n()

const muscleFilter = ref<Muscle | 'all'>('all')
const equipmentFilter = ref<Equipment | 'all'>('all')
const { searchQuery, filteredExercises } = useExerciseSearch({
  muscleFilter,
  equipmentFilter,
  searchFields: ['name', 'muscle', 'equipment'],
})

const exerciseCount = computed(() => filteredExercises.value.length)

function clearSearch() {
  searchQuery.value = ''
}

function handleCreateExercise() {
  router.push({ name: RouteNames.ExerciseForm })
}

function handleExerciseSelect(exercise: Exercise) {
  if (!exercise.id) return
  router.push({ name: RouteNames.ExerciseProgress, params: { id: exercise.id } })
}
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0">
    <!-- Sticky Header -->
    <div class="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-5 pt-6 pb-4">
      <!-- Title & Count -->
      <div class="mb-5">
        <h1 class="text-page-title font-semibold tracking-tight">{{ t('exercises.title') }}</h1>
        <p class="text-sm text-muted-foreground mt-1">
          {{ t('exercises.count', { count: exerciseCount }) }}
        </p>
      </div>

      <!-- Search Input -->
      <div class="relative mb-4">
        <Search
          aria-hidden="true"
          class="absolute left-4 top-1/2 -translate-y-1/2 icon-md text-muted-foreground/60 pointer-events-none transition-colors"
        />
        <Input
          v-model="searchQuery"
          :placeholder="t('exercises.searchPlaceholder')"
          :aria-label="t('common.aria.searchExercises')"
          class="w-full truncate pl-12 pr-10 h-14 text-base rounded-2xl bg-muted/40 border-transparent placeholder:text-muted-foreground/50 focus:bg-background focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all duration-200"
        />
        <button
          v-if="searchQuery"
          :aria-label="t('common.aria.clearSearch')"
          class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-muted/80 text-muted-foreground/60 hover:text-foreground transition-colors"
          @click="clearSearch"
        >
          <X aria-hidden="true" class="icon-sm" />
        </button>
      </div>

      <!-- Filter Pills -->
      <ExerciseFilters
        v-model:muscle="muscleFilter"
        v-model:equipment="equipmentFilter"
        muscle-class="-mx-5 px-5"
        equipment-class="-mx-5 px-5 mt-2 pb-1"
      />
    </div>

    <!-- Exercise List -->
    <div class="flex-1 overflow-y-auto px-5 pb-24">
      <div v-if="filteredExercises.length > 0" class="space-y-1">
        <ExerciseListItem
          v-for="exercise in filteredExercises"
          :key="exercise.id ?? exercise.name"
          :exercise="exercise"
          @select="handleExerciseSelect"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="flex flex-col items-center justify-center py-20 text-center">
        <div class="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
          <Search aria-hidden="true" class="size-7 text-muted-foreground/40" />
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
          <Plus class="icon-sm mr-2" />
          {{ t('exercises.create.customShort') }}
        </Button>
      </div>
    </div>

    <!-- Floating Create Button -->
    <div class="fixed bottom-20 left-0 right-0 px-5 pb-4 safe-area-bottom pointer-events-none">
      <div class="max-w-lg mx-auto">
        <Button
          class="w-full h-14 text-base font-medium rounded-2xl shadow-lg shadow-primary/20 pointer-events-auto"
          @click="handleCreateExercise"
        >
          <Plus class="icon-md mr-2" />
          {{ t('exercises.create.custom') }}
        </Button>
      </div>
    </div>
  </div>
</template>
