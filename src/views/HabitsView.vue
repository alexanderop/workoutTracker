<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type { DbHabit } from '@/db/schema'
import { useHabits } from '@/features/habits/composables/useHabits'
import HabitTodayList from '@/features/habits/components/HabitTodayList.vue'
import HabitForm from '@/features/habits/components/HabitForm.vue'
import HabitListItem from '@/features/habits/components/HabitListItem.vue'
import HabitArchivedList from '@/features/habits/components/HabitArchivedList.vue'
import type { HabitFormData } from '@/features/habits/composables/useHabits'

const { t } = useI18n()

const {
  habits,
  archivedHabits,
  hasHabits,
  todayItems,
  entriesFor,
  toggleToday,
  logQuantityToday,
  toggleDay,
  createHabit,
  editHabit,
  archive,
  unarchive,
  load,
} = useHabits()

onMounted(load)

// Create/edit dialog -- `editingHabit` undefined means create mode.
const formOpen = ref(false)
const editingHabit = ref<DbHabit | undefined>(undefined)

function openCreateForm(): void {
  editingHabit.value = undefined
  formOpen.value = true
}

function openEditForm(habit: DbHabit): void {
  editingHabit.value = habit
  formOpen.value = true
}

async function handleFormSave(data: HabitFormData): Promise<void> {
  if (editingHabit.value) {
    await editHabit(editingHabit.value.id, data)
    return
  }
  await createHabit(data)
}

// Archive confirmation
const archiveDialogOpen = ref(false)
const habitToArchive = ref<DbHabit | undefined>(undefined)

function requestArchive(habit: DbHabit): void {
  habitToArchive.value = habit
  archiveDialogOpen.value = true
}

async function confirmArchive(): Promise<void> {
  // No `if (habitToArchive.value)` guard: ConfirmDialog's `@confirm` can only
  // fire while `archiveDialogOpen` is true, which only ever happens right
  // after `requestArchive()` set `habitToArchive` in the same gesture -- so
  // it's never actually undefined here despite the nullable ref type.
  await archive(habitToArchive.value!.id)
  habitToArchive.value = undefined
}

const archiveDialogDescription = computed(() =>
  habitToArchive.value
    ? t('habits.archiveDialog.description', { name: habitToArchive.value.name })
    : '',
)
</script>

<template>
  <div class="container mx-auto max-w-lg space-y-6 p-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">{{ t('habits.title') }}</h1>
      <Button size="sm" @click="openCreateForm">
        <Plus class="mr-1 h-4 w-4" />
        {{ t('habits.addHabit') }}
      </Button>
    </div>

    <template v-if="!hasHabits && archivedHabits.length === 0">
      <div role="status" class="py-12 text-center text-muted-foreground">
        <p>{{ t('habits.emptyState') }}</p>
      </div>
    </template>

    <template v-else>
      <section class="space-y-3">
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {{ t('habits.todaySection') }}
        </h2>
        <HabitTodayList
          :items="todayItems"
          @toggle="toggleToday"
          @log-quantity="logQuantityToday"
        />
      </section>

      <section v-if="hasHabits" class="space-y-3">
        <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {{ t('habits.manageSection') }}
        </h2>
        <div class="space-y-2">
          <HabitListItem
            v-for="habit in habits"
            :key="habit.id"
            :habit="habit"
            :entries="entriesFor(habit.id)"
            @edit="openEditForm"
            @archive="requestArchive"
            @toggle-day="(h, date) => toggleDay(h, date)"
          />
        </div>
      </section>

      <HabitArchivedList
        v-if="archivedHabits.length > 0"
        :habits="archivedHabits"
        @unarchive="(habit) => unarchive(habit.id)"
      />
    </template>

    <HabitForm v-model:open="formOpen" :habit="editingHabit" @save="handleFormSave" />

    <ConfirmDialog
      v-model:open="archiveDialogOpen"
      :title="t('habits.archiveDialog.title')"
      :description="archiveDialogDescription"
      :cancel-label="t('common.buttons.cancel')"
      :confirm-label="t('habits.archiveDialog.confirmButton')"
      confirm-variant="default"
      @confirm="confirmArchive"
    />
  </div>
</template>
