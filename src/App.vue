<script setup lang="ts">
import Layout from '@/components/Layout.vue'
import { RouterView } from 'vue-router'
import { useColorMode } from '@vueuse/core'
import { watch } from 'vue'

// Initialize color mode globally
const colorMode = useColorMode({
  attribute: 'class',
  modes: {
    light: '',
    dark: 'dark',
  },
})

// Watch for color mode changes and update the HTML element
watch(
  () => colorMode.value,
  (newMode) => {
    const html = document.documentElement
    if (newMode === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  },
)
</script>

<template>
  <Layout>
    <RouterView />
  </Layout>
</template>

<style scoped></style>
