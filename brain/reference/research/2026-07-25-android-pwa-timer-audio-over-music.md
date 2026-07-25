---
type: Research
title: Timer beeps inaudible on Android PWA while music plays
description: Why the Web Audio timer cues get lost when another app plays music on Android Chrome (masking, no audio ducking, hidden-tab suspension, timer throttling, cold audio path) and which of those we can actually fix.
resource: brain/reference/research/2026-07-25-android-pwa-timer-audio-over-music.md
tags: [research, audio, timers, pwa, android, web-audio, media-session, mobile]
timestamp: 2026-07-25T00:00:00Z
---

## Research: Timer beeps inaudible on Android PWA while music plays

**Date:** 2026-07-25
**Status:** Complete. Options A, B and F shipped (see *What shipped*); C, D and
E are still open and gated on the device verification below.

## Problem Statement

On Android, with the app installed as a PWA, the round-transition timer beeps
are not heard while music plays from another app (Spotify/YT Music/etc.).
Reported as "I don't hear the sound of the timer for the next round". The music
keeps playing normally — it is not paused or interrupted — so this is not a
case of the two apps fighting over exclusive audio focus.

## How timer audio works today

- `src/composables/timers/useTimerAudio.ts` is the only sound source. It
  lazily does `new AudioContext()` **per composable instance**, resumes it if
  `suspended`/`interrupted` (racing a 100 ms timeout), then plays a bare
  `OscillatorNode` → `GainNode` → `destination`.
- Cues are 150 ms **pure sine** tones: work 880 Hz, rest 440 Hz, round 660 Hz,
  complete = 440/660/880 ascending. `gain.value` is set once from
  `settings.timerSoundVolume` (default `0.8`) — no attack/release envelope.
- Only two call sites: `src/components/timers/WorkoutTabataView.vue` and
  `src/views/ActiveProgressionView.vue`. **AMRAP, EMOM and ForTime views play
  no sound at all**, and `useRestTimer` only vibrates
  (`REST_COMPLETE_VIBRATION_PATTERN`) — no beep. Worth knowing before
  debugging: depending on which block was running, there may be no cue to hear
  in the first place.
- Beeps are fired from Vue `watch`ers driven by `useBaseTimer`'s
  `useIntervalFn` (JS timers), *not* scheduled on the audio clock.
- No `navigator.mediaSession` usage anywhere in `src/`.
- `useScreenWakeLock` keeps the screen on and falls back to a looping silent
  **video** (no audio track), so it does not make the page "audible" to Chrome.

## Findings

Five mechanisms can each independently produce this symptom. Ranked by how
well they match "music plays, music does not pause, beep not heard".

### 1. No ducking + perceptual masking (most likely, and fixable)

Android mixes our output into the media stream; it does not lower the music.
Chromium requests Android's `AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK` for **short
media playback** ("If media is only a few seconds then it will request the
ducking focus type" — Chromium audio-focus docs), which ducks other apps
instead of pausing them. That path is driven by MediaSession/media elements;
a raw `AudioContext` graph does not get us that treatment, which is exactly
consistent with the observation that the music never dips.

So the beep is mixed at full music volume against it — and a 150 ms pure sine
with no harmonics and no envelope is close to the worst possible signal for
punching through music in in-ear headphones. Two independent reasons it
disappears: no ducking, and a spectrally thin cue.

### 2. Cold audio output path swallows the first tone

A new `AudioContext` per component + a beep only 150 ms long means the very
first cue often plays while the output stream is still opening. This is a
documented Bluetooth behaviour: "Some Bluetooth speakers miss the first part
of the next sound following silence… playing a quiet noise at all times
prevents periods of total silence and avoids this problem." Android output
latency alone ranges from ~12 ms to ~150 ms depending on device, and Web Audio
does **not** compensate for Bluetooth latency the way media elements do. Music
over Bluetooth is the common gym case, so this compounds finding 1.

### 3. Hidden-tab AudioContext suspension

To change tracks the user switches to the music app (or locks the screen), so
the PWA is hidden. Chrome is reported to suspend the `AudioContext` when the
tab is hidden and resume it when it is shown again. Our `ensureAudioReady()`
does try to `resume()`, but it races a 100 ms timeout and — critically — a
`resume()` from a non-user-gesture stack is not guaranteed to succeed on
Android Chrome. Confidence: moderate (secondary sources; could not fetch the
Chromium source docs from this environment — see *Verification* below).

### 4. Background JS-timer throttling

Beeps are triggered from `useIntervalFn`. Chrome throttles timers in
background pages to **once per minute** after ~5 minutes hidden. Pages playing
*audible* audio are exempt — but the exemption is explicitly gated on real
audibility: "audio is considered audible when and only when Chrome shows the
audio icon. Silent audio streams do not grant exemptions", and it lapses a
few seconds after the sound stops. Our cues are 150 ms every 20 s, so we are
silent ~99% of the time and cannot rely on that exemption. This is why the
classic "loop a silent audio element to stay alive" trick does *not* work on
modern Chrome.

### 5. Web Audio → Bluetooth routing bug

There are longstanding reports that on Chrome for Android, media elements and
video route to a Bluetooth sink correctly while **Web Audio API output does
not** — "it is only Web Audio API sounds that don't play". If the user is on
Bluetooth headphones, this alone explains total silence. Confidence: low-to-
moderate, device/version dependent — but it is the one cause that would make
every Web Audio fix futile, which is why the verification step below matters.

## What we can actually enable

| Option | Effect | Cost / risk |
| --- | --- | --- |
| **A. Cue redesign** — 2–3 pulse burst, square/triangle (or sine + octave), 5 ms attack / 40 ms release envelope, optional `DynamicsCompressorNode`, longer total cue | Directly attacks finding 1's masking half; audibly better over music even with everything else unchanged | Trivial, no new APIs, no platform risk |
| **B. Single shared `AudioContext`** as a `createGlobalState()` singleton, created/resumed on the first Start tap (a real user gesture), kept running for the whole session, with an inaudible keepalive node so the output stream never fully closes | Fixes finding 2 (cold path) and hardens finding 3 | Small; matches the project's state convention. Keepalive must stay genuinely inaudible so it isn't a battery/ducking nuisance |
| **C. Schedule cues on the audio clock** — `osc.start(ctx.currentTime + delta)` for the whole upcoming interval instead of beeping from a `watch` | Immune to finding 4: the audio thread is not throttled, so cues land on time even if JS ticks once a minute | Medium — timer composables must publish upcoming phase boundaries; needs care on pause/skip/adjust (cancel + reschedule) |
| **D. Play cues through a short `<audio>` element** (pre-generated WAV blob, well under 5 s) instead of / alongside Web Audio | The one way to get Android to **duck the music**: Chromium requests transient-duck focus for short media playback, and media elements are the path that gets correct Bluetooth routing (finding 5) | Medium. Must stay short so Chromium treats it as one-shot/transient — a long-lived media session would take full audio focus and **pause the user's music**, which is worse than the bug |
| **E. `navigator.mediaSession`** for a real media role in the background | Best background survival | Highest risk: full `GAIN` focus pauses the music. Only worth it as an explicit "workout audio takes over" mode |
| **F. Vibration as a co-equal cue** for round transitions (Tabata/EMOM), not just rest completion | Works regardless of audio focus, routing, or gym noise; already proven in `useRestTimer` | Trivial. Foreground-only, and does nothing when the phone is on a bench |
| **G. Service-worker `showNotification()`** on phase change as a background-only fallback | Notification channel audio ducks music and fires even when the page is throttled | Crude (Chrome's notification sound, not our beep), needs notification permission, and can spam the shade |

Non-code mitigation worth telling the user regardless: **keep the PWA in the
foreground and drive the music from the notification shade / lock-screen
controls instead of switching to the music app.** The wake lock already keeps
the screen on, and a foregrounded page sidesteps findings 3 and 4 entirely.

## Recommendation

Ship **A + B + F** first: they are small, carry no platform risk, and together
cover the most likely cause (a thin, unducked, cold-path cue). Then verify on
the actual device before spending effort on **C** (throttling) or **D**
(ducking + Bluetooth routing), because C and D are only worth their complexity
if verification shows the failure is background/routing rather than masking.

Deliberately not recommending E; pausing the user's music to announce a round
is a worse outcome than a missed beep.

## What shipped

A, B and F, one commit each:

1. **B** — `useTimerAudio` is a `createGlobalState` singleton: one
   `AudioContext` per session instead of one per component, `prepare()` warms
   it from the mount of a timer screen (while user activation still holds), an
   inaudible `ConstantSourceNode` keeps the output device open between cues,
   and `visibilitychange` resumes the context when the user comes back from
   their music app. `dispose()` exists for the test boundary.
2. **A** — each cue is now a burst of enveloped `square` pulses through a
   shared `DynamicsCompressorNode`, scheduled on the audio clock rather than
   chained `setTimeout`s. Pulse count identifies the cue by ear: 2 = work,
   1 = rest, 3 = round, ascending = complete.
3. **F** — Tabata work/rest/complete transitions vibrate as well as beep.
   Round changes stay audio-only: work opens every round in the same tick, and
   a second `navigator.vibrate()` call would cancel the first.

Still open: **C** (schedule cues across a whole interval so background timer
throttling cannot delay them), **D** (media-element cue to make Android duck
the music), and the AMRAP/EMOM/ForTime views plus `useRestTimer`, which still
have no audio cue at all.

## Verification (do this before building C or D)

The five findings need different fixes, so measure rather than guess. Remote-
debug the installed PWA (`chrome://inspect` from a desktop over USB) and log,
during a real Tabata round with music playing:

1. `ctx.state` and `ctx.currentTime` at each beep — distinguishes finding 3
   (suspended/frozen clock) from "played but unheard".
2. Wall-clock delta between ticks while the app is backgrounded — exposes
   finding 4 (1/min throttling).
3. Whether the beep is heard with music playing **through the phone speaker**
   vs. **through Bluetooth** — isolates finding 5.
4. Whether a `<audio>`-element beep is heard where the Web Audio beep is not,
   and whether the music dips — confirms findings 1 and 5 together.

## Sources

- [Audio Focus Handling — Chromium docs](https://chromium.googlesource.com/chromium/src.git/+/master/docs/media/audio_focus.md)
- [Manage audio focus — Android Developers](https://developer.android.com/media/optimize/audio-focus)
- [Heavy throttling of chained JS timers beginning in Chrome 88 — Chrome for Developers](https://developer.chrome.com/blog/timer-throttling-in-chrome-88)
- [Background tabs in Chrome 57 — Chrome for Developers](https://developer.chrome.com/blog/background_tabs)
- [Web Audio, Autoplay Policy and Games — Chrome for Developers](https://developer.chrome.com/blog/web-audio-autoplay/)
- [A tale of two clocks — web.dev](https://web.dev/articles/audio-scheduling)
- [Web Audio on different platforms — Samsung Internet Developers](https://medium.com/samsung-internet-dev/web-audio-on-different-platforms-67fc9ffc2c4e)
- [Web Audio API output latency](https://www.jamieonkeys.dev/posts/web-audio-api-output-latency/)
- [AudioContext.suspend() / state — MDN](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/suspend)
- [WebAudio suspend/resume sample — Google Chrome samples](https://googlechrome.github.io/samples/webaudio-suspend-resume/)
- [What PWA Can Do Today — audio](https://whatpwacando.today/audio/)
- [Chromium issue 40303049 — Android Chrome HTML5 audio without user action](https://issues.chromium.org/issues/40303049)

**Caveat:** the sandbox for this session could not fetch pages directly (all
outbound fetches returned 403), so the Chromium/Chrome primary docs above are
cited from search-result excerpts rather than read end-to-end. The
confidence notes per finding reflect that.
