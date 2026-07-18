import type { Component, SVGAttributes } from 'vue'

export type ExerciseIconComponent = Component

export type ExerciseIconManifestEntry = Readonly<{
  key: string
  title: string
  component: string
  aliases: ReadonlyArray<string>
  poseFamily: string
  equipment: ReadonlyArray<string>
  muscles: ReadonlyArray<string>
}>

export type ExerciseIconClass = SVGAttributes['class']
