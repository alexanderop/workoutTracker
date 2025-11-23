<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
</script>

<template>
  <div class="flex flex-col items-center justify-center flex-1 p-4">
    <Card class="w-full max-w-md">
      <CardContent class="pt-6 text-center">
        <h1 class="text-4xl font-bold mb-4">Welcome to Workout Tracker</h1>
        <p class="text-lg text-muted-foreground mb-8">
          Track your workouts, monitor your exercises, and achieve your fitness goals
        </p>
        <Button size="lg">Get Started</Button>
      </CardContent>
    </Card>
  </div>
</template>
