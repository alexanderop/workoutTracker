<script setup lang="ts">
/**
 * Ways of switching context: the raw `Tabs` primitive, the shared
 * `SegmentedControl` built on top of it, and `ToggleGroup`.
 */
import { ref } from 'vue'
import SegmentedControl from '@/components/SegmentedControl.vue'
import type { SegmentedOption } from '@/components/SegmentedControl.vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

const range = ref<'week' | 'month' | 'year'>('week')
const equipment = ref<Array<string>>(['barbell'])

// SegmentedControl takes a mutable array, so this stays un-frozen.
const rangeOptions: Array<SegmentedOption<'week' | 'month' | 'year'>> = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
]
</script>

<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -- design reference surface, not product copy -->
  <div class="space-y-6">
    <section class="space-y-2">
      <h3 class="text-sm font-semibold">Tabs</h3>
      <Tabs default-value="sets">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="sets">Sets</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="sets" class="pt-3 text-sm text-muted-foreground">
          4 working sets logged today.
        </TabsContent>
        <TabsContent value="history" class="pt-3 text-sm text-muted-foreground">
          Last performed 3 days ago.
        </TabsContent>
      </Tabs>
    </section>

    <section class="space-y-2">
      <h3 class="text-sm font-semibold">Segmented control</h3>
      <p class="text-xs text-muted-foreground">
        <code>SegmentedControl</code> — equal-width triggers, bound with v-model.
      </p>
      <SegmentedControl v-model="range" :options="rangeOptions" />
      <p class="text-xs text-muted-foreground">Selected: {{ range }}</p>
    </section>

    <section class="space-y-2">
      <h3 class="text-sm font-semibold">Toggle group</h3>
      <p class="text-xs text-muted-foreground">Multi-select — equipment filters.</p>
      <ToggleGroup v-model="equipment" type="multiple" variant="outline">
        <ToggleGroupItem value="barbell">Barbell</ToggleGroupItem>
        <ToggleGroupItem value="dumbbell">Dumbbell</ToggleGroupItem>
        <ToggleGroupItem value="bodyweight">Bodyweight</ToggleGroupItem>
      </ToggleGroup>
    </section>
  </div>
</template>
