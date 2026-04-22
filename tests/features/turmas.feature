# language: pt

Funcionalidade: Gerenciamento de Turmas

  Cenário: Criar turma
    Quando o professor cria uma turma de "Backend Architecture" no ano 2026 semestre 1
    Entao a turma deve aparecer na lista de turmas

  Cenário: Criar turma com semestre inválido
    Quando o professor tenta criar uma turma com semestre 3
    Entao o sistema deve retornar erro de semestre inválido

  Cenário: Matricular aluno na turma
    Dado existe um aluno com CPF "529.982.247-25"
    E existe uma turma de "Databases" no ano 2026 semestre 1
    Quando o professor matricula o aluno na turma
    Entao o aluno deve aparecer na lista de matriculados da turma

  Cenário: Remover aluno da turma
    Dado existe um aluno com CPF "390.533.447-05"
    E existe uma turma de "Algorithms" no ano 2026 semestre 2
    E o aluno "390.533.447-05" está matriculado na turma
    Quando o professor remove o aluno da turma
    Entao o aluno não deve aparecer na lista de matriculados da turma

  Cenário: Matricular aluno que não existe
    Dado existe uma turma de "API Design" no ano 2026 semestre 2
    Quando o professor matricula o aluno "non-existent-student-id" na turma
    Entao o sistema deve retornar erro de aluno não encontrado

  Cenário: Deletar turma com alunos matriculados
    Dado existe um aluno com CPF "529.982.247-25"
    E existe uma turma de "Computer Graphics" no ano 2026 semestre 1
    E o aluno "529.982.247-25" está matriculado na turma
    Quando o professor tenta deletar a turma
    Entao o sistema deve retornar erro de turma com alunos

  Cenário: Matricular o mesmo aluno duas vezes
    Dado existe um aluno com CPF "390.533.447-05"
    E existe uma turma de "Operating Systems" no ano 2026 semestre 2
    E o aluno "390.533.447-05" está matriculado na turma
    Quando o professor tenta matricular o aluno na turma novamente
    Entao o sistema deve retornar erro de aluno já matriculado
