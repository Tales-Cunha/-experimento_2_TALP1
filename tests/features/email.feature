# language: en
Feature: Email Notifications for Assessments
  As a student
  I want to receive a daily digest of my assessment changes
  So that I am kept informed without being overwhelmed by multiple emails

  Background:
    Given a student "João Silva" with email "joao@example.com" exists
    And a class "Engenharia de Software" exists
    And the student "João Silva" is enrolled in "Engenharia de Software"

  Scenario: Saving an assessment adds an entry to the email queue
    When I save an assessment for "João Silva" in "Engenharia de Software" for "Requisitos" with concept "MA"
    Then the email queue should contain an entry for "João Silva" regarding "Requisitos" in "Engenharia de Software"

  Scenario: Saving the same assessment twice replaces the entry
    Given I save an assessment for "João Silva" in "Engenharia de Software" for "Requisitos" with concept "MANA"
    When I save an assessment for "João Silva" in "Engenharia de Software" for "Requisitos" with concept "MA"
    Then the email queue should contain only one entry for "João Silva" regarding "Requisitos" in "Engenharia de Software"
    And that entry should have the concept "MA"

  Scenario: Daily digest sends one email per student with all changes
    Given I save an assessment for "João Silva" in "Engenharia de Software" for "Requisitos" with concept "MA"
    And I save an assessment for "João Silva" in "Engenharia de Software" for "Testes" with concept "MPA"
    When the daily digest runs
    Then one email should be sent to "joao@example.com"
    And the email should contain the assessment for "Requisitos"
    And the email should contain the assessment for "Testes"
    And the email queue for today should be cleared

  Scenario: Student in two classes receives one consolidated email
    Given a class "Programação 1" exists
    And the student "João Silva" is enrolled in "Programação 1"
    And I save an assessment for "João Silva" in "Engenharia de Software" for "Requisitos" with concept "MA"
    And I save an assessment for "João Silva" in "Programação 1" for "Implementação" with concept "MANA"
    When the daily digest runs
    Then one email should be sent to "joao@example.com"
    And the email should contain the "Engenharia de Software" assessment
    And the email should contain the "Programação 1" assessment

  Scenario: Email content is logged to console in development mode
    Given the system is running in "development" mode
    And I save an assessment for "João Silva" in "Engenharia de Software" for "Requisitos" with concept "MA"
    When the daily digest runs
    Then no real email should be sent
    And the email content for "João Silva" should be logged to the console
