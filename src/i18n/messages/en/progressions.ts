export default {
  title: 'Progressions',
  subtitle: 'Kettlebell EMOM progressions',

  buttons: {
    create: 'Create Progression',
  },

  empty: {
    title: 'No progressions yet',
    description: 'Create a kettlebell EMOM progression plan to track your progress',
  },

  status: {
    complete: 'Complete',
  },

  card: {
    sessions: '{count} sessions completed',
    ariaComplete: '{name} - Complete',
    ariaCurrent: '{name} - {weight}kg, {reps} reps, {minutes} min EMOM',
  },

  create: {
    title: 'Create Progression',
    name: 'Name',
    namePlaceholder: 'e.g., KB Swing Challenge',
    kettlebells: 'Available Kettlebells',
    kettlebellsHint: 'Select all the kettlebells you have access to',
    startingWeight: 'Starting Weight',
    selectWeight: 'Select starting weight',
    preview: 'Preview',
    previewStart: 'Start at {weight}kg with 10 reps, 10 min EMOM',
    previewPath: 'Progression path:',
  },

  detail: {
    title: 'Progression',
    notFound: 'Progression not found',
    currentLevel: 'Current Level',
    sessions: '{count} sessions completed',
    startSession: 'Start Session',
    kettlebells: 'Kettlebells',
    history: 'Session History',
    sessionSummary: '{weight}kg × {reps} reps × {minutes} min',
  },

  delete: {
    title: 'Delete Progression?',
    action: 'Delete progression',
    description:
      'This will delete the progression and all session history. This action cannot be undone.',
  },

  session: {
    title: 'EMOM Session',
    repsPerMinute: 'reps per minute',
    minute: 'Minute {current} of {total}',
    duration: '{minutes} minute EMOM',
    tapToStart: 'Tap to start',
    lastMinute: 'Last minute!',
    completeTitle: 'Session Complete',
    completeQuestion: 'Did you complete all reps in each minute?',
    yes: 'Yes, completed!',
    no: 'No, missed some',
    completed: 'Completed',
    failed: 'Incomplete',
  },
} as const
