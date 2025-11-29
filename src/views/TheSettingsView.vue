<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useTheme } from '@/composables/useTheme'

const { isDark } = useTheme()
</script>

<template>
  <div class="flex-1 p-4">
    <div class="mb-6">
      <h1 class="text-3xl font-bold mb-2">
        Settings
      </h1>
      <p class="text-muted-foreground">
        Customize your app preferences
      </p>
    </div>

    <div class="space-y-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">
            Theme
          </CardTitle>
          <CardDescription>Choose your preferred theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex items-center space-x-2">
            <Switch
              v-model="isDark"
              data-testid="theme-toggle"
            />
            <Label>Dark Mode</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-lg">
            Privacy
          </CardTitle>
          <CardDescription>Manage your privacy settings</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-lg">
            About
          </CardTitle>
          <CardDescription>Version 1.0.0</CardDescription>
        </CardHeader>
      </Card>
    </div>
  </div>
</template>
