<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { SampleBenchmark } from '../../constants/previewData'

const { benchmark } = defineProps<{
  benchmark: SampleBenchmark
}>()

const { t } = useI18n()

defineExpose({})
</script>

<template>
  <Card class="text-left">
    <CardContent class="flex items-center justify-between p-4">
      <div class="font-medium">{{ benchmark.name }}</div>
      <Badge variant="outline">
        {{
          benchmark.type === 'forTime'
            ? t('workouts.blockTypes.fortime')
            : t('workouts.blockTypes.amrap')
        }}
      </Badge>
    </CardContent>
  </Card>
</template>
