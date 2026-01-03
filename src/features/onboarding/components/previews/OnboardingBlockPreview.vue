<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { SampleBlock } from '../../constants/previewData'

const { block } = defineProps<{
  block: SampleBlock
}>()

const { t } = useI18n()

defineExpose({})
</script>

<template>
  <Card class="text-left">
    <CardContent class="flex items-center justify-between p-4">
      <div class="space-y-1">
        <div class="font-medium">{{ block.name }}</div>
        <div class="text-sm text-muted-foreground">
          <template v-if="block.kind === 'strength'">
            {{ t('onboarding.previews.sets', { count: block.sets }) }} &middot;
            {{ t('onboarding.previews.reps', { count: block.reps }) }}
          </template>
          <template v-if="block.kind === 'amrap'">
            {{ t('onboarding.previews.duration', { minutes: block.durationMinutes }) }}
          </template>
        </div>
      </div>
      <Badge variant="secondary">
        {{
          block.kind === 'strength'
            ? t('onboarding.previews.strengthBlock')
            : t('onboarding.previews.amrapBlock')
        }}
      </Badge>
    </CardContent>
  </Card>
</template>
