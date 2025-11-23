<script setup lang="ts">
import { ChevronLeft, Edit2, MoreVertical, Trash2 } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { Badge } from '@/components/ui/badge'
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
    <div class="flex items-center gap-4 p-4">
      <Button
        variant="outline"
        size="icon"
        class="h-8 w-8 flex-shrink-0"
        @click="router.back()"
      >
        <ChevronLeft class="w-4 h-4" />
      </Button>
      <div class="flex-1 min-w-0">
        <h1 class="text-lg font-bold text-blue-500 truncate">
          {{ exerciseName }}
        </h1>
        <p class="text-xs text-muted-foreground">
          {{ equipment }} • {{ targetReps }} Reps
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

    <!-- Metadata Badges -->
    <div class="px-4 pb-4 flex gap-2 flex-wrap">
      <Badge variant="outline" class="text-xs cursor-pointer">
        ✏️ Edit
      </Badge>
    </div>
  </div>
</template>
