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
    description: 'Add this app to your home screen for quick access and offline use.',
    ios: {
      title: 'iOS (Safari)',
      instruction: 'Tap Share, then "Add to Home Screen"',
    },
    android: {
      title: 'Android (Chrome)',
      instruction: 'Tap Menu, then "Install app"',
    },
    desktop: {
      title: 'Desktop',
      instruction: 'Click the install icon in the address bar',
    },
  },
  quickWorkout: {
    title: 'Build workouts on the fly',
    description: 'Mix strength training with timed workouts like AMRAP, EMOM, and more.',
    setsReps: '{sets} sets \u00D7 {reps} reps',
    minAmrap: '{min} min AMRAP',
  },
  templates: {
    title: 'Save your favorites',
    description: 'Create reusable templates for your go-to workouts.',
    blockCount: '{count} blocks',
  },
  benchmarks: {
    title: 'Track your progress',
    description: 'Log benchmark workouts and see your improvement over time.',
    forTime: 'For Time',
    amrap: 'AMRAP',
  },
  checklist: {
    title: "You're ready!",
    description: 'Pick a starting point:',
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
    goToSlide: 'Go to slide',
  },
} as const
