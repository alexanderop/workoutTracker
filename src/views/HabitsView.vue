<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { Plus } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type { DbHabit } from '@/db/schema'
import { useHabits } from '@/features/habits/composables/useHabits'
import { useHabitViewMode } from '@/features/habits/composables/useHabitViewMode'
import HabitForm from '@/features/habits/components/HabitForm.vue'
import HabitDashboardCard from '@/features/habits/components/HabitDashboardCard.vue'
import HabitRowList from '@/features/habits/components/HabitRowList.vue'
import HabitTileGrid from '@/features/habits/components/HabitTileGrid.vue'
import HabitViewModeToggle from '@/features/habits/components/HabitViewModeToggle.vue'
import HabitDetailSheet from '@/features/habits/components/HabitDetailSheet.vue'
import HabitArchivedList from '@/features/habits/components/HabitArchivedList.vue'
import type { HabitFormData } from '@/features/habits/composables/useHabits'

const { t } = useI18n()

const {
  archivedHabits,
  hasHabits,
  todayItems,
  toggleToday,
  logQuantityToday,
  toggleDay,
  createHabit,
  editHabit,
  archive,
  unarchive,
  load,
} = useHabits()

// The layout choice is persisted, so it loads alongside the habits themselves.
const { mode, load: loadViewMode, setMode } = useHabitViewMode()

onMounted(() => {
  void load()
  void loadViewMode()
})

// Detail sheet -- the one surface every mode opens for stats, history,
// exact-quantity entry, edit, and archive. Tracked by id rather than by a
// snapshot of the item so the sheet re-renders as entries change underneath it
// (e.g. retro-toggling a day while it is open).
const detailSheetOpen = ref(false)
const detailHabitId = ref<string | undefined>(undefined)

const detailItem = computed(() =>
  todayItems.value.find((candidate) => candidate.habit.id === detailHabitId.value),
)

function openDetails(habit: DbHabit): void {
  detailHabitId.value = habit.id
  detailSheetOpen.value = true
}

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

// The quick-add sheet deep-links here with ?create=1 to open the create
// form immediately; the flag is consumed (removed from the URL) so
// back/refresh doesn't reopen the dialog.
const route = useRoute()
const router = useRouter()

watch(
  () => route.query.create,
  (create) => {
    if (create !== '1') return
    openCreateForm()
    router.replace({ query: { ...route.query, create: undefined } })
  },
  { immediate: true },
)

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
  <div class="container mx-auto max-w-lg space-y-section p-4">
    <div class="flex items-center justify-between gap-2">
      <h1 class="text-page-title font-bold">{{ t('habits.title') }}</h1>
      <div class="flex items-center gap-2">
        <HabitViewModeToggle
          v-if="hasHabits"
          :model-value="mode"
          @update:model-value="(next) => setMode(next)"
        />
        <Button size="sm" @click="openCreateForm">
          <Plus class="mr-1 h-4 w-4" />
          {{ t('habits.addHabit') }}
        </Button>
      </div>
    </div>

    <template v-if="!hasHabits && archivedHabits.length === 0">
      <div role="status" class="rounded-xl border border-dashed py-12 text-center">
        <p class="font-semibold">{{ t('habits.emptyTitle') }}</p>
        <p class="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          {{ t('habits.emptyState') }}
        </p>
        <Button class="mt-5" @click="openCreateForm">
          <Plus class="mr-1 size-4" />{{ t('habits.addFirstHabit') }}
        </Button>
      </div>
    </template>

    <template v-else>
      <section v-if="hasHabits" class="space-y-3">
        <HabitTileGrid
          v-if="mode === 'grid'"
          :items="todayItems"
          @toggle="toggleToday"
          @open-details="openDetails"
        />

        <HabitRowList
          v-else-if="mode === 'rows'"
          :items="todayItems"
          @toggle="toggleToday"
          @open-details="openDetails"
        />

        <div v-else class="space-y-3">
          <HabitDashboardCard
            v-for="item in todayItems"
            :key="item.habit.id"
            :item="item"
            @toggle="toggleToday"
            @log-quantity="logQuantityToday"
            @open-details="openDetails"
          />
        </div>
      </section>

      <HabitArchivedList
        v-if="archivedHabits.length > 0"
        :habits="archivedHabits"
        @unarchive="(habit) => unarchive(habit.id)"
      />
    </template>

    <HabitDetailSheet
      v-model:open="detailSheetOpen"
      :item="detailItem"
      @log-quantity="logQuantityToday"
      @toggle-day="(habit, date) => toggleDay(habit, date)"
      @edit="openEditForm"
      @archive="requestArchive"
    />

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
