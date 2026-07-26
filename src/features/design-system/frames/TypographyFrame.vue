<script setup lang="ts">
/**
 * The type scale as it is actually used. `text-page-title` and
 * `text-section-title` are project tokens (src/style.css `@theme`); the rest
 * are Tailwind defaults kept in the ramp so the jumps are visible.
 */
type TypeSpec = { cls: string; label: string; sample: string; token?: boolean }

const ramp: ReadonlyArray<TypeSpec> = [
  { cls: 'text-page-title font-bold', label: 'text-page-title', sample: 'Push Day A', token: true },
  {
    cls: 'text-section-title font-semibold',
    label: 'text-section-title',
    sample: 'Working sets',
    token: true,
  },
  { cls: 'text-base font-medium', label: 'text-base', sample: 'Barbell Bench Press' },
  { cls: 'text-sm', label: 'text-sm', sample: '4 sets · 8 reps · 80 kg' },
  { cls: 'text-xs text-muted-foreground', label: 'text-xs', sample: 'Last performed 3 days ago' },
]

const weights = [
  { cls: 'font-normal', label: 'normal / 400' },
  { cls: 'font-medium', label: 'medium / 500' },
  { cls: 'font-semibold', label: 'semibold / 600' },
  { cls: 'font-bold', label: 'bold / 700' },
] as const
</script>

<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -- design reference surface, not product copy -->
  <div class="space-y-6">
    <section class="space-y-3">
      <h3 class="text-sm font-semibold">Scale</h3>
      <div v-for="spec in ramp" :key="spec.label" class="space-y-1 border-b pb-3 last:border-0">
        <div class="flex items-center gap-2">
          <code class="text-[11px] text-muted-foreground">{{ spec.label }}</code>
          <span
            v-if="spec.token"
            class="rounded-full bg-primary/10 px-1.5 py-px text-[10px] font-medium text-primary"
          >
            token
          </span>
        </div>
        <p :class="spec.cls">{{ spec.sample }}</p>
      </div>
    </section>

    <section class="space-y-2">
      <h3 class="text-sm font-semibold">Weights</h3>
      <p v-for="weight in weights" :key="weight.cls" class="text-sm" :class="weight.cls">
        {{ weight.label }} — Deadlift 140 kg × 5
      </p>
    </section>

    <section class="space-y-2">
      <h3 class="text-sm font-semibold">Numerals</h3>
      <p class="text-xs text-muted-foreground">
        Live counters use <code>tabular-nums</code> so digits stop jittering mid-set.
      </p>
      <div class="flex items-center gap-6">
        <div>
          <p class="text-2xl font-bold tabular-nums">01:59</p>
          <code class="text-[11px] text-muted-foreground">tabular-nums</code>
        </div>
        <div>
          <p class="text-2xl font-bold">01:59</p>
          <code class="text-[11px] text-muted-foreground">default</code>
        </div>
      </div>
    </section>
  </div>
</template>
