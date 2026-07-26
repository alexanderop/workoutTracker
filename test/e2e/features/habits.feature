Feature: Habit tracking

  As someone building consistent daily routines, I want to track habits and
  check them off day by day, so I can see my progress and trust it survives
  even if I close the app or lose my connection.

  Background:
    Given a first-time user has entered the app
    And they open the habits page

  Scenario: Creating a habit adds it to today's list
    When they add a new daily habit named "Drink water"
    Then "Drink water" appears in today's habits

  Scenario: Checking a habit off marks it complete, and unchecking it marks it incomplete again
    Given a daily habit named "Drink water" exists
    When they check off "Drink water" for today
    Then "Drink water" is marked complete
    When they uncheck "Drink water" for today
    Then "Drink water" is marked incomplete

  Scenario: A completed habit survives a page reload
    Given a daily habit named "Drink water" exists
    When they check off "Drink water" for today
    And they reload the page
    Then "Drink water" is marked complete
