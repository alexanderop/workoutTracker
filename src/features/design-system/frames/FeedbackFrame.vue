<script setup lang="ts">
/**
 * How the app tells you where you are and what happened: progress, empty
 * states, separators, avatars.
 */
import { Dumbbell, Search } from '@lucide/vue'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
</script>

<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -- design reference surface, not product copy -->
  <div class="space-y-6">
    <section class="space-y-3">
      <h3 class="text-sm font-semibold">Progress</h3>
      <div class="space-y-1">
        <div class="flex items-baseline justify-between text-xs">
          <span class="text-muted-foreground">Block 3 of 5</span>
          <span class="font-medium tabular-nums">60%</span>
        </div>
        <Progress :model-value="60" />
      </div>
      <Progress :model-value="100" />
      <Progress :model-value="0" />
    </section>

    <section class="space-y-2">
      <h3 class="text-sm font-semibold">Empty state</h3>
      <Empty class="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Search />
          </EmptyMedia>
          <EmptyTitle>No exercises found</EmptyTitle>
          <EmptyDescription>
            Nothing matches that filter. Clear it, or add the exercise yourself.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="sm">Add exercise</Button>
        </EmptyContent>
      </Empty>
    </section>

    <section class="space-y-2">
      <h3 class="text-sm font-semibold">Separator</h3>
      <div class="text-sm">Set 1 — 80 kg × 8</div>
      <Separator />
      <div class="text-sm">Set 2 — 80 kg × 7</div>
    </section>

    <section class="space-y-2">
      <h3 class="text-sm font-semibold">Avatar</h3>
      <div class="flex items-center gap-3">
        <Avatar>
          <AvatarFallback>BP</AvatarFallback>
        </Avatar>
        <Avatar class="size-10 bg-primary/10">
          <AvatarFallback class="bg-transparent">
            <Dumbbell class="icon-md text-primary" />
          </AvatarFallback>
        </Avatar>
      </div>
    </section>
  </div>
</template>
