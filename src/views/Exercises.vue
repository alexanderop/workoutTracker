<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Card, CardContent } from '@/components/ui/card'
</script>

<template>
  <div class="flex-1 p-4">
    <Card class="mb-6">
      <CardContent class="pt-6">
        <h1 class="text-3xl font-bold mb-2">Exercises</h1>
        <p class="text-muted-foreground">Browse and manage your exercises</p>
      </CardContent>
    </Card>

    <div class="grid gap-4">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No exercises yet</EmptyTitle>
          <EmptyDescription>Add your first exercise to get started</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>

    <div class="mt-6">
      <Button>Add Exercise</Button>
    </div>
  </div>
</template>
