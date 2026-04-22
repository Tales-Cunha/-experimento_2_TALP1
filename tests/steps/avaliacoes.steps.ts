import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'assert';
import { CustomWorld } from '../support/world';
import {
  setAvaliacao,
  getAvaliacoesByTurma,
  getAlunos,
  getTurmas,
  enrollAluno
} from '../support/apiHelpers';

async function safeApiCall(world: CustomWorld, apiCall: () => Promise<any>, successStatus = 200) {
  try {
    const data = await apiCall();
    world.lastResponse = { status: successStatus, data };
    world.lastError = null;
  } catch (error: any) {
    world.lastError = error;
    const match = error.message.match(/: (\d{3}) (.*)/);
    if (match) {
      world.lastResponse = { status: parseInt(match[1], 10), data: JSON.parse(match[2]) };
    } else {
      world.lastResponse = { status: 500, data: { error: error.message } };
    }
  }
}

Given('o aluno {string} está matriculado na turma {string}', async function (this: CustomWorld, cpf: string, turmaTopico: string) {
  const alunos = await getAlunos();
  const aluno = alunos.find((a: any) => a.cpf === cpf);
  assert(aluno, `Aluno with CPF ${cpf} not found`);

  const turmas = await getTurmas();
  const turma = turmas.find((t: any) => t.topico === turmaTopico);
  assert(turma, `Turma with topico ${turmaTopico} not found`);

  await safeApiCall(this, () => enrollAluno(turma.id, aluno.id), 200);
});

Given('a avaliação de {string} na meta {string} é {string}', async function (this: CustomWorld, cpf: string, meta: string, conceito: string) {
  const alunos = await getAlunos();
  const aluno = alunos.find((a: any) => a.cpf === cpf);
  assert(aluno, `Aluno with CPF ${cpf} not found`);

  const turma = this.lastCreatedTurma;
  assert(turma, 'No existing turma stored in context');

  await safeApiCall(this, () => setAvaliacao(aluno.id, turma.id, meta, conceito), 201);
});

When('o professor define a avaliação de {string} na meta {string} como {string}', async function (this: CustomWorld, cpf: string, meta: string, conceito: string) {
  const alunos = await getAlunos();
  const aluno = alunos.find((a: any) => a.cpf === cpf);
  assert(aluno, `Aluno with CPF ${cpf} not found`);

  const turma = this.lastCreatedTurma;
  assert(turma, 'No existing turma stored in context');

  await safeApiCall(this, () => setAvaliacao(aluno.id, turma.id, meta, conceito), 201);
  
  this.lastUsedMeta = meta;
  this.lastUsedAlunoId = aluno.id;
});

When('o professor atualiza a avaliação de {string} na meta {string} para {string}', async function (this: CustomWorld, cpf: string, meta: string, conceito: string) {
  const alunos = await getAlunos();
  const aluno = alunos.find((a: any) => a.cpf === cpf);
  assert(aluno, `Aluno with CPF ${cpf} not found`);

  const turma = this.lastCreatedTurma;
  assert(turma, 'No existing turma stored in context');

  await safeApiCall(this, () => setAvaliacao(aluno.id, turma.id, meta, conceito), 200); // 200 for update
});

When('o professor tenta definir a avaliação com conceito {string}', async function (this: CustomWorld, conceito: string) {
  const aluno = this.lastCreatedAluno;
  assert(aluno, 'No existing aluno stored in context');

  const turma = this.lastCreatedTurma;
  assert(turma, 'No existing turma stored in context');

  await safeApiCall(this, () => setAvaliacao(aluno.id, turma.id, 'Testes', conceito), 201);
});

When('o professor tenta avaliar um aluno não matriculado na turma', async function (this: CustomWorld) {
  const aluno = this.lastCreatedAluno;
  assert(aluno, 'No existing aluno stored in context');

  const turma = this.lastCreatedTurma;
  assert(turma, 'No existing turma stored in context');

  await safeApiCall(this, () => setAvaliacao(aluno.id, turma.id, 'Requisitos', 'MA'), 201);
});

Then('a avaliação de {string} na meta {string} deve ser {string}', async function (this: CustomWorld, cpf: string, meta: string, conceito: string) {
  const alunos = await getAlunos();
  const aluno = alunos.find((a: any) => a.cpf === cpf);
  assert(aluno, `Aluno with CPF ${cpf} not found`);

  const turma = this.lastCreatedTurma;
  assert(turma, 'No existing turma stored in context');

  await safeApiCall(this, () => getAvaliacoesByTurma(turma.id));
  assert.strictEqual(this.lastResponse.status, 200);

  const avaliacoes = this.lastResponse.data;
  const avaliacao = avaliacoes.find((av: any) => av.alunoId === aluno.id && av.meta === meta);
  
  assert(avaliacao, `Avaliacao not found for aluno ${cpf} and meta ${meta}`);
  assert.strictEqual(avaliacao.conceito, conceito, `Expected conceito ${conceito}, but got ${avaliacao.conceito}`);
});

Then('o sistema deve retornar erro de conceito inválido', async function (this: CustomWorld) {
  assert.strictEqual(this.lastResponse.status, 400, `Expected 400 but got ${this.lastResponse.status}`);
  assert(this.lastResponse.data.error, 'Expected an error message in the response');
});

Then('o sistema deve retornar erro de aluno não matriculado', async function (this: CustomWorld) {
  assert.strictEqual(this.lastResponse.status, 400, `Expected 400 but got ${this.lastResponse.status}`);
  assert(this.lastResponse.data.error, 'Expected an error message in the response');
});

When('o professor consulta as avaliações da turma', async function (this: CustomWorld) {
  const turma = this.lastCreatedTurma;
  assert(turma, 'No existing turma stored in context');

  await safeApiCall(this, () => getAvaliacoesByTurma(turma.id));
});

Then('o sistema deve retornar uma lista vazia de avaliações', async function (this: CustomWorld) {
  assert.strictEqual(this.lastResponse.status, 200, `Expected 200 but got ${this.lastResponse.status}`);
  assert(Array.isArray(this.lastResponse.data), 'Expected response data to be an array');
  assert.strictEqual(this.lastResponse.data.length, 0, 'Expected the array to be empty');
});
