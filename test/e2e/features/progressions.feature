Feature: Kettlebell progressions

  As someone working a kettlebell EMOM progression over weeks, I want my plan
  and the level I have reached to be there whenever I open the app, so I can
  trust it mid-workout even with no connection.

  Background:
    Given a first-time user has opened the progressions list

  # One scenario, not two. "Creating a progression adds it to the list" was a
  # strict prefix of this one — same When, same Then — and the create-then-see-it
  # path is already covered in the browser tier
  # (integration/progression-management.spec.ts). Only the reload exercises what
  # no cheaper tier can: real IndexedDB surviving a real page load.
  Scenario: A created progression survives a page reload
    When they create a progression named "KB Swing Ladder" with the 16kg and 20kg kettlebells
    Then "KB Swing Ladder" appears in the progressions list at 16kg, 10 reps, 10 min
    When they reload the page
    Then "KB Swing Ladder" appears in the progressions list at 16kg, 10 reps, 10 min
