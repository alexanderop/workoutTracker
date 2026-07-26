<script setup lang="ts">
/**
 * Brainstorming half of the studio: move a slider, watch every frame repaint.
 *
 * The draft is applied as inline custom properties on the studio root, so the
 * panels and the artboards both follow — the fastest way to find out whether a
 * hue survives contact with a full screen instead of a single swatch.
 */
import { computed } from 'vue'
import { Check, Copy, RotateCcw } from '@lucide/vue'
import { useClipboard } from '@vueuse/core'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  CHROMA_RANGE,
  HUE_RANGE,
  LIGHTNESS_RANGE,
  PRIMARY_PRESETS,
  RADIUS_RANGE,
  formatOklch,
  isDefaultDraft,
  themeCss,
} from '../lib/themeDraft'
import type { Oklch, ThemeDraft } from '../lib/themeDraft'

const { draft, isDark } = defineProps<{
  draft: ThemeDraft
  isDark: boolean
}>()

const emit = defineEmits<{
  'update-radius': [radius: number]
  'update-primary': [primary: Oklch]
  reset: []
}>()

const { copy, copied } = useClipboard({ copiedDuring: 1500 })

const css = computed(() => themeCss(draft, isDark))
const isDefault = computed(() => isDefaultDraft(draft))
const primaryCss = computed(() => formatOklch(draft.primary))

function setChannel(channel: keyof Oklch, value: number | undefined): void {
  if (value === undefined) return
  emit('update-primary', { ...draft.primary, [channel]: value })
}
</script>

<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -- design tooling chrome, not product copy -->
  <div class="space-y-5 p-4">
    <section class="space-y-2">
      <div class="flex items-center justify-between">
        <h3 class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Primary
        </h3>
        <code class="text-[10px] text-muted-foreground">{{ primaryCss }}</code>
      </div>

      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="preset in PRIMARY_PRESETS"
          :key="preset.name"
          type="button"
          class="size-7 rounded-md border transition-transform hover:scale-110"
          :style="{ backgroundColor: formatOklch(preset.color) }"
          :title="preset.name"
          :aria-label="`Use the ${preset.name} primary`"
          @click="emit('update-primary', preset.color)"
        />
      </div>

      <div class="space-y-2 pt-1">
        <div class="space-y-1">
          <div class="flex items-baseline justify-between">
            <Label class="text-xs">Lightness</Label>
            <span class="text-[10px] tabular-nums text-muted-foreground">{{
              draft.primary.l
            }}</span>
          </div>
          <Slider
            label="Primary lightness"
            :model-value="[draft.primary.l]"
            :min="LIGHTNESS_RANGE.min"
            :max="LIGHTNESS_RANGE.max"
            :step="LIGHTNESS_RANGE.step"
            @update:model-value="setChannel('l', $event?.[0])"
          />
        </div>

        <div class="space-y-1">
          <div class="flex items-baseline justify-between">
            <Label class="text-xs">Chroma</Label>
            <span class="text-[10px] tabular-nums text-muted-foreground">{{
              draft.primary.c
            }}</span>
          </div>
          <Slider
            label="Primary chroma"
            :model-value="[draft.primary.c]"
            :min="CHROMA_RANGE.min"
            :max="CHROMA_RANGE.max"
            :step="CHROMA_RANGE.step"
            @update:model-value="setChannel('c', $event?.[0])"
          />
        </div>

        <div class="space-y-1">
          <div class="flex items-baseline justify-between">
            <Label class="text-xs">Hue</Label>
            <span class="text-[10px] tabular-nums text-muted-foreground">{{
              draft.primary.h
            }}</span>
          </div>
          <Slider
            label="Primary hue"
            :model-value="[draft.primary.h]"
            :min="HUE_RANGE.min"
            :max="HUE_RANGE.max"
            :step="HUE_RANGE.step"
            @update:model-value="setChannel('h', $event?.[0])"
          />
        </div>
      </div>
    </section>

    <section class="space-y-2 border-t pt-4">
      <div class="flex items-baseline justify-between">
        <h3 class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Corner radius
        </h3>
        <span class="text-[10px] tabular-nums text-muted-foreground">{{ draft.radius }}rem</span>
      </div>
      <Slider
        label="Corner radius"
        :model-value="[draft.radius]"
        :min="RADIUS_RANGE.min"
        :max="RADIUS_RANGE.max"
        :step="RADIUS_RANGE.step"
        @update:model-value="emit('update-radius', $event?.[0] ?? draft.radius)"
      />
      <p class="text-[11px] leading-relaxed text-muted-foreground">
        Every <code>rounded-*</code> in the app derives from this one value.
      </p>
    </section>

    <section class="space-y-2 border-t pt-4">
      <h3 class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Export
      </h3>
      <pre
        class="max-h-40 overflow-auto rounded-md border bg-muted/40 p-2 text-[10px] leading-relaxed"
      ><code>{{ css }}</code></pre>
      <div class="flex gap-2">
        <Button size="sm" class="flex-1" @click="copy(css)">
          <Check v-if="copied" />
          <Copy v-else />
          {{ copied ? 'Copied' : 'Copy CSS' }}
        </Button>
        <Button size="sm" variant="outline" :disabled="isDefault" @click="emit('reset')">
          <RotateCcw />
          Reset
        </Button>
      </div>
      <p class="text-[11px] leading-relaxed text-muted-foreground">
        Preview only — nothing is saved. Paste the block into
        <code>src/style.css</code> to keep it.
      </p>
    </section>
  </div>
</template>
