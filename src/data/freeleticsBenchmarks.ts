/**
 * Popular Freeletics "god" workouts, seeded as benchmarks on app start.
 *
 * Rep schemes follow the classic standard (non-scaled) versions. Only
 * rep-countable workouts are included — benchmarks track prescribed reps per
 * exercise, so workouts built around runs or sprints (Hades, Kentauros, Hera,
 * Ares) cannot be represented.
 *
 * Exercise names match the seeded exercise catalog in popularExercises.ts:
 * Freeletics "Climbers" → Mountain Climbers, "High Jumps" → Tuck Jumps,
 * "Leg Levers" → Leg Raises, "Squats" → Bodyweight Squat.
 */

type FreeleticsRoundExercise = {
  name: string
  reps: number
}

export type FreeleticsBenchmark = {
  name: string
  /** Ordered rounds, each an ordered list of exercises with prescribed reps. */
  rounds: ReadonlyArray<ReadonlyArray<FreeleticsRoundExercise>>
}

function repeatRound(
  times: number,
  round: ReadonlyArray<FreeleticsRoundExercise>,
): ReadonlyArray<ReadonlyArray<FreeleticsRoundExercise>> {
  return Array.from({ length: times }, () => round)
}

export const freeleticsBenchmarks: ReadonlyArray<FreeleticsBenchmark> = [
  {
    // 5 rounds, 50-40-30-20-10
    name: 'Aphrodite',
    rounds: [50, 40, 30, 20, 10].map((reps) => [
      { name: 'Burpees', reps },
      { name: 'Bodyweight Squat', reps },
      { name: 'Sit-ups', reps },
    ]),
  },
  {
    // 3 rounds, 10-25-10
    name: 'Metis',
    rounds: [10, 25, 10].map((reps) => [
      { name: 'Burpees', reps },
      { name: 'Mountain Climbers', reps },
      { name: 'Tuck Jumps', reps },
    ]),
  },
  {
    name: 'Dione',
    rounds: repeatRound(3, [
      { name: 'Jumping Jacks', reps: 75 },
      { name: 'Burpees', reps: 25 },
      { name: 'Leg Raises', reps: 50 },
      { name: 'Jumping Jacks', reps: 75 },
      { name: 'Sit-ups', reps: 50 },
      { name: 'Burpees', reps: 25 },
    ]),
  },
  {
    name: 'Venus',
    rounds: repeatRound(4, [
      { name: 'Push-ups', reps: 50 },
      { name: 'Sit-ups', reps: 20 },
      { name: 'Bodyweight Squat', reps: 50 },
    ]),
  },
  {
    name: 'Zeus',
    rounds: repeatRound(4, [
      { name: 'Push-ups', reps: 25 },
      { name: 'Pull-ups', reps: 15 },
      { name: 'Bodyweight Squat', reps: 45 },
      { name: 'Sit-ups', reps: 35 },
      { name: 'Handstand Push-ups', reps: 5 },
    ]),
  },
  {
    // 4 rounds, 20-15-10-5
    name: 'Poseidon',
    rounds: [20, 15, 10, 5].map((reps) => [
      { name: 'Pull-ups', reps },
      { name: 'Push-ups', reps },
    ]),
  },
  {
    // 5 rounds, inverted ladder: reps drop toward round 3 and climb back up
    name: 'Prometheus',
    rounds: [
      { main: 30, pushups: 10 },
      { main: 20, pushups: 7 },
      { main: 10, pushups: 5 },
      { main: 20, pushups: 7 },
      { main: 30, pushups: 10 },
    ].map(({ main, pushups }) => [
      { name: 'Mountain Climbers', reps: main },
      { name: 'Push-ups', reps: pushups },
      { name: 'Sit-ups', reps: main },
      { name: 'Bodyweight Squat', reps: main },
      { name: 'Jumping Jacks', reps: 50 },
    ]),
  },
  {
    // 3 rounds, 10-25-10
    name: 'Krios',
    rounds: [10, 25, 10].map((reps) => [
      { name: 'Pull-ups', reps },
      { name: 'Bodyweight Squat', reps },
      { name: 'Sit-ups', reps },
    ]),
  },
  {
    // 3 rounds, 10-25-10
    name: 'Nyx',
    rounds: [10, 25, 10].map((reps) => [
      { name: 'Sit-ups', reps },
      { name: 'Leg Raises', reps },
    ]),
  },
]
