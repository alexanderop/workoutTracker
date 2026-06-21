export default {
  welcome: {
    title: 'Workout Tracker',
    startTour: 'Tour starten',
    skipToApp: 'Zur App',
  },
  welcomeBack: {
    title: 'Willkommen zurück!',
    resumeTour: 'Tour fortsetzen',
  },
  pwa: {
    title: 'Für beste Nutzung installieren',
    description: 'Füge diese App zu deinem Startbildschirm hinzu für schnellen Zugriff und Offline-Nutzung.',
    ios: {
      title: 'iOS (Safari)',
      instruction: 'Tippe auf Teilen, dann "Zum Home-Bildschirm"',
    },
    android: {
      title: 'Android (Chrome)',
      instruction: 'Tippe auf Menü, dann "App installieren"',
    },
    desktop: {
      title: 'Desktop',
      instruction: 'Klicke auf das Installations-Symbol in der Adressleiste',
    },
  },
  quickWorkout: {
    title: 'Erstelle Workouts spontan',
    description: 'Kombiniere Krafttraining mit zeitbasierten Workouts wie AMRAP, EMOM und mehr.',
    setsReps: '{sets} Sätze \u{D7} {reps} Wdh.',
    minAmrap: '{min} Min. AMRAP',
  },
  templates: {
    title: 'Speichere deine Favoriten',
    description: 'Erstelle wiederverwendbare Vorlagen für deine Lieblings-Workouts.',
    blockCount: '{count} Blöcke',
  },
  benchmarks: {
    title: 'Verfolge deinen Fortschritt',
    description: 'Protokolliere Benchmark-Workouts und sieh deine Verbesserung über Zeit.',
    forTime: 'Auf Zeit',
    amrap: 'AMRAP',
  },
  checklist: {
    title: 'Du bist bereit!',
    description: 'Wähle einen Startpunkt:',
    createTemplate: 'Erstelle deine erste Vorlage',
    browseExercises: 'Durchsuche die Übungsbibliothek',
    startWorkout: 'Starte ein schnelles Workout',
    tryBenchmark: 'Probiere einen Benchmark',
  },
  navigation: {
    next: 'Weiter',
    back: 'Zurück',
    skip: 'Überspringen',
    letsGo: 'Los geht\'s',
    goToSlide: 'Gehe zu Folie',
  },
} as const
