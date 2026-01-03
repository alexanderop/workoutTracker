<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Card, CardContent } from '@/components/ui/card'
import type { SampleTemplate } from '../../constants/previewData'

const { template } = defineProps<{
  template: SampleTemplate
}>()

const { t } = useI18n()

defineExpose({})
</script>

<template>
  <Card class="text-left">
    <CardContent class="flex items-center justify-between p-4">
      <div class="font-medium">{{ template.name }}</div>
      <div class="text-sm text-muted-foreground">
        {{ t('onboarding.previews.exercises', { count: template.blockCount }) }}
      </div>
    </CardContent>
  </Card>
</template>
