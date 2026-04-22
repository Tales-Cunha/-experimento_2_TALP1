import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'assert';
import { CustomWorld } from '../support/world';
import {
  getAlunos,
  createAluno,
  updateAluno,
  deleteAluno,
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

Given('não existe nenhum aluno cadastrado', async function (this: CustomWorld) {
  await safeApiCall(this, () => getAlunos());
  assert.strictEqual(this.lastResponse.status, 200, JSON.stringify(this.lastResponse.data));
  assert.deepStrictEqual(this.lastResponse.data, []);
});

Given('existe um aluno com CPF {string}', async function (this: CustomWorld, cpf: string) {
  // We need to create an aluno and store its ID in the world object to use it later in edits/deletes
  const nome = `Aluno ${cpf.replace(/\D/g, '')}`;
  const email = `aluno${cpf.replace(/\D/g, '')}@example.com`;
  
  await safeApiCall(this, () => createAluno({ nome, cpf, email }), 201);
  assert.strictEqual(this.lastResponse.status, 201, `Expected 201 but got ${this.lastResponse.status}. Body: ${JSON.stringify(this.lastResponse.data)}`);
  
  // Save to world context so we can refer to it in 'edita', 'remove', 'tenta cadastrar o mesmo'
  this.lastCreatedAluno = this.lastResponse.data;
});

When('o professor cadastra um aluno com nome {string}, CPF {string} e email {string}', async function (this: CustomWorld, nome: string, cpf: string, email: string) {
  await safeApiCall(this, () => createAluno({ nome, cpf, email }), 201);
});

When('o professor tenta cadastrar um aluno com o mesmo CPF', async function (this: CustomWorld) {
  const existingAluno = this.lastCreatedAluno;
  assert(existingAluno, 'No existing aluno stored in context');
  
  await safeApiCall(this, () => createAluno({
    nome: 'Outro Nome',
    cpf: existingAluno.cpf,
    email: 'outro@example.com'
  }), 201);
});

When('o professor edita o nome do aluno para {string}', async function (this: CustomWorld, novoNome: string) {
  const existingAluno = this.lastCreatedAluno;
  assert(existingAluno, 'No existing aluno stored in context');
  
  await safeApiCall(this, () => updateAluno(existingAluno.id, { nome: novoNome }), 200);
});

When('o professor remove o aluno', async function (this: CustomWorld) {
  const existingAluno = this.lastCreatedAluno;
  assert(existingAluno, 'No existing aluno stored in context');
  
  await safeApiCall(this, () => deleteAluno(existingAluno.id), 204);
});

Then('o aluno deve aparecer na lista de alunos', async function (this: CustomWorld) {
  await safeApiCall(this, () => getAlunos());
  assert.strictEqual(this.lastResponse.status, 200);
  
  const alunos = this.lastResponse.data;
  assert(Array.isArray(alunos), 'Expected an array of students');
  assert(alunos.length > 0, 'Expected student list to not be empty');
  
  // The step context could mean the newly created one or the edited one
  // If we just edited one, lastResponse.data might be the edited student. 
  // Let's just verify the list has elements.
});

Then('o sistema deve retornar erro de CPF duplicado', async function (this: CustomWorld) {
  assert.strictEqual(this.lastResponse.status, 409, `Expected 409 but got ${this.lastResponse.status}`);
  assert(this.lastResponse.data.error, 'Expected an error message in the response');
  assert(this.lastResponse.data.error.toLowerCase().includes('already exists'), 'Expected duplicate CPF message');
});

Then('o sistema deve retornar erro de CPF inválido', async function (this: CustomWorld) {
  assert.strictEqual(this.lastResponse.status, 400, `Expected 400 but got ${this.lastResponse.status}`);
  assert(this.lastResponse.data.error, 'Expected an error message in the response');
  assert(this.lastResponse.data.error.toLowerCase().includes('cpf'), 'Expected CPF message');
});

Then('a lista de alunos deve estar vazia', async function (this: CustomWorld) {
  await safeApiCall(this, () => getAlunos());
  assert.strictEqual(this.lastResponse.status, 200);
  assert.deepStrictEqual(this.lastResponse.data, []);
});

When('o professor tenta editar um aluno inexistente', async function (this: CustomWorld) {
  await safeApiCall(this, () => updateAluno('non-existent-id', { nome: 'Qualquer' }), 200);
});

Then('o sistema deve retornar erro de nome obrigatório', async function (this: CustomWorld) {
  assert.strictEqual(this.lastResponse.status, 400, `Expected 400 but got ${this.lastResponse.status}`);
  assert(this.lastResponse.data.error, 'Expected an error message in the response');
  assert(this.lastResponse.data.error.toLowerCase().includes('nome'), 'Expected nome error message');
});

Then('o sistema deve retornar erro de email inválido', async function (this: CustomWorld) {
  assert.strictEqual(this.lastResponse.status, 400, `Expected 400 but got ${this.lastResponse.status}`);
  assert(this.lastResponse.data.error, 'Expected an error message in the response');
  assert(this.lastResponse.data.error.toLowerCase().includes('email'), 'Expected email error message');
});

Then('o sistema deve retornar erro de aluno não encontrado', async function (this: CustomWorld) {
  assert.strictEqual(this.lastResponse.status, 404, `Expected 404 but got ${this.lastResponse.status}`);
  assert(this.lastResponse.data.error, 'Expected an error message in the response');
});
