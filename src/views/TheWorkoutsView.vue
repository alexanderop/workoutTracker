<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
</script>

<template>
  <div class="flex-1 p-4">
    <Card class="mb-6">
      <CardContent class="pt-6">
        <h1 class="text-3xl font-bold mb-2">
          Workouts
        </h1>
        <p class="text-muted-foreground">
          View and manage your workouts
        </p>
      </CardContent>
    </Card>

    <div class="grid gap-4">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No workouts yet</EmptyTitle>
          <EmptyDescription>Start your first workout to get started</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>

    <div class="mt-6">
      <Button>Create Workout</Button>
    </div>
  </div>
</template>
