# language: en

Feature: Assessment management
  As an instructor
  I want to manage assessments by student, class, and meta
  So that learning progress is visible and consistent

  Scenario: Viewing the global assessment table with students as rows and metas as columns
    Given the student registry contains the following students:
      | nome      | cpf            | email                 |
      | Ana Souza | 529.982.247-25 | ana.souza@example.com |
      | Bruno Lima| 390.533.447-05 | bruno.lima@example.com |
    And the class registry contains a class with topico "Software Quality", ano 2026, and semestre 1
    And both students are enrolled in this class
    And the following assessments exist for this class:
      | alunoCpf       | meta            | conceito |
      | 529.982.247-25 | Requisitos      | MA       |
      | 529.982.247-25 | Testes          | MPA      |
      | 390.533.447-05 | Implementação   | MANA     |
    When I request the global assessment table
    Then the response status should be 200
    And the global assessment table should have students as rows
    And the global assessment table should have metas as columns
    And the global assessment table should include columns "Requisitos", "Testes", "Implementação", "Refatoração", and "Documentação"

  Scenario Outline: Setting an assessment for a student in a class for a specific meta
    Given a student exists with nome "Carla Mendes", cpf "168.995.350-09", and email "carla.mendes@example.com"
    And the class registry contains a class with topico "Clean Code", ano 2026, and semestre 1
    And this student is enrolled in this class
    When I set an assessment for this student in this class with meta "Testes" and conceito "<conceito>"
    Then the response status should be 201
    And the response body should include meta "Testes"
    And the response body should include conceito "<conceito>"

    Examples:
      | conceito |
      | MANA     |
      | MPA      |
      | MA       |

  Scenario: Updating an existing assessment changes the conceito
    Given a student exists with nome "Diego Alves", cpf "529.982.247-25", and email "diego.alves@example.com"
    And the class registry contains a class with topico "Backend APIs", ano 2026, and semestre 2
    And this student is enrolled in this class
    And an assessment exists for this student in this class with meta "Requisitos" and conceito "MANA"
    When I set an assessment for this student in this class with meta "Requisitos" and conceito "MA"
    Then the response status should be 200
    And the response body should include meta "Requisitos"
    And the response body should include conceito "MA"

  Scenario: Filtering the global assessment table by class
    Given a student exists with nome "Eduarda Silva", cpf "168.995.350-09", and email "eduarda.silva@example.com"
    And the class registry contains a class with topico "Frontend", ano 2026, and semestre 1
    And the class registry contains a class with topico "Backend", ano 2026, and semestre 2
    And this student is enrolled in class "Frontend"
    And this student is enrolled in class "Backend"
    And an assessment exists for this student in class "Frontend" with meta "Documentação" and conceito "MPA"
    And an assessment exists for this student in class "Backend" with meta "Documentação" and conceito "MANA"
    When I request the global assessment table filtered by turma "Frontend"
    Then the response status should be 200
    And the filtered global table should include only assessments from turma "Frontend"

  Scenario: Setting an invalid conceito must fail
    Given a student exists with nome "Felipe Rocha", cpf "390.533.447-05", and email "felipe.rocha@example.com"
    And the class registry contains a class with topico "DevOps", ano 2026, and semestre 2
    And this student is enrolled in this class
    When I set an assessment for this student in this class with meta "Refatoração" and conceito "INVALIDO"
    Then the response status should be 400
    And the response body should contain an error message mentioning invalid conceito

  Scenario: Setting an assessment for a student not enrolled in the class must fail
    Given a student exists with nome "Gabriela Nunes", cpf "168.995.350-09", and email "gabriela.nunes@example.com"
    And the class registry contains a class with topico "Arquitetura", ano 2026, and semestre 1
    And this student is not enrolled in this class
    When I set an assessment for this student in this class with meta "Implementação" and conceito "MPA"
    Then the response status should be 400
    And the response body should contain an error message indicating the student is not enrolled in the class
