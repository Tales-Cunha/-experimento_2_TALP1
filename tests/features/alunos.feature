# language: english

Feature: Student management
  As an instructor
  I want to manage students
  So that assessments can be recorded correctly

  Scenario: Listing students when none exist
    Given the student registry is empty
    When I request the list of students
    Then the response status should be 200
    And the response body should be an empty list

  Scenario: Listing students when some exist
    Given the student registry contains the following students:
      | nome        | cpf            | email                  |
      | Ana Souza   | 529.982.247-25 | ana.souza@example.com  |
      | Bruno Lima  | 390.533.447-05 | bruno.lima@example.com |
    When I request the list of students
    Then the response status should be 200
    And the response body should contain 2 students
    And the response body should include a student with cpf "529.982.247-25"
    And the response body should include a student with cpf "390.533.447-05"

  Scenario: Adding a student successfully
    Given the student registry is empty
    When I create a student with nome "Carla Mendes", cpf "168.995.350-09", and email "carla.mendes@example.com"
    Then the response status should be 201
    And the response body should include an "id"
    And the response body should include nome "Carla Mendes"
    And the response body should include cpf "168.995.350-09"
    And the response body should include email "carla.mendes@example.com"

  Scenario: Adding a student with a duplicate CPF must fail
    Given the student registry contains a student with nome "Diego Alves", cpf "529.982.247-25", and email "diego.alves@example.com"
    When I create a student with nome "Daniela Alves", cpf "529.982.247-25", and email "daniela.alves@example.com"
    Then the response status should be 409
    And the response body should contain an error message mentioning duplicate CPF

  Scenario: Adding a student with an invalid CPF format must fail
    Given the student registry is empty
    When I create a student with nome "Eduarda Silva", cpf "12345678900", and email "eduarda.silva@example.com"
    Then the response status should be 400
    And the response body should contain an error message mentioning invalid CPF format

  Scenario: Editing a student's information successfully
    Given the student registry contains a student with nome "Felipe Rocha", cpf "390.533.447-05", and email "felipe.rocha@example.com"
    When I update this student's nome to "Felipe Rocha Junior" and email to "felipe.jr@example.com"
    Then the response status should be 200
    And the response body should include nome "Felipe Rocha Junior"
    And the response body should include cpf "390.533.447-05"
    And the response body should include email "felipe.jr@example.com"

  Scenario: Removing a student successfully
    Given the student registry contains a student with nome "Gabriela Nunes", cpf "168.995.350-09", and email "gabriela.nunes@example.com"
    When I remove this student
    Then the response status should be 204
    And requesting the list of students should not include cpf "168.995.350-09"

  Scenario: Trying to remove a student that does not exist must fail
    Given no student exists with id "non-existent-student-id"
    When I remove the student with id "non-existent-student-id"
    Then the response status should be 404
    And the response body should contain an error message indicating the student was not found
