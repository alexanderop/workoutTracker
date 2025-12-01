<script setup lang="ts">
import { Search, X } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { popularExercises } from '@/data/popularExercises'

type Emits = {
  select: [exercise: { name: string; icon: string }]
}

const open = defineModel<boolean>('open', { required: true })
const { mode = 'multi' } = defineProps<{
  mode?: 'single' | 'multi'
}>()
const emit = defineEmits<Emits>()

const searchQuery = ref('')

const filteredExercises = computed(() => {
  if (!searchQuery.value.trim()) {
    return popularExercises.slice(0, 10)
  }
  const query = searchQuery.value.toLowerCase()
  return popularExercises.filter((ex) => ex.name.toLowerCase().includes(query)).slice(0, 10)
})

watch(open, (isOpen) => {
  if (isOpen) {
    searchQuery.value = ''
  }
})

function handleSelect(name: string, icon: string) {
  emit('select', { name, icon })
  searchQuery.value = ''
  if (mode === 'single') {
    open.value = false
  }
}

function handleClose() {
  open.value = false
}
</script>

<template>
  <div v-if="open" class="absolute inset-0 bg-background flex flex-col z-20">
    <div class="p-4 border-b">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold">{{ mode === 'single' ? 'Select Exercise' : 'Add Exercise' }}</h3>
        <Button variant="ghost" size="icon-sm" @click="handleClose">
          <X class="w-4 h-4" />
        </Button>
      </div>

      <div class="relative">
        <Search
          class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
        />
        <Input v-model="searchQuery" placeholder="Search exercises..." class="pl-10" autofocus />
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-4">
      <button
        v-for="exercise in filteredExercises"
        :key="exercise.name"
        class="w-full flex items-center gap-3 py-3 text-left hover:bg-muted/50 rounded-lg px-2 transition-colors"
        @click="handleSelect(exercise.name, exercise.icon)"
      >
        <span class="text-2xl">{{ exercise.icon }}</span>
        <span class="font-medium">{{ exercise.name }}</span>
      </button>
    </div>
  </div>
</template>
