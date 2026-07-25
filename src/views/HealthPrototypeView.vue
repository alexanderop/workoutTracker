<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { ArrowLeft, LayoutDashboard, PanelsTopLeft, ScrollText } from '@lucide/vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import DailyCardsPrototype from '@/features/health-prototypes/components/DailyCardsPrototype.vue'
import GuidedJournalPrototype from '@/features/health-prototypes/components/GuidedJournalPrototype.vue'
import HealthDashboardPrototype from '@/features/health-prototypes/components/HealthDashboardPrototype.vue'

type PrototypeKind = 'cards' | 'journal' | 'dashboard'

const prototypes = [
  {
    id: 'cards',
    number: '01',
    name: 'Daily cards',
    description: 'Friendly, quick, and modular. Best for everyday logging.',
    icon: PanelsTopLeft,
  },
  {
    id: 'journal',
    number: '02',
    name: 'Guided journal',
    description: 'Calm and reflective. Mental wellbeing leads the experience.',
    icon: ScrollText,
  },
  {
    id: 'dashboard',
    number: '03',
    name: 'Health dashboard',
    description: 'Dense and analytical. Trends and targets stay visible.',
    icon: LayoutDashboard,
  },
] as const satisfies ReadonlyArray<{
  id: PrototypeKind
  number: string
  name: string
  description: string
  icon: typeof PanelsTopLeft
}>

const router = useRouter()
const selected = ref<PrototypeKind>('cards')
const prototypeViewport = useTemplateRef<HTMLElement>('prototypeViewport')
const selectedPrototype = computed(
  () => prototypes.find((prototype) => prototype.id === selected.value)!,
)

watch(selected, async () => {
  await nextTick()
  prototypeViewport.value?.scrollTo({ top: 0 })
})
</script>

<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -- prototype-only sample copy -->
  <div class="flex h-screen flex-col bg-background">
    <header class="shrink-0 border-b bg-card px-4 py-3">
      <div class="mx-auto flex max-w-5xl items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Back to settings" @click="router.back()">
          <ArrowLeft class="size-5" />
        </Button>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <h1 class="truncate text-lg font-bold">Health prototypes</h1>
            <span class="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning"
              >Demo only</span
            >
          </div>
          <p class="hidden text-sm text-muted-foreground sm:block">
            Compare the interaction model, density, and emphasis of each direction.
          </p>
        </div>
      </div>
    </header>

    <div class="shrink-0 border-b bg-background p-3">
      <div
        class="mx-auto grid max-w-3xl grid-cols-3 gap-2"
        role="tablist"
        aria-label="Health prototype concepts"
      >
        <button
          v-for="prototype in prototypes"
          :key="prototype.id"
          type="button"
          role="tab"
          class="rounded-xl border p-2.5 text-left transition sm:p-3"
          :class="
            selected === prototype.id
              ? 'border-primary bg-primary/10 text-foreground'
              : 'border-border bg-card text-muted-foreground hover:text-foreground'
          "
          :aria-selected="selected === prototype.id"
          @click="selected = prototype.id"
        >
          <div class="flex items-center gap-2">
            <component :is="prototype.icon" class="size-4 shrink-0" />
            <span class="hidden text-xs font-semibold text-primary sm:inline">{{
              prototype.number
            }}</span>
          </div>
          <p class="mt-2 text-xs font-semibold sm:text-sm">{{ prototype.name }}</p>
          <p class="mt-1 hidden text-xs leading-snug text-muted-foreground md:block">
            {{ prototype.description }}
          </p>
        </button>
      </div>
    </div>

    <div ref="prototypeViewport" class="min-h-0 flex-1 overflow-y-auto">
      <div class="mx-auto min-h-full max-w-3xl border-x bg-background shadow-sm">
        <DailyCardsPrototype v-if="selected === 'cards'" />
        <GuidedJournalPrototype v-else-if="selected === 'journal'" />
        <HealthDashboardPrototype v-else />
      </div>
    </div>

    <div class="sr-only" aria-live="polite">
      Showing {{ selectedPrototype.name }}: {{ selectedPrototype.description }}
    </div>
    <!-- eslint-enable @intlify/vue-i18n/no-raw-text -->
  </div>
</template>
