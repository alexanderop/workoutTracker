<script setup lang="ts">
import { Compass } from '@lucide/vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { RouteNames } from '@/router'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import PageLayout from '@/components/PageLayout.vue'

const { t } = useI18n()
const router = useRouter()

function goHome(): void {
  router.push({ name: RouteNames.Home })
}
</script>

<template>
  <PageLayout :title="t('common.notFound.title')" back-to="/">
    <div class="flex flex-1 flex-col items-center justify-center gap-4 p-4">
      <Empty>
        <EmptyMedia>
          <Compass class="h-10 w-10 text-muted-foreground" aria-hidden="true" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>{{ t('common.notFound.title') }}</EmptyTitle>
          <EmptyDescription>{{ t('common.notFound.description') }}</EmptyDescription>
        </EmptyHeader>
      </Empty>
      <Button @click="goHome">{{ t('common.buttons.goHome') }}</Button>
    </div>
  </PageLayout>
</template>
