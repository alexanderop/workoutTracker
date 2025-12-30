<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { RouteNames } from '@/router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import DialogActions from '@/components/DialogActions.vue'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { ArrowLeft, Play, Trash2, Check, X } from 'lucide-vue-next'
import { useProgression } from '@/features/progressions/composables/useProgression'

const { id } = defineProps<{
  id: string
}>()

const { t } = useI18n()
const router = useRouter()
const {
  state,
  progression,
  sessions,
  progress,
  levelDisplay,
  isDeleting,
  deleteProgression,
} = useProgression(id)

const showDeleteDialog = ref(false)

const formattedSessions = computed(() =>
  sessions.value.map((session) => ({
    ...session,
    date: new Date(session.completedAt).toLocaleDateString(),
    time: new Date(session.completedAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
  })),
)

function handleBack(): void {
  router.push({ name: RouteNames.Progressions })
}

function handleStartSession(): void {
  router.push({ name: RouteNames.ActiveProgression, params: { id } })
}

async function handleDelete(): Promise<void> {
  showDeleteDialog.value = false
  const success = await deleteProgression()
  if (success) {
    router.push({ name: RouteNames.Progressions })
  }
}
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Header -->
    <header class="flex items-center justify-between border-b p-4">
      <div class="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          :aria-label="t('common.goBack')"
          @click="handleBack"
        >
          <ArrowLeft :size="20" />
        </Button>
        <h1 class="text-lg font-semibold">
          {{ progression?.name ?? t('progressions.detail.title') }}
        </h1>
      </div>
      <div class="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          :disabled="isDeleting"
          @click="showDeleteDialog = true"
        >
          <Trash2 :size="20" />
        </Button>
      </div>
    </header>

    <!-- Loading state -->
    <div v-if="state.status === 'loading'" class="flex flex-1 items-center justify-center">
      <div class="text-muted-foreground">{{ t('common.states.loading') }}</div>
    </div>

    <!-- Not found state -->
    <div v-else-if="state.status === 'not-found'" class="flex flex-1 items-center justify-center">
      <div class="text-muted-foreground">{{ t('progressions.detail.notFound') }}</div>
    </div>

    <!-- Error state -->
    <div v-else-if="state.status === 'error'" class="flex flex-1 items-center justify-center">
      <div class="text-destructive">{{ t('common.states.error') }}</div>
    </div>

    <!-- Content -->
    <div v-else class="flex-1 overflow-y-auto p-4">
      <div class="mx-auto max-w-md space-y-6">
        <!-- Current Level Card -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center justify-between">
              {{ t('progressions.detail.currentLevel') }}
              <Badge v-if="progression?.isComplete" variant="default">
                {{ t('progressions.status.complete') }}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ levelDisplay }}</div>
            <div class="mt-4 flex items-center gap-2">
              <Progress :model-value="progress" class="h-2 flex-1" />
              <span class="text-sm text-muted-foreground">{{ progress }}%</span>
            </div>
            <div class="mt-2 text-sm text-muted-foreground">
              {{ t('progressions.detail.sessions', { count: progression?.sessionsCompleted ?? 0 }) }}
            </div>
          </CardContent>
        </Card>

        <!-- Start Session Button -->
        <Button
          v-if="!progression?.isComplete"
          class="w-full"
          size="lg"
          @click="handleStartSession"
        >
          <Play class="mr-2" :size="20" />
          {{ t('progressions.detail.startSession') }}
        </Button>

        <!-- Kettlebells Progress -->
        <Card v-if="progression">
          <CardHeader>
            <CardTitle>{{ t('progressions.detail.kettlebells') }}</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="flex flex-wrap gap-2">
              <Badge
                v-for="(weight, index) in progression.availableWeights"
                :key="weight"
                :variant="index < progression.currentWeightIndex ? 'default' : index === progression.currentWeightIndex ? 'secondary' : 'outline'"
              >
                {{ weight }}kg
                <Check
                  v-if="index < progression.currentWeightIndex"
                  class="ml-1"
                  :size="12"
                />
              </Badge>
            </div>
          </CardContent>
        </Card>

        <!-- Session History -->
        <Card v-if="formattedSessions.length > 0">
          <CardHeader>
            <CardTitle>{{ t('progressions.detail.history') }}</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <div
              v-for="session in formattedSessions"
              :key="session.id"
              class="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <span class="font-medium">
                  {{ t('progressions.detail.sessionSummary', { weight: session.weight, reps: session.reps, minutes: session.minutes }) }}
                </span>
                <span class="block text-sm text-muted-foreground">{{ session.date }} {{ session.time }}</span>
              </div>
              <Badge :variant="session.completed ? 'default' : 'destructive'">
                <Check v-if="session.completed" :size="14" class="mr-1" />
                <X v-else :size="14" class="mr-1" />
                {{ session.completed ? t('progressions.session.completed') : t('progressions.session.failed') }}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Delete Dialog -->
    <Dialog v-model:open="showDeleteDialog">
      <MobileDialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('progressions.delete.title') }}</DialogTitle>
          <DialogDescription>
            {{ t('progressions.delete.description') }}
          </DialogDescription>
        </DialogHeader>
        <DialogActions v-slot="{ buttonClass }">
          <Button variant="outline" :class="buttonClass" @click="showDeleteDialog = false">
            {{ t('common.buttons.cancel') }}
          </Button>
          <Button variant="destructive" :class="buttonClass" @click="handleDelete">
            {{ t('common.buttons.delete') }}
          </Button>
        </DialogActions>
      </MobileDialogContent>
    </Dialog>
  </div>
</template>
