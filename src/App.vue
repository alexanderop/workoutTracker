<script setup lang="ts">
import { RouterView } from 'vue-router'
import Layout from '@/components/Layout.vue'
import { useTheme } from '@/composables/useTheme'

useTheme()
</script>

<template>
  <Layout>
    <RouterView />
  </Layout>
</template>

