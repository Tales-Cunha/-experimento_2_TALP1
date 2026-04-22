# language: pt

Funcionalidade: Gerenciamento de Avaliações

  Cenário: Definir avaliação
    Dado existe um aluno com CPF "529.982.247-25"
    E existe uma turma de "Databases" no ano 2026 semestre 1
    E o aluno "529.982.247-25" está matriculado na turma "Databases"
    Quando o professor define a avaliação de "529.982.247-25" na meta "Requisitos" como "MA"
    Entao a avaliação de "529.982.247-25" na meta "Requisitos" deve ser "MA"

  Cenário: Atualizar avaliação
    Dado existe um aluno com CPF "390.533.447-05"
    E existe uma turma de "Algorithms" no ano 2026 semestre 2
    E o aluno "390.533.447-05" está matriculado na turma "Algorithms"
    E a avaliação de "390.533.447-05" na meta "Testes" é "MANA"
    Quando o professor atualiza a avaliação de "390.533.447-05" na meta "Testes" para "MPA"
    Entao a avaliação de "390.533.447-05" na meta "Testes" deve ser "MPA"

  Cenário: Definir avaliação com conceito inválido
    Dado existe um aluno com CPF "168.995.350-09"
    E existe uma turma de "Clean Code" no ano 2026 semestre 1
    E o aluno "168.995.350-09" está matriculado na turma "Clean Code"
    Quando o professor tenta definir a avaliação com conceito "INVALIDO"
    Entao o sistema deve retornar erro de conceito inválido

  Cenário: Avaliar aluno não matriculado
    Dado existe um aluno com CPF "051.961.079-24"
    E existe uma turma de "API Design" no ano 2026 semestre 2
    Quando o professor tenta avaliar um aluno não matriculado na turma
    Entao o sistema deve retornar erro de aluno não matriculado

  Cenário: Definir todas as 5 metas para um aluno
    Dado existe um aluno com CPF "577.049.488-30"
    E existe uma turma de "Fullstack" no ano 2026 semestre 1
    E o aluno "577.049.488-30" está matriculado na turma "Fullstack"
    Quando o professor define a avaliação de "577.049.488-30" na meta "Requisitos" como "MA"
    E o professor define a avaliação de "577.049.488-30" na meta "Testes" como "MA"
    E o professor define a avaliação de "577.049.488-30" na meta "Implementação" como "MPA"
    E o professor define a avaliação de "577.049.488-30" na meta "Refatoração" como "MANA"
    E o professor define a avaliação de "577.049.488-30" na meta "Documentação" como "MA"
    Entao a avaliação de "577.049.488-30" na meta "Requisitos" deve ser "MA"
    E a avaliação de "577.049.488-30" na meta "Testes" deve ser "MA"
    E a avaliação de "577.049.488-30" na meta "Implementação" deve ser "MPA"
    E a avaliação de "577.049.488-30" na meta "Refatoração" deve ser "MANA"
    E a avaliação de "577.049.488-30" na meta "Documentação" deve ser "MA"

  Cenário: Consultar avaliações de uma turma sem avaliações
    Dado existe uma turma de "Empty Class" no ano 2026 semestre 2
    Quando o professor consulta as avaliações da turma
    Entao o sistema deve retornar uma lista vazia de avaliações
