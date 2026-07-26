<script setup lang="ts">
/**
 * The properties panel. Shows what the selected frame is, the tokens it leans
 * on, and — when the frame declares controls — live knobs bound straight to
 * the real component's props.
 */
import { computed } from 'vue'
import { Check, Copy } from '@lucide/vue'
import { useClipboard } from '@vueuse/core'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Switch } from '@/components/ui/switch'
import type { DesignControlState, DesignControlValue, DesignFrameSpec } from '../types'

const { frame, sectionName, state, frameCount } = defineProps<{
  frame: DesignFrameSpec | null
  sectionName: string | null
  /** Current values of the selected frame's controls; the view owns writes. */
  state: DesignControlState | null
  frameCount: number
}>()

const emit = defineEmits<{
  'update-control': [key: string, value: DesignControlValue]
}>()

const { copy, copied } = useClipboard({ copiedDuring: 1200 })

const controls = computed(() => frame?.controls ?? [])
</script>

<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -- design tooling chrome, not product copy -->
  <aside class="flex w-72 shrink-0 flex-col overflow-y-auto border-l bg-card">
    <div v-if="!frame" class="flex flex-1 flex-col justify-center gap-2 p-6 text-center">
      <p class="text-sm font-medium">Nothing selected</p>
      <p class="text-xs text-muted-foreground">
        Pick a frame on the canvas or in the layers panel to inspect its props and tokens.
      </p>
      <p class="pt-2 text-xs text-muted-foreground/70">{{ frameCount }} frames in this file</p>
    </div>

    <template v-else>
      <div class="space-y-1 border-b p-4">
        <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {{ sectionName }}
        </p>
        <h2 class="text-sm font-semibold">{{ frame.name }}</h2>
        <p class="text-xs leading-relaxed text-muted-foreground">{{ frame.description }}</p>
      </div>

      <section v-if="controls.length > 0 && state" class="space-y-3 border-b p-4">
        <h3 class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Properties
        </h3>

        <div v-for="control in controls" :key="control.key" class="space-y-1.5">
          <template v-if="control.kind === 'select'">
            <Label :for="`ds-control-${control.key}`" class="text-xs">{{ control.label }}</Label>
            <NativeSelect
              :id="`ds-control-${control.key}`"
              :model-value="String(state[control.key])"
              class="h-8 text-xs"
              @update:model-value="emit('update-control', control.key, String($event))"
            >
              <NativeSelectOption v-for="option in control.options" :key="option" :value="option">
                {{ option }}
              </NativeSelectOption>
            </NativeSelect>
          </template>

          <template v-else-if="control.kind === 'switch'">
            <div class="flex items-center justify-between">
              <Label :for="`ds-control-${control.key}`" class="text-xs">{{ control.label }}</Label>
              <Switch
                :id="`ds-control-${control.key}`"
                :model-value="state[control.key] === true"
                @update:model-value="emit('update-control', control.key, $event === true)"
              />
            </div>
          </template>

          <template v-else>
            <Label :for="`ds-control-${control.key}`" class="text-xs">{{ control.label }}</Label>
            <Input
              :id="`ds-control-${control.key}`"
              :model-value="String(state[control.key])"
              class="h-8 text-xs"
              @update:model-value="emit('update-control', control.key, String($event))"
            />
          </template>
        </div>
      </section>

      <section v-if="frame.tokens?.length" class="space-y-2 border-b p-4">
        <h3 class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Tokens
        </h3>
        <button
          v-for="token in frame.tokens"
          :key="token"
          type="button"
          class="flex w-full items-center gap-2 rounded px-1 py-0.5 text-left transition-colors hover:bg-accent"
          @click="copy(token)"
        >
          <code class="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">{{ token }}</code>
          <Copy class="size-3 shrink-0 text-muted-foreground/60" />
        </button>
      </section>

      <section v-if="frame.source" class="space-y-2 p-4">
        <h3 class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Source
        </h3>
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-md border bg-muted/40 px-2 py-1.5 text-left transition-colors hover:bg-muted"
          @click="copy(frame.source)"
        >
          <code class="min-w-0 flex-1 truncate text-[11px]">{{ frame.source }}</code>
          <Check v-if="copied" class="size-3 shrink-0 text-success" />
          <Copy v-else class="size-3 shrink-0 text-muted-foreground/60" />
        </button>
      </section>
    </template>
  </aside>
</template>
