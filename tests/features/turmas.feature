# language: en

Feature: Class management
  As an instructor
  I want to manage classes and enrollments
  So that students can be organized correctly

  Scenario: Listing all classes
    Given the class registry contains the following classes:
      | topico                | ano  | semestre |
      | Web Development       | 2026 | 1        |
      | Software Testing      | 2026 | 2        |
    When I request the list of classes
    Then the response status should be 200
    And the response body should contain 2 classes
    And the response body should include a class with topico "Web Development"
    And the response body should include a class with topico "Software Testing"

  Scenario: Creating a class with topico, ano, and semestre
    Given the class registry is empty
    When I create a class with topico "Backend Architecture", ano 2026, and semestre 1
    Then the response status should be 201
    And the response body should include an "id"
    And the response body should include topico "Backend Architecture"
    And the response body should include ano 2026
    And the response body should include semestre 1

  Scenario: Editing a class
    Given the class registry contains a class with topico "Frontend Fundamentals", ano 2026, and semestre 1
    When I update this class topico to "Advanced Frontend" and semestre to 2
    Then the response status should be 200
    And the response body should include topico "Advanced Frontend"
    And the response body should include ano 2026
    And the response body should include semestre 2

  Scenario: Deleting a class
    Given the class registry contains a class with topico "DevOps Essentials", ano 2026, and semestre 2
    When I remove this class
    Then the response status should be 204
    And requesting the list of classes should not include topico "DevOps Essentials"

  Scenario: Enrolling an existing student in a class
    Given a student exists with nome "Ana Souza", cpf "529.982.247-25", and email "ana.souza@example.com"
    And the class registry contains a class with topico "Databases", ano 2026, and semestre 1
    When I enroll this student in this class
    Then the response status should be 200
    And the class detail should include the student with cpf "529.982.247-25"

  Scenario: Removing a student from a class
    Given a student exists with nome "Bruno Lima", cpf "390.533.447-05", and email "bruno.lima@example.com"
    And the class registry contains a class with topico "Algorithms", ano 2026, and semestre 2
    And this student is enrolled in this class
    When I remove this student from this class
    Then the response status should be 200
    And the class detail should not include the student with cpf "390.533.447-05"

  Scenario: Viewing class detail showing enrolled students
    Given a student exists with nome "Carla Mendes", cpf "168.995.350-09", and email "carla.mendes@example.com"
    And a student exists with nome "Diego Alves", cpf "529.982.247-25", and email "diego.alves@example.com"
    And the class registry contains a class with topico "Clean Code", ano 2026, and semestre 1
    And both students are enrolled in this class
    When I request this class detail
    Then the response status should be 200
    And the class detail should include 2 enrolled students
    And the class detail should include the student with cpf "168.995.350-09"
    And the class detail should include the student with cpf "529.982.247-25"

  Scenario: Enrolling a student that does not exist must fail
    Given no student exists with id "non-existent-student-id"
    And the class registry contains a class with topico "API Design", ano 2026, and semestre 2
    When I enroll the student with id "non-existent-student-id" in this class
    Then the response status should be 404
    And the response body should contain an error message indicating the student was not found

  Scenario: Creating a class with semestre other than 1 or 2 must fail
    Given the class registry is empty
    When I create a class with topico "Security", ano 2026, and semestre 3
    Then the response status should be 400
    And the response body should contain an error message mentioning invalid semestre
