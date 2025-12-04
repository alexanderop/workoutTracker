<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { RefreshCw, X } from 'lucide-vue-next'

const { t } = useI18n()
const { needRefresh, updateServiceWorker } = useRegisterSW()

function close() {
  needRefresh.value = false
}

function update() {
  updateServiceWorker()
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-0"
    >
      <div
        v-if="needRefresh"
        class="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md rounded-lg border bg-card p-4 shadow-lg sm:bottom-4"
        role="alert"
        aria-live="polite"
      >
        <div class="flex items-start gap-3">
          <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <RefreshCw class="size-5 text-primary" />
          </div>
          <div class="flex-1 space-y-1">
            <p class="font-medium text-foreground">{{ t('dialogs.pwaUpdate.title') }}</p>
            <p class="text-sm text-muted-foreground">{{ t('dialogs.pwaUpdate.description') }}</p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            class="-mr-2 -mt-2"
            :aria-label="t('common.aria.dismiss')"
            @click="close"
          >
            <X class="size-4" />
          </Button>
        </div>
        <div class="mt-3 flex gap-2">
          <Button variant="outline" size="sm" class="flex-1" @click="close">{{
            t('common.buttons.later')
          }}</Button>
          <Button size="sm" class="flex-1" @click="update">{{
            t('dialogs.pwaUpdate.updateButton')
          }}</Button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
