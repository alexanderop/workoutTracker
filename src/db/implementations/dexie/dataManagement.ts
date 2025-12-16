import type { DataManagementRepository, ExportDataContents } from '@/db/interfaces'
import { db } from './database'

export function createDexieDataManagementRepository(): DataManagementRepository {
  return {
    async exportAll(): Promise<ExportDataContents> {
      // Fetch all data from normalized tables in parallel
      const [
        settings,
        customExercises,
        templates,
        templateBlocks,
        templateBlockExercises,
        workoutHeaders,
        workoutBlocks,
        workoutSets,
        blockExercises,
        benchmarks,
        benchmarkAttempts,
        benchmarkPersonalBests,
      ] = await Promise.all([
        db.settings.toArray(),
        db.exercises.filter((ex) => !ex.isBuiltIn).toArray(),
        db.templates.toArray(),
        db.templateBlocks.toArray(),
        db.templateBlockExercises.toArray(),
        db.workoutHeaders.toArray(),
        db.workoutBlocks.toArray(),
        db.workoutSets.toArray(),
        db.blockExercises.toArray(),
        db.benchmarks.toArray(),
        db.benchmarkAttempts.toArray(),
        db.benchmarkPersonalBests.toArray(),
      ])

      // Group template data by template ID
      const templateBlocksByTemplateId = new Map<string, typeof templateBlocks>()
      for (const block of templateBlocks) {
        const existing = templateBlocksByTemplateId.get(block.templateId) ?? []
        existing.push(block)
        templateBlocksByTemplateId.set(block.templateId, existing)
      }

      const templateBlockExercisesByBlockId = new Map<string, typeof templateBlockExercises>()
      for (const ex of templateBlockExercises) {
        const existing = templateBlockExercisesByBlockId.get(ex.blockId) ?? []
        existing.push(ex)
        templateBlockExercisesByBlockId.set(ex.blockId, existing)
      }

      // Group workout data by workout ID
      const workoutBlocksByWorkoutId = new Map<string, typeof workoutBlocks>()
      for (const block of workoutBlocks) {
        const existing = workoutBlocksByWorkoutId.get(block.workoutId) ?? []
        existing.push(block)
        workoutBlocksByWorkoutId.set(block.workoutId, existing)
      }

      const workoutSetsByBlockId = new Map<string, typeof workoutSets>()
      for (const set of workoutSets) {
        const existing = workoutSetsByBlockId.get(set.blockId) ?? []
        existing.push(set)
        workoutSetsByBlockId.set(set.blockId, existing)
      }

      const blockExercisesByBlockId = new Map<string, typeof blockExercises>()
      for (const ex of blockExercises) {
        const existing = blockExercisesByBlockId.get(ex.blockId) ?? []
        existing.push(ex)
        blockExercisesByBlockId.set(ex.blockId, existing)
      }

      // Build structured export for templates
      const templatesExport = templates.map((header) => {
        const blocks = templateBlocksByTemplateId.get(header.id) ?? []
        const blockExercisesForTemplate = blocks.flatMap((block) =>
          templateBlockExercisesByBlockId.get(block.id) ?? [],
        )
        return {
          header,
          blocks,
          blockExercises: blockExercisesForTemplate,
        }
      })

      // Build structured export for workouts
      const workoutsExport = workoutHeaders.map((header) => {
        const blocks = workoutBlocksByWorkoutId.get(header.id) ?? []
        const sets = blocks.flatMap((block) => workoutSetsByBlockId.get(block.id) ?? [])
        const blockExercisesForWorkout = blocks.flatMap((block) =>
          blockExercisesByBlockId.get(block.id) ?? [],
        )
        return {
          header,
          blocks,
          sets,
          blockExercises: blockExercisesForWorkout,
        }
      })

      return {
        settings,
        customExercises,
        templates: templatesExport,
        workouts: workoutsExport,
        benchmarks,
        benchmarkAttempts,
        benchmarkPersonalBests,
      }
    },

    async importAll(data: ExportDataContents): Promise<void> {
      await db.transaction(
        'rw',
        [
          db.settings,
          db.exercises,
          db.templates,
          db.templateBlocks,
          db.templateBlockExercises,
          db.workoutHeaders,
          db.workoutBlocks,
          db.workoutSets,
          db.blockExercises,
          db.benchmarks,
          db.benchmarkAttempts,
          db.benchmarkPersonalBests,
          db.activeWorkout,
          db.activeBenchmark,
        ],
        async () => {
          // Clear all tables
          await Promise.all([
            db.settings.clear(),
            db.exercises.clear(),
            db.templates.clear(),
            db.templateBlocks.clear(),
            db.templateBlockExercises.clear(),
            db.workoutHeaders.clear(),
            db.workoutBlocks.clear(),
            db.workoutSets.clear(),
            db.blockExercises.clear(),
            db.benchmarks.clear(),
            db.benchmarkAttempts.clear(),
            db.benchmarkPersonalBests.clear(),
            db.activeWorkout.clear(),
            db.activeBenchmark.clear(),
          ])

          // Import settings
          if (data.settings.length > 0) {
            await db.settings.bulkAdd([...data.settings])
          }

          // Import custom exercises (with isBuiltIn: false)
          if (data.customExercises.length > 0) {
            const exercisesWithFlag = data.customExercises.map((ex) => ({
              ...ex,
              isBuiltIn: false,
            }))
            await db.exercises.bulkAdd(exercisesWithFlag)
          }

          // Import templates with normalized blocks
          for (const template of data.templates) {
            await db.templates.add(template.header)
            if (template.blocks.length > 0) {
              await db.templateBlocks.bulkAdd([...template.blocks])
            }
            if (template.blockExercises.length > 0) {
              await db.templateBlockExercises.bulkAdd([...template.blockExercises])
            }
          }

          // Import workouts with normalized data
          for (const workout of data.workouts) {
            await db.workoutHeaders.add(workout.header)
            if (workout.blocks.length > 0) {
              await db.workoutBlocks.bulkAdd([...workout.blocks])
            }
            if (workout.sets.length > 0) {
              await db.workoutSets.bulkAdd([...workout.sets])
            }
            if (workout.blockExercises.length > 0) {
              await db.blockExercises.bulkAdd([...workout.blockExercises])
            }
          }

          // Import benchmarks
          if (data.benchmarks.length > 0) {
            await db.benchmarks.bulkAdd([...data.benchmarks])
          }

          // Import benchmark attempts
          if (data.benchmarkAttempts.length > 0) {
            await db.benchmarkAttempts.bulkAdd([...data.benchmarkAttempts])
          }

          // Import benchmark personal bests
          if (data.benchmarkPersonalBests.length > 0) {
            await db.benchmarkPersonalBests.bulkAdd([...data.benchmarkPersonalBests])
          }
        },
      )
    },

    async deleteAll(): Promise<void> {
      await db.transaction(
        'rw',
        [
          db.settings,
          db.exercises,
          db.templates,
          db.templateBlocks,
          db.templateBlockExercises,
          db.workoutHeaders,
          db.workoutBlocks,
          db.workoutSets,
          db.blockExercises,
          db.benchmarks,
          db.benchmarkAttempts,
          db.benchmarkPersonalBests,
          db.activeWorkout,
          db.activeBenchmark,
        ],
        async () => {
          await Promise.all([
            db.settings.clear(),
            db.exercises.clear(),
            db.templates.clear(),
            db.templateBlocks.clear(),
            db.templateBlockExercises.clear(),
            db.workoutHeaders.clear(),
            db.workoutBlocks.clear(),
            db.workoutSets.clear(),
            db.blockExercises.clear(),
            db.benchmarks.clear(),
            db.benchmarkAttempts.clear(),
            db.benchmarkPersonalBests.clear(),
            db.activeWorkout.clear(),
            db.activeBenchmark.clear(),
          ])
        },
      )
    },
  }
}
