<script setup lang="ts">
import { ChevronLeft, Edit2, MoreVertical, Trash2 } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Props {
  exerciseName: string
  equipment: string
  targetReps: number
}

defineProps<Props>()
defineEmits<{
  delete: []
}>()

const router = useRouter()
</script>

<template>
  <div class="sticky top-0 border-b border-border bg-background/95 backdrop-blur-sm z-10">
    <div class="flex items-center gap-3 px-4 py-3">
      <Button
        variant="ghost"
        size="icon"
        class="h-9 w-9 flex-shrink-0"
        @click="router.back()"
      >
        <ChevronLeft class="w-5 h-5" />
      </Button>
      <div class="flex-1 min-w-0">
        <h1 class="text-base font-semibold text-primary truncate">
          {{ exerciseName }}
        </h1>
        <p class="text-xs text-muted-foreground mt-0.5">
          {{ equipment }} <span class="text-primary/60">·</span> {{ targetReps }} Reps
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon" class="h-8 w-8">
            <MoreVertical class="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Edit2 class="mr-2 h-4 w-4" />
            <span>Edit Exercise</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="text-destructive" @click="$emit('delete')">
            <Trash2 class="mr-2 h-4 w-4" />
            <span>Delete Exercise</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

  </div>
</template>
