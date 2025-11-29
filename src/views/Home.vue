<script setup lang="ts">
import { ArrowRight, Play } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const router = useRouter()

function startWorkout() {
  router.push('/workout/active')
}
</script>

<template>
  <div class="flex flex-col items-center justify-center flex-1 p-4">
    <!-- Main action card -->
    <Card
      class="w-full max-w-md cursor-pointer group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
      @click="startWorkout"
    >
      <CardHeader class="text-center pb-4">
        <div class="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <Play class="w-8 h-8 text-primary ml-1" />
        </div>
        <CardTitle class="text-2xl">
          Start New Workout
        </CardTitle>
        <CardDescription>
          Track your exercises, sets, and reps
        </CardDescription>
      </CardHeader>
      <CardContent class="pt-0">
        <Button class="w-full group/btn" size="lg">
          Get Started
          <ArrowRight class="ml-2 w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
