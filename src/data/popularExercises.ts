import type { Equipment, ExerciseType, Metrics, Muscle } from '@/types/exercises'

export type PopularExercise = {
  name: string
  equipment: Equipment
  muscle: Muscle
  type: ExerciseType
  metrics: Metrics
}

/**
 * Runtime duplicate detection for exercise names.
 *
 * TypeScript's recursive types hit recursion limits with large arrays (95+ items),
 * so we use a runtime check that executes during module initialization.
 * This provides immediate feedback during development with zero runtime cost in production.
 */
function validateUniqueExercises<const T extends ReadonlyArray<PopularExercise>>(exercises: T): T {
  const names = new Set<string>()
  const duplicates: Array<string> = []

  for (const exercise of exercises) {
    if (names.has(exercise.name)) {
      duplicates.push(exercise.name)
    }
    names.add(exercise.name)
  }

  if (duplicates.length > 0) {
    throw new Error(
      `Duplicate exercise names found: ${duplicates.join(', ')}\n` +
        `Please ensure all exercise names in popularExercises.ts are unique.`,
    )
  }

  return exercises
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * POPULAR EXERCISES DATABASE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Organized by: MUSCLE GROUP → EQUIPMENT TYPE (alphabetically sorted)
 *
 * SUMMARY:
 * - CHEST (18): barbell: 1, dumbbell: 1, cable: 2, machine: 5, bodyweight: 7, egym: 2
 * - BACK (24): barbell: 2, kettlebell: 5, cable: 2, machine: 6, bodyweight: 5, club: 1, egym: 3
 * - SHOULDERS (29): barbell: 1, dumbbell: 1, kettlebell: 7, cable: 2, machine: 4, bodyweight: 4, club: 7, battle-rope: 1, egym: 2
 * - ARMS (11): dumbbell: 1, cable: 3, machine: 4, bodyweight: 1, egym: 2
 * - LEGS (81): barbell: 8, dumbbell: 9, kettlebell: 3, cable: 3, machine: 26, bodyweight: 23, egym: 9
 * - CORE (30): kettlebell: 3, dumbbell: 1, cable: 2, bodyweight: 21, club: 1, egym: 2
 * ───────────────────────────────────────────────────────────────────────────────
 * TOTAL: 193 exercises (including 10 isometric holds)
 */

/**
 * EGYM Smart Strength machine circuit (models M1–M20), kept as a separate
 * batch so `seedPopularExercises` can top up databases seeded before this
 * batch existed. Spread into `popularExercises` below — never seeded twice.
 */
export const egymExercises: ReadonlyArray<PopularExercise> = [
  // --- Chest: EGYM (2) ---
  {
    name: 'EGYM Chest Press',
    equipment: 'egym',
    muscle: 'chest',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'EGYM Butterfly',
    equipment: 'egym',
    muscle: 'chest',
    type: 'isolation',
    metrics: 'weight-reps',
  },

  // --- Back: EGYM (3) ---
  {
    name: 'EGYM Back Extension',
    equipment: 'egym',
    muscle: 'back',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'EGYM Lat Pulldown',
    equipment: 'egym',
    muscle: 'back',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'EGYM Seated Row',
    equipment: 'egym',
    muscle: 'back',
    type: 'compound',
    metrics: 'weight-reps',
  },

  // --- Shoulders: EGYM (2) ---
  {
    name: 'EGYM Butterfly Reverse',
    equipment: 'egym',
    muscle: 'shoulders',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'EGYM Shoulder Press',
    equipment: 'egym',
    muscle: 'shoulders',
    type: 'compound',
    metrics: 'weight-reps',
  },

  // --- Arms: EGYM (2) ---
  {
    name: 'EGYM Bicep Curl',
    equipment: 'egym',
    muscle: 'arms',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'EGYM Tricep Press',
    equipment: 'egym',
    muscle: 'arms',
    type: 'compound',
    metrics: 'weight-reps',
  },

  // --- Legs: EGYM (9) ---
  {
    name: 'EGYM Abductor',
    equipment: 'egym',
    muscle: 'legs',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'EGYM Adductor',
    equipment: 'egym',
    muscle: 'legs',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'EGYM Calf Press',
    equipment: 'egym',
    muscle: 'legs',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'EGYM Glutes',
    equipment: 'egym',
    muscle: 'legs',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'EGYM Hip Thrust',
    equipment: 'egym',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'EGYM Leg Curl',
    equipment: 'egym',
    muscle: 'legs',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'EGYM Leg Extension',
    equipment: 'egym',
    muscle: 'legs',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'EGYM Leg Press',
    equipment: 'egym',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'EGYM Squat',
    equipment: 'egym',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },

  // --- Core: EGYM (2) ---
  {
    name: 'EGYM Abdominal Crunch',
    equipment: 'egym',
    muscle: 'core',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'EGYM Rotary Torso',
    equipment: 'egym',
    muscle: 'core',
    type: 'isolation',
    metrics: 'weight-reps',
  },
]

export const popularExercises = validateUniqueExercises([
  // ═══════════════════════════════════════════════════════════════════════════════
  // CHEST
  // ═══════════════════════════════════════════════════════════════════════════════

  // --- Chest: Barbell (1) ---
  {
    name: 'Bench Press',
    equipment: 'barbell',
    muscle: 'chest',
    type: 'compound',
    metrics: 'weight-reps',
  },

  // --- Chest: Dumbbell (1) ---
  {
    name: 'Chest Fly',
    equipment: 'dumbbell',
    muscle: 'chest',
    type: 'isolation',
    metrics: 'weight-reps',
  },

  // --- Chest: Cable (2) ---
  {
    name: 'Cable Crossover',
    equipment: 'cable',
    muscle: 'chest',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Cable Fly',
    equipment: 'cable',
    muscle: 'chest',
    type: 'isolation',
    metrics: 'weight-reps',
  },

  // --- Chest: Machine (5) ---
  {
    name: 'Chest Press Machine',
    equipment: 'machine',
    muscle: 'chest',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Incline Chest Press Machine',
    equipment: 'machine',
    muscle: 'chest',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Pec Deck',
    equipment: 'machine',
    muscle: 'chest',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Smith Machine Bench Press',
    equipment: 'machine',
    muscle: 'chest',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Smith Machine Incline Press',
    equipment: 'machine',
    muscle: 'chest',
    type: 'compound',
    metrics: 'weight-reps',
  },

  // --- Chest: Bodyweight (7) ---
  {
    name: 'Beast Push-up',
    equipment: 'bodyweight',
    muscle: 'chest',
    type: 'compound',
    metrics: 'reps-only',
  },
  {
    name: 'Clap Push-ups',
    equipment: 'bodyweight',
    muscle: 'chest',
    type: 'compound',
    metrics: 'reps-only',
  },
  {
    name: 'Decline Push-ups',
    equipment: 'bodyweight',
    muscle: 'chest',
    type: 'compound',
    metrics: 'reps-only',
  },
  {
    name: 'Diamond Push-ups',
    equipment: 'bodyweight',
    muscle: 'chest',
    type: 'compound',
    metrics: 'reps-only',
  },
  {
    name: 'Dips',
    equipment: 'bodyweight',
    muscle: 'chest',
    type: 'compound',
    metrics: 'reps-only',
  },
  {
    name: 'Push-ups',
    equipment: 'bodyweight',
    muscle: 'chest',
    type: 'compound',
    metrics: 'reps-only',
  },
  {
    name: 'Wide Push-ups',
    equipment: 'bodyweight',
    muscle: 'chest',
    type: 'compound',
    metrics: 'reps-only',
  },
  // ═══════════════════════════════════════════════════════════════════════════════
  // BACK
  // ═══════════════════════════════════════════════════════════════════════════════

  // --- Back: Barbell (2) ---
  {
    name: 'Barbell Row',
    equipment: 'barbell',
    muscle: 'back',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Deadlift',
    equipment: 'barbell',
    muscle: 'back',
    type: 'compound',
    metrics: 'weight-reps',
  },

  // --- Back: Kettlebell (5) ---
  {
    name: 'Kettlebell Dead Clean',
    equipment: 'kettlebell',
    muscle: 'back',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Kettlebell Gorilla Row',
    equipment: 'kettlebell',
    muscle: 'back',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Kettlebell Row',
    equipment: 'kettlebell',
    muscle: 'back',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Kettlebell Single Arm Swing',
    equipment: 'kettlebell',
    muscle: 'back',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Kettlebell Swing',
    equipment: 'kettlebell',
    muscle: 'back',
    type: 'compound',
    metrics: 'weight-reps',
  },

  // --- Back: Cable (2) ---
  {
    name: 'Lat Pulldown',
    equipment: 'cable',
    muscle: 'back',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Straight Arm Pulldown',
    equipment: 'cable',
    muscle: 'back',
    type: 'isolation',
    metrics: 'weight-reps',
  },

  // --- Back: Machine (6) ---
  {
    name: 'Assisted Pull-up Machine',
    equipment: 'machine',
    muscle: 'back',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Back Extension Machine',
    equipment: 'machine',
    muscle: 'back',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Chest Supported Row',
    equipment: 'machine',
    muscle: 'back',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Reverse Hyper Machine',
    equipment: 'machine',
    muscle: 'back',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Seated Row Machine',
    equipment: 'machine',
    muscle: 'back',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'T-Bar Row Machine',
    equipment: 'machine',
    muscle: 'back',
    type: 'compound',
    metrics: 'weight-reps',
  },

  // --- Back: Bodyweight (5) ---
  {
    name: 'Chin-ups',
    equipment: 'bodyweight',
    muscle: 'back',
    type: 'compound',
    metrics: 'reps-only',
  },
  {
    name: 'Dead Hang',
    equipment: 'bodyweight',
    muscle: 'back',
    type: 'isometric',
    metrics: 'duration',
  },
  {
    name: 'Inverted Rows',
    equipment: 'bodyweight',
    muscle: 'back',
    type: 'compound',
    metrics: 'reps-only',
  },
  {
    name: 'Prone Y-Raises',
    equipment: 'bodyweight',
    muscle: 'back',
    type: 'isolation',
    metrics: 'reps-only',
  },
  {
    name: 'Pull-ups',
    equipment: 'bodyweight',
    muscle: 'back',
    type: 'compound',
    metrics: 'reps-only',
  },

  // --- Back: Club (1) ---
  {
    name: 'Club Pullover',
    equipment: 'club',
    muscle: 'back',
    type: 'compound',
    metrics: 'weight-reps',
  },
  // ═══════════════════════════════════════════════════════════════════════════════
  // SHOULDERS
  // ═══════════════════════════════════════════════════════════════════════════════

  // --- Shoulders: Barbell (1) ---
  {
    name: 'Overhead Press',
    equipment: 'barbell',
    muscle: 'shoulders',
    type: 'compound',
    metrics: 'weight-reps',
  },

  // --- Shoulders: Dumbbell (1) ---
  {
    name: 'Lateral Raise',
    equipment: 'dumbbell',
    muscle: 'shoulders',
    type: 'isolation',
    metrics: 'weight-reps',
  },

  // --- Shoulders: Kettlebell (7) ---
  {
    name: 'Kettlebell Armbar',
    equipment: 'kettlebell',
    muscle: 'shoulders',
    type: 'stability',
    metrics: 'weight-reps',
  },
  {
    name: 'Kettlebell Clean',
    equipment: 'kettlebell',
    muscle: 'shoulders',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Kettlebell Clean and Press',
    equipment: 'kettlebell',
    muscle: 'shoulders',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Kettlebell Halo',
    equipment: 'kettlebell',
    muscle: 'shoulders',
    type: 'stability',
    metrics: 'weight-reps',
  },
  {
    name: 'Kettlebell High Pull',
    equipment: 'kettlebell',
    muscle: 'shoulders',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Kettlebell Press',
    equipment: 'kettlebell',
    muscle: 'shoulders',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Kettlebell Snatch',
    equipment: 'kettlebell',
    muscle: 'shoulders',
    type: 'compound',
    metrics: 'weight-reps',
  },

  // --- Shoulders: Cable (2) ---
  {
    name: 'Cable Face Pull',
    equipment: 'cable',
    muscle: 'shoulders',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Cable Reverse Fly',
    equipment: 'cable',
    muscle: 'shoulders',
    type: 'isolation',
    metrics: 'weight-reps',
  },

  // --- Shoulders: Machine (4) ---
  {
    name: 'Lateral Raise Machine',
    equipment: 'machine',
    muscle: 'shoulders',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Rear Delt Machine',
    equipment: 'machine',
    muscle: 'shoulders',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Shoulder Press Machine',
    equipment: 'machine',
    muscle: 'shoulders',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Smith Machine Shoulder Press',
    equipment: 'machine',
    muscle: 'shoulders',
    type: 'compound',
    metrics: 'weight-reps',
  },

  // --- Shoulders: Bodyweight (4) ---
  {
    name: 'Handstand Push-ups',
    equipment: 'bodyweight',
    muscle: 'shoulders',
    type: 'compound',
    metrics: 'reps-only',
  },
  {
    name: 'Pike Hold',
    equipment: 'bodyweight',
    muscle: 'shoulders',
    type: 'isometric',
    metrics: 'duration',
  },
  {
    name: 'Pike Push-ups',
    equipment: 'bodyweight',
    muscle: 'shoulders',
    type: 'compound',
    metrics: 'reps-only',
  },
  {
    name: 'Shoulder Taps',
    equipment: 'bodyweight',
    muscle: 'shoulders',
    type: 'stability',
    metrics: 'reps-only',
  },

  // --- Shoulders: Club (7) ---
  {
    name: 'Club Gama Cast',
    equipment: 'club',
    muscle: 'shoulders',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Club Inside Circle',
    equipment: 'club',
    muscle: 'shoulders',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Club Mill',
    equipment: 'club',
    muscle: 'shoulders',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Club Outside Circle',
    equipment: 'club',
    muscle: 'shoulders',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Club Reverse Mill',
    equipment: 'club',
    muscle: 'shoulders',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Club Shield Cast',
    equipment: 'club',
    muscle: 'shoulders',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Club Swipe',
    equipment: 'club',
    muscle: 'shoulders',
    type: 'compound',
    metrics: 'weight-reps',
  },

  // --- Shoulders: Battle-rope (1) ---
  {
    name: 'Battle Rope Waves',
    equipment: 'battle-rope',
    muscle: 'shoulders',
    type: 'cardio',
    metrics: 'duration',
  },
  // ═══════════════════════════════════════════════════════════════════════════════
  // ARMS
  // ═══════════════════════════════════════════════════════════════════════════════

  // --- Arms: Dumbbell (1) ---
  {
    name: 'Dumbbell Curl',
    equipment: 'dumbbell',
    muscle: 'arms',
    type: 'isolation',
    metrics: 'weight-reps',
  },

  // --- Arms: Cable (3) ---
  {
    name: 'Cable Bicep Curl',
    equipment: 'cable',
    muscle: 'arms',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Cable Hammer Curl',
    equipment: 'cable',
    muscle: 'arms',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Tricep Extension',
    equipment: 'cable',
    muscle: 'arms',
    type: 'isolation',
    metrics: 'weight-reps',
  },

  // --- Arms: Machine (4) ---
  {
    name: 'Bicep Curl Machine',
    equipment: 'machine',
    muscle: 'arms',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Preacher Curl Machine',
    equipment: 'machine',
    muscle: 'arms',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Tricep Dip Machine',
    equipment: 'machine',
    muscle: 'arms',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Tricep Extension Machine',
    equipment: 'machine',
    muscle: 'arms',
    type: 'isolation',
    metrics: 'weight-reps',
  },

  // --- Arms: Bodyweight (1) ---
  {
    name: 'Bench Dips',
    equipment: 'bodyweight',
    muscle: 'arms',
    type: 'compound',
    metrics: 'reps-only',
  },
  // ═══════════════════════════════════════════════════════════════════════════════
  // LEGS
  // ═══════════════════════════════════════════════════════════════════════════════

  // --- Legs: Barbell (8) ---
  {
    name: 'Barbell Calf Raises',
    equipment: 'barbell',
    muscle: 'legs',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Barbell Good Mornings',
    equipment: 'barbell',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Barbell Hip Thrust',
    equipment: 'barbell',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Barbell Lunges',
    equipment: 'barbell',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Barbell Romanian Deadlift',
    equipment: 'barbell',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Front Squat',
    equipment: 'barbell',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },
  { name: 'Squat', equipment: 'barbell', muscle: 'legs', type: 'compound', metrics: 'weight-reps' },
  {
    name: 'Sumo Deadlift',
    equipment: 'barbell',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },

  // --- Legs: Dumbbell (9) ---
  {
    name: 'Dumbbell Bulgarian Split Squat',
    equipment: 'dumbbell',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Dumbbell Calf Raises',
    equipment: 'dumbbell',
    muscle: 'legs',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Dumbbell Goblet Squat',
    equipment: 'dumbbell',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Dumbbell Hip Thrust',
    equipment: 'dumbbell',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Dumbbell Lunges',
    equipment: 'dumbbell',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Dumbbell Romanian Deadlift',
    equipment: 'dumbbell',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Dumbbell Single Leg Deadlift',
    equipment: 'dumbbell',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Dumbbell Step-ups',
    equipment: 'dumbbell',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Dumbbell Sumo Squat',
    equipment: 'dumbbell',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },

  // --- Legs: Kettlebell (3) ---
  {
    name: 'Kettlebell Goblet Squat',
    equipment: 'kettlebell',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Kettlebell Single Leg Deadlift',
    equipment: 'kettlebell',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Kettlebell Thruster',
    equipment: 'kettlebell',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },

  // --- Legs: Cable (3) ---
  {
    name: 'Cable Kickbacks',
    equipment: 'cable',
    muscle: 'legs',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Cable Pull-Through',
    equipment: 'cable',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Cable Romanian Deadlift',
    equipment: 'cable',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },

  // --- Legs: Machine (26) ---
  {
    name: 'Belt Squat Machine',
    equipment: 'machine',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Donkey Calf Raise Machine',
    equipment: 'machine',
    muscle: 'legs',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Glute Drive Machine',
    equipment: 'machine',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Glute Kickback Machine',
    equipment: 'machine',
    muscle: 'legs',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Hack Squat Machine',
    equipment: 'machine',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Hip Abduction Machine',
    equipment: 'machine',
    muscle: 'legs',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Hip Adduction Machine',
    equipment: 'machine',
    muscle: 'legs',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Hip Thrust Machine',
    equipment: 'machine',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Leg Curl',
    equipment: 'machine',
    muscle: 'legs',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Leg Extension',
    equipment: 'machine',
    muscle: 'legs',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Leg Press',
    equipment: 'machine',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Leg Press Calf Raise',
    equipment: 'machine',
    muscle: 'legs',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Lying Leg Curl',
    equipment: 'machine',
    muscle: 'legs',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Nordic Curl Machine',
    equipment: 'machine',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Pendulum Squat',
    equipment: 'machine',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Reverse Hack Squat',
    equipment: 'machine',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Seated Calf Raise',
    equipment: 'machine',
    muscle: 'legs',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Seated Leg Curl',
    equipment: 'machine',
    muscle: 'legs',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Sissy Squat Machine',
    equipment: 'machine',
    muscle: 'legs',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Smith Machine Lunges',
    equipment: 'machine',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Smith Machine Romanian Deadlift',
    equipment: 'machine',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Smith Machine Squat',
    equipment: 'machine',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Standing Calf Raise Machine',
    equipment: 'machine',
    muscle: 'legs',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Standing Leg Curl',
    equipment: 'machine',
    muscle: 'legs',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'V-Squat Machine',
    equipment: 'machine',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Vertical Leg Press',
    equipment: 'machine',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },

  // --- Legs: Bodyweight (22) ---
  {
    name: 'Bodyweight Squat',
    equipment: 'bodyweight',
    muscle: 'legs',
    type: 'compound',
    metrics: 'reps-only',
  },
  {
    name: 'Bulgarian Split Squat',
    equipment: 'bodyweight',
    muscle: 'legs',
    type: 'compound',
    metrics: 'reps-only',
  },
  {
    name: 'Burpees',
    equipment: 'bodyweight',
    muscle: 'legs',
    type: 'cardio',
    metrics: 'reps-only',
  },
  {
    name: 'Butt Kicks',
    equipment: 'bodyweight',
    muscle: 'legs',
    type: 'cardio',
    metrics: 'reps-only',
  },
  {
    name: 'Calf Raises',
    equipment: 'bodyweight',
    muscle: 'legs',
    type: 'isolation',
    metrics: 'reps-only',
  },
  {
    name: 'Donkey Kicks',
    equipment: 'bodyweight',
    muscle: 'legs',
    type: 'isolation',
    metrics: 'reps-only',
  },
  {
    name: 'Glute Bridge Hold',
    equipment: 'bodyweight',
    muscle: 'legs',
    type: 'isometric',
    metrics: 'duration',
  },
  {
    name: 'Glute Bridges',
    equipment: 'bodyweight',
    muscle: 'legs',
    type: 'compound',
    metrics: 'reps-only',
  },
  {
    name: 'High Knees',
    equipment: 'bodyweight',
    muscle: 'legs',
    type: 'cardio',
    metrics: 'reps-only',
  },
  {
    name: 'Jump Lunges',
    equipment: 'bodyweight',
    muscle: 'legs',
    type: 'cardio',
    metrics: 'reps-only',
  },
  {
    name: 'Jump Rope',
    equipment: 'bodyweight',
    muscle: 'legs',
    type: 'cardio',
    metrics: 'reps-only',
  },
  {
    name: 'Jump Squats',
    equipment: 'bodyweight',
    muscle: 'legs',
    type: 'cardio',
    metrics: 'reps-only',
  },
  {
    name: 'Jumping Jacks',
    equipment: 'bodyweight',
    muscle: 'legs',
    type: 'cardio',
    metrics: 'reps-only',
  },
  {
    name: 'Lunges',
    equipment: 'bodyweight',
    muscle: 'legs',
    type: 'compound',
    metrics: 'reps-only',
  },
  {
    name: 'Pistol Squats',
    equipment: 'bodyweight',
    muscle: 'legs',
    type: 'compound',
    metrics: 'reps-only',
  },
  {
    name: 'Reverse Lunges',
    equipment: 'bodyweight',
    muscle: 'legs',
    type: 'compound',
    metrics: 'reps-only',
  },
  {
    name: 'Single Leg Glute Bridge',
    equipment: 'bodyweight',
    muscle: 'legs',
    type: 'compound',
    metrics: 'reps-only',
  },
  {
    name: 'Sprawls',
    equipment: 'bodyweight',
    muscle: 'legs',
    type: 'cardio',
    metrics: 'reps-only',
  },
  {
    name: 'Squat Thrusts',
    equipment: 'bodyweight',
    muscle: 'legs',
    type: 'cardio',
    metrics: 'reps-only',
  },
  {
    name: 'Step-ups',
    equipment: 'bodyweight',
    muscle: 'legs',
    type: 'compound',
    metrics: 'reps-only',
  },
  {
    name: 'Tuck Jumps',
    equipment: 'bodyweight',
    muscle: 'legs',
    type: 'cardio',
    metrics: 'reps-only',
  },
  {
    name: 'Walking Lunges',
    equipment: 'bodyweight',
    muscle: 'legs',
    type: 'compound',
    metrics: 'reps-only',
  },
  {
    name: 'Wall Sit',
    equipment: 'bodyweight',
    muscle: 'legs',
    type: 'isometric',
    metrics: 'duration',
  },
  // ═══════════════════════════════════════════════════════════════════════════════
  // CORE
  // ═══════════════════════════════════════════════════════════════════════════════

  // --- Core: Kettlebell (3) ---
  {
    name: 'Kettlebell Figure 8',
    equipment: 'kettlebell',
    muscle: 'core',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Kettlebell Turkish Get-up',
    equipment: 'kettlebell',
    muscle: 'core',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Kettlebell Windmill',
    equipment: 'kettlebell',
    muscle: 'core',
    type: 'compound',
    metrics: 'weight-reps',
  },

  // --- Core: Dumbbell (1) ---
  {
    name: 'Weighted Plank',
    equipment: 'dumbbell',
    muscle: 'core',
    type: 'isometric',
    metrics: 'duration',
  },

  // --- Core: Cable (2) ---
  {
    name: 'Cable Crunch',
    equipment: 'cable',
    muscle: 'core',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Cable Woodchop',
    equipment: 'cable',
    muscle: 'core',
    type: 'compound',
    metrics: 'weight-reps',
  },

  // --- Core: Bodyweight (20) ---
  {
    name: 'Bear Crawl',
    equipment: 'bodyweight',
    muscle: 'core',
    type: 'cardio',
    metrics: 'duration',
  },
  {
    name: 'Bicycle Crunches',
    equipment: 'bodyweight',
    muscle: 'core',
    type: 'compound',
    metrics: 'reps-only',
  },
  {
    name: 'Bird Dog',
    equipment: 'bodyweight',
    muscle: 'core',
    type: 'stability',
    metrics: 'reps-only',
  },
  {
    name: 'Bodyweight Get-up',
    equipment: 'bodyweight',
    muscle: 'core',
    type: 'compound',
    metrics: 'reps-only',
  },
  {
    name: 'Crunches',
    equipment: 'bodyweight',
    muscle: 'core',
    type: 'isolation',
    metrics: 'reps-only',
  },
  {
    name: 'Dead Bug',
    equipment: 'bodyweight',
    muscle: 'core',
    type: 'stability',
    metrics: 'reps-only',
  },
  {
    name: 'Flutter Kicks',
    equipment: 'bodyweight',
    muscle: 'core',
    type: 'isolation',
    metrics: 'reps-only',
  },
  {
    name: 'Hollow Body Hold',
    equipment: 'bodyweight',
    muscle: 'core',
    type: 'isometric',
    metrics: 'duration',
  },
  {
    name: 'Inchworms',
    equipment: 'bodyweight',
    muscle: 'core',
    type: 'compound',
    metrics: 'reps-only',
  },
  {
    name: 'L-Sit',
    equipment: 'bodyweight',
    muscle: 'core',
    type: 'isometric',
    metrics: 'duration',
  },
  {
    name: 'Leg Raises',
    equipment: 'bodyweight',
    muscle: 'core',
    type: 'isolation',
    metrics: 'reps-only',
  },
  {
    name: 'Mountain Climbers',
    equipment: 'bodyweight',
    muscle: 'core',
    type: 'cardio',
    metrics: 'reps-only',
  },
  {
    name: 'Plank',
    equipment: 'bodyweight',
    muscle: 'core',
    type: 'isometric',
    metrics: 'duration',
  },
  {
    name: 'Plank to Pike',
    equipment: 'bodyweight',
    muscle: 'core',
    type: 'compound',
    metrics: 'reps-only',
  },
  {
    name: 'Reverse Crunches',
    equipment: 'bodyweight',
    muscle: 'core',
    type: 'isolation',
    metrics: 'reps-only',
  },
  {
    name: 'Russian Twists',
    equipment: 'bodyweight',
    muscle: 'core',
    type: 'compound',
    metrics: 'reps-only',
  },
  {
    name: 'Side Plank',
    equipment: 'bodyweight',
    muscle: 'core',
    type: 'isometric',
    metrics: 'duration',
  },
  {
    name: 'Sit-ups',
    equipment: 'bodyweight',
    muscle: 'core',
    type: 'compound',
    metrics: 'reps-only',
  },
  {
    name: 'Superman',
    equipment: 'bodyweight',
    muscle: 'core',
    type: 'isometric',
    metrics: 'duration',
  },
  {
    name: 'Toe Touches',
    equipment: 'bodyweight',
    muscle: 'core',
    type: 'isolation',
    metrics: 'reps-only',
  },
  {
    name: 'V-ups',
    equipment: 'bodyweight',
    muscle: 'core',
    type: 'compound',
    metrics: 'reps-only',
  },

  // --- Core: Club (1) ---
  {
    name: 'Club Pendulum',
    equipment: 'club',
    muscle: 'core',
    type: 'compound',
    metrics: 'weight-reps',
  },
  // ═══════════════════════════════════════════════════════════════════════════════
  // EGYM SMART STRENGTH CIRCUIT (batch 2 — see egymExercises above)
  // ═══════════════════════════════════════════════════════════════════════════════
  ...egymExercises,
])
