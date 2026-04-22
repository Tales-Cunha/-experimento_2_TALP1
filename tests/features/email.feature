# language: pt

Funcionalidade: Fila de Email e Envio Diário

  Cenário: Adicionar avaliação na fila e enviar email limpa a fila
    Dado o professor definiu avaliações para o aluno "577.049.488-30" hoje
    Quando o professor define a avaliação de "577.049.488-30" na meta "Requisitos" como "MA"
    Entao deve existir exatamente 1 entrada na fila de email para o aluno "577.049.488-30"
    Quando o job de envio de email diário é executado
    Entao o aluno "577.049.488-30" deve ter recebido exatamente 1 email
    E o email deve conter a avaliação da meta "Requisitos" com conceito "MA"
    E a fila de email deve estar vazia para o aluno "577.049.488-30"

  Cenário: Atualizar a avaliação substitui o conceito na fila e não duplica
    Dado o professor definiu avaliações para o aluno "255.145.739-40" hoje
    Quando o professor define a avaliação de "255.145.739-40" na meta "Testes" como "MPA"
    E o professor atualiza a mesma avaliação para "MA"
    Entao deve existir exatamente 1 entrada na fila de email para o aluno "255.145.739-40"
    Quando o job de envio de email diário é executado
    Entao o aluno "255.145.739-40" deve ter recebido exatamente 1 email
    E o email deve conter a avaliação da meta "Testes" com conceito "MA"
    E a fila de email deve estar vazia para o aluno "255.145.739-40"

  Cenário: Aluno matriculado em 3 turmas recebe um único email
    Dado o professor definiu avaliações para o aluno "872.528.809-15" em 3 turmas hoje
    Quando o professor define a avaliação de "872.528.809-15" na turma 1 meta "Requisitos" como "MA"
    E o professor define a avaliação de "872.528.809-15" na turma 2 meta "Testes" como "MPA"
    E o professor define a avaliação de "872.528.809-15" na turma 3 meta "Implementação" como "MANA"
    Entao deve existir exatamente 1 entrada na fila de email para o aluno "872.528.809-15"
    Quando o job de envio de email diário é executado
    Entao o aluno "872.528.809-15" deve ter recebido exatamente 1 email
    E o email deve conter a avaliação da meta "Requisitos" com conceito "MA"
    E o email deve conter a avaliação da meta "Testes" com conceito "MPA"
    E o email deve conter a avaliação da meta "Implementação" com conceito "MANA"

  Cenário: Nenhum email é enviado se não houve avaliações no dia
    Dado nenhum aluno foi avaliado hoje
    Quando o job de envio de email diário é executado
    Entao o aluno "518.082.544-06" deve ter recebido exatamente 0 email
