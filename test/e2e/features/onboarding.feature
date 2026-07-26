Feature: Onboarding

  As someone opening the app for the first time, I want to reach my workouts in
  one tap and never be sent back to the welcome screen, so onboarding costs me
  nothing after that first visit.

  Scenario: A first-time user is welcomed and can skip straight into the app
    Given a first-time user opens the app
    Then they are welcomed on the onboarding screen
    When they skip onboarding
    Then they are on the workout home screen

  Scenario: Onboarding is not shown again after a page reload
    Given a first-time user has entered the app
    When they reload the page
    Then they are on the workout home screen
    And onboarding is not offered again
