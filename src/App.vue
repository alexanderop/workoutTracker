<script setup lang="ts">
import { RouterView } from 'vue-router'
import Layout from '@/components/Layout.vue'
import { useTheme } from '@/composables/useTheme'

// Initialize theme globally
useTheme()
</script>

<template>
  <Layout>
    <RouterView />
  </Layout>
</template>

<style scoped></style>
