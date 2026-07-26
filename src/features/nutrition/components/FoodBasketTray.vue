<script setup lang="ts">
import { Minus, Plus } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { isAdjustable, type StagedItem } from '../lib/foodBasket'

/** One tap of the stepper. Coarse on purpose: this is a thumb, mid-meal. */
const GRAMS_STEP = 10

const { items } = defineProps<{ items: ReadonlyArray<StagedItem> }>()
const emit = defineEmits<{
  adjust: [stageId: string, delta: number]
  remove: [stageId: string]
}>()

const { t } = useI18n()

const expandedId = ref<string | null>(null)
const expanded = computed(() => items.find((item) => item.stageId === expandedId.value))

// An item removed while its editor is open would otherwise leave the editor
// pinned to nothing.
watch(
  () => items.length,
  () => {
    if (expanded.value === undefined) expandedId.value = null
  },
)

function toggle(stageId: string): void {
  expandedId.value = expandedId.value === stageId ? null : stageId
}
</script>

<template>
  <div>
    <div class="flex min-w-0 items-center gap-1 overflow-x-auto" data-testid="food-basket-tray">
      <p v-if="items.length === 0" class="truncate text-xs text-muted-foreground">
        {{ t('nutrition.sheet.basketEmpty') }}
      </p>
      <button
        v-for="item in items"
        :key="item.stageId"
        type="button"
        class="max-w-28 shrink-0 truncate rounded-full border px-2.5 py-1 text-xs font-medium transition-colors"
        :class="
          expandedId === item.stageId
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-primary/30 bg-primary/10 text-primary'
        "
        :aria-label="t('nutrition.sheet.adjust', { name: item.name })"
        :aria-expanded="expandedId === item.stageId"
        @click="toggle(item.stageId)"
      >
        {{ item.name }}
      </button>
    </div>

    <div v-if="expanded" class="mt-2 flex items-center gap-2 rounded-xl bg-muted p-2">
      <p class="min-w-0 flex-1 truncate text-xs font-medium">{{ expanded.name }}</p>
      <template v-if="isAdjustable(expanded)">
        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-lg bg-background"
          :aria-label="t('nutrition.sheet.less')"
          @click="emit('adjust', expanded.stageId, -GRAMS_STEP)"
        >
          <Minus class="size-3.5" aria-hidden="true" />
        </button>
        <span class="w-16 text-center text-xs font-semibold tabular-nums">
          {{ Math.round(expanded.grams) }}{{ t('nutrition.gramsUnit') }}
        </span>
        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-lg bg-background"
          :aria-label="t('nutrition.sheet.more')"
          @click="emit('adjust', expanded.stageId, GRAMS_STEP)"
        >
          <Plus class="size-3.5" aria-hidden="true" />
        </button>
      </template>
      <button
        type="button"
        class="rounded-lg px-2 py-1 text-xs font-medium text-destructive"
        @click="emit('remove', expanded.stageId)"
      >
        {{ t('nutrition.sheet.remove') }}
      </button>
    </div>
  </div>
</template>
