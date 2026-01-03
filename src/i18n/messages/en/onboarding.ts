export default {
  welcome: {
    title: 'Workout Tracker',
    startTour: 'Start Tour',
    skipToApp: 'Skip to App',
  },
  welcomeBack: {
    title: 'Welcome back!',
    resumeTour: 'Resume Tour',
  },
  pwa: {
    title: 'Install for the best experience',
    description: 'Add to your home screen for quick access and offline support',
    instruction: 'Tap the share button and select "Add to Home Screen"',
  },
  quickWorkout: {
    title: 'Build workouts on the fly',
    description: 'Create custom workouts with strength, AMRAP, EMOM, Tabata, and more',
  },
  templates: {
    title: 'Save your favorites',
    description: 'Turn any workout into a reusable template',
  },
  benchmarks: {
    title: 'Track your progress',
    description: 'Compete against yourself with timed benchmark workouts',
  },
  checklist: {
    title: "You're ready!",
    description: 'Here are some things to try:',
    createTemplate: 'Create your first template',
    browseExercises: 'Browse the exercise library',
    startWorkout: 'Start a quick workout',
    tryBenchmark: 'Try a benchmark',
  },
  navigation: {
    next: 'Next',
    back: 'Back',
    skip: 'Skip',
    letsGo: "Let's Go",
  },
  previews: {
    strengthBlock: 'Strength',
    amrapBlock: 'AMRAP',
    sets: '{count} sets',
    reps: '{count} reps',
    duration: '{minutes} min',
    exercises: '{count} exercises',
  },
  aria: {
    slide: 'Slide {current} of {total}',
    goToSlide: 'Go to slide {n}',
    progressDot: 'Progress indicator',
  },
} as const
