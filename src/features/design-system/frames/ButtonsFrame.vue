<script setup lang="ts">
/**
 * The real `Button`, every variant and size. Nothing here is a mock-up: change
 * `buttonVariants` in src/components/ui/button/index.ts and this frame changes.
 */
import { Check, Plus, Trash2 } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import type { ButtonVariants } from '@/components/ui/button'

const variants: ReadonlyArray<NonNullable<ButtonVariants['variant']>> = [
  'default',
  'secondary',
  'outline',
  'ghost',
  'destructive',
  'link',
]

const sizes: ReadonlyArray<NonNullable<ButtonVariants['size']>> = ['sm', 'default', 'lg']
</script>

<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -- design reference surface, not product copy -->
  <div class="space-y-6">
    <section class="space-y-2">
      <h3 class="text-sm font-semibold">Variants</h3>
      <div class="flex flex-wrap items-center gap-2">
        <Button v-for="variant in variants" :key="variant" :variant="variant">
          {{ variant }}
        </Button>
      </div>
    </section>

    <section class="space-y-2">
      <h3 class="text-sm font-semibold">Sizes</h3>
      <div class="flex flex-wrap items-center gap-2">
        <Button v-for="size in sizes" :key="size" :size="size">{{ size }}</Button>
      </div>
    </section>

    <section class="space-y-2">
      <h3 class="text-sm font-semibold">With icons</h3>
      <div class="flex flex-wrap items-center gap-2">
        <Button>
          <Plus />
          Add set
        </Button>
        <Button variant="outline">
          <Check />
          Finish
        </Button>
        <Button variant="ghost" size="icon" aria-label="Delete set">
          <Trash2 />
        </Button>
      </div>
    </section>

    <section class="space-y-2">
      <h3 class="text-sm font-semibold">States</h3>
      <div class="flex flex-wrap items-center gap-2">
        <Button disabled>Disabled</Button>
        <Button variant="outline" disabled>Disabled</Button>
      </div>
      <p class="text-xs text-muted-foreground">
        Focus rings come from <code>--ring</code>; tab into a button to see one.
      </p>
    </section>

    <section class="space-y-2">
      <h3 class="text-sm font-semibold">Full width</h3>
      <p class="text-xs text-muted-foreground">
        The primary in-workout action — thumb-sized, edge to edge.
      </p>
      <Button class="h-touch w-full text-base">Log set</Button>
    </section>
  </div>
</template>
