Feature: Workout persistence

  As someone logging sets on a phone mid-session, I want everything I have
  entered to still be there after the app reloads, so a backgrounded tab or a
  dropped connection never costs me a workout.

  Background:
    Given a first-time user has entered the app
    And a bench press workout is in progress

  Scenario: An in-progress workout and its logged set survive a page reload
    When they log set 1 as 80 kg for 10 reps at 2 RIR
    And they mark set 1 complete
    Then set 1 is stored as completed in the local database
    When they reload the page
    And they resume the in-progress workout
    Then set 1 is marked complete
    And set 1 reads 80 kg for 10 reps at 2 RIR

  Scenario: A finished workout stays readable in history after a page reload
    When they log set 1 as 80 kg for 10 reps at 2 RIR
    And they mark set 1 complete
    And they finish the workout as "E2E Strength Session"
    Then the workout is reported complete
    When they open the workout summary
    Then the summary shows "E2E Strength Session" with "1.6k" kg lifted
    When they reload the page
    Then the summary still shows "E2E Strength Session"
    When they open "E2E Strength Session" from history
    Then the workout detail lists "Bench Press" as "2 sets · top 80 kg"
    When they expand "Bench Press"
    Then a set row shows set 1 at 80 kg for 10 reps at 2 RIR
