export default {
  title: 'Progressionen',
  subtitle: 'Kettlebell-EMOM-Progressionen',

  buttons: {
    create: 'Progression erstellen',
  },

  empty: {
    title: 'Noch keine Progressionen',
    description:
      'Erstelle einen Kettlebell-EMOM-Progressionsplan, um deinen Fortschritt zu verfolgen',
  },

  status: {
    complete: 'Abgeschlossen',
  },

  card: {
    sessions: '{count} Einheiten abgeschlossen',
    ariaComplete: '{name} - Abgeschlossen',
    ariaCurrent: '{name} - {weight}kg, {reps} Wdh., {minutes} min EMOM',
  },

  create: {
    title: 'Progression erstellen',
    name: 'Name',
    namePlaceholder: 'z.B. KB Swing Challenge',
    kettlebells: 'Verfügbare Kettlebells',
    kettlebellsHint: 'Wähle alle Kettlebells aus, die du hast',
    startingWeight: 'Startgewicht',
    selectWeight: 'Startgewicht wählen',
    preview: 'Vorschau',
    previewStart: 'Start bei {weight}kg mit 10 Wdh., 10 min EMOM',
    previewPath: 'Progressionspfad:',
  },

  detail: {
    title: 'Progression',
    notFound: 'Progression nicht gefunden',
    currentLevel: 'Aktuelles Level',
    sessions: '{count} Einheiten abgeschlossen',
    startSession: 'Einheit starten',
    kettlebells: 'Kettlebells',
    history: 'Verlauf',
    sessionSummary: '{weight}kg × {reps} Wdh. × {minutes} min',
  },

  delete: {
    title: 'Progression löschen?',
    action: 'Progression löschen',
    description:
      'Dies löscht die Progression und den gesamten Verlauf. Diese Aktion kann nicht rückgängig gemacht werden.',
  },

  session: {
    title: 'EMOM-Einheit',
    repsPerMinute: 'Wdh. pro Minute',
    minute: 'Minute {current} von {total}',
    duration: '{minutes} Minuten EMOM',
    tapToStart: 'Tippe zum Starten',
    lastMinute: 'Letzte Minute!',
    completeTitle: 'Einheit abgeschlossen',
    completeQuestion: 'Hast du alle Wiederholungen in jeder Minute geschafft?',
    yes: 'Ja, geschafft!',
    no: 'Nein, nicht alle',
    retry: 'Erneut versuchen',
    completed: 'Geschafft',
    failed: 'Unvollständig',
  },
} as const
