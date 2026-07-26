<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { DbHabit } from '@/db/schema'
import { AppIcon } from '@/components/app-icons'
import { resolveHabitIcon } from '../lib/habitIcons'

const { habits } = defineProps<{
  habits: ReadonlyArray<DbHabit>
}>()

const emit = defineEmits<{
  unarchive: [habit: DbHabit]
}>()

const { t } = useI18n()
const open = ref(false)
</script>

<template>
  <Collapsible v-model:open="open">
    <CollapsibleTrigger
      class="flex w-full items-center justify-between py-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider"
    >
      {{ t('habits.archivedSection') }} ({{ habits.length }})
      <ChevronDown class="h-4 w-4 transition-transform" :class="open && 'rotate-180'" />
    </CollapsibleTrigger>
    <CollapsibleContent class="space-y-2 pt-1">
      <div
        v-for="habit in habits"
        :key="habit.id"
        :data-testid="`habit-archived-${habit.name}`"
        class="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
      >
        <AppIcon :name="resolveHabitIcon(habit.icon)" class="size-6 shrink-0" />
        <span class="flex-1 min-w-0 truncate font-medium text-muted-foreground">{{
          habit.name
        }}</span>
        <Button variant="outline" size="sm" @click="emit('unarchive', habit)">
          {{ t('habits.unarchive') }}
        </Button>
      </div>
    </CollapsibleContent>
  </Collapsible>
</template>
