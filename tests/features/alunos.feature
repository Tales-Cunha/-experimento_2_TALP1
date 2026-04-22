# language: pt

Funcionalidade: Gerenciamento de Alunos

  Cenário: Listar alunos quando nenhum existe
    Dado não existe nenhum aluno cadastrado
    Entao a lista de alunos deve estar vazia

  Cenário: Cadastrar aluno com sucesso
    Dado não existe nenhum aluno cadastrado
    Quando o professor cadastra um aluno com nome "Carla Mendes", CPF "168.995.350-09" e email "carla@example.com"
    Entao o aluno deve aparecer na lista de alunos

  Cenário: Cadastrar aluno com CPF duplicado
    Dado existe um aluno com CPF "529.982.247-25"
    Quando o professor tenta cadastrar um aluno com o mesmo CPF
    Entao o sistema deve retornar erro de CPF duplicado

  Cenário: Editar nome do aluno
    Dado existe um aluno com CPF "390.533.447-05"
    Quando o professor edita o nome do aluno para "Felipe Editado"
    Entao o aluno deve aparecer na lista de alunos

  Cenário: Remover aluno
    Dado existe um aluno com CPF "051.961.079-24"
    Quando o professor remove o aluno
    Entao a lista de alunos deve estar vazia

  Cenário: Cadastrar aluno com CPF inválido
    Dado não existe nenhum aluno cadastrado
    Quando o professor cadastra um aluno com nome "Invalido", CPF "12345" e email "inv@example.com"
    Entao o sistema deve retornar erro de CPF inválido

  Cenário: Cadastrar aluno com nome vazio
    Dado não existe nenhum aluno cadastrado
    Quando o professor cadastra um aluno com nome "", CPF "168.995.350-09" e email "carla@example.com"
    Entao o sistema deve retornar erro de nome obrigatório

  Cenário: Cadastrar aluno com email inválido
    Dado não existe nenhum aluno cadastrado
    Quando o professor cadastra um aluno com nome "Carla", CPF "168.995.350-09" e email "carla-invalido"
    Entao o sistema deve retornar erro de email inválido

  Cenário: Editar aluno não existente
    Dado não existe nenhum aluno cadastrado
    Quando o professor tenta editar um aluno inexistente
    Entao o sistema deve retornar erro de aluno não encontrado
