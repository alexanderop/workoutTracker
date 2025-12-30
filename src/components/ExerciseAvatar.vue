<script setup lang="ts">
import { computed } from 'vue'
import { useObjectUrl } from '@vueuse/core'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getExerciseInitials } from '@/lib/exerciseDisplay'

const { name, image = null, size = 'md' } = defineProps<{
  name: string
  image?: Blob | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
}>()

const initials = computed(() => getExerciseInitials(name))

// useObjectUrl auto-revokes on unmount and when image changes
const imageUrl = useObjectUrl(() => image ?? undefined)

const sizeClasses = computed(() => {
  switch (size) {
    case 'sm': {
      return 'h-8 w-8 text-xs'
    }
    case 'lg': {
      return 'h-12 w-12 text-base'
    }
    case 'xl': {
      return 'h-14 w-14 text-lg'
    }
    default: {
      return 'h-10 w-10 text-sm'
    }
  }
})
</script>

<template>
  <Avatar :class="sizeClasses">
    <AvatarImage v-if="imageUrl" :src="imageUrl" :alt="name" />
    <AvatarFallback class="bg-muted font-semibold">{{ initials }}</AvatarFallback>
  </Avatar>
</template>
