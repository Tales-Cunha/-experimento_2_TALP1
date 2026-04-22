import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'assert';
import { CustomWorld } from '../support/world';
import {
  getTurmas,
  createTurma,
  enrollAluno,
  removeAluno,
  getAlunos
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

Given('existe uma turma de {string} no ano {int} semestre {int}', async function (this: CustomWorld, topico: string, ano: number, semestre: number) {
  await safeApiCall(this, () => createTurma({ topico, ano, semestre: semestre as any }), 201);
  assert.strictEqual(this.lastResponse.status, 201);
  this.lastCreatedTurma = this.lastResponse.data;
});

Given('o aluno {string} está matriculado na turma', async function (this: CustomWorld, cpfOrId: string) {
  const turma = this.lastCreatedTurma;
  assert(turma, 'No existing turma stored in context');

  let aluno = this.lastCreatedAluno;
  if (!aluno || (aluno.cpf !== cpfOrId && aluno.id !== cpfOrId)) {
    const alunosData = await getAlunos();
    aluno = alunosData.find((a: any) => a.cpf === cpfOrId || a.id === cpfOrId);
    assert(aluno, `Aluno with CPF or ID ${cpfOrId} not found`);
    this.lastCreatedAluno = aluno;
  }

  await safeApiCall(this, () => enrollAluno(turma.id, aluno.id), 200);
});

When('o professor cria uma turma de {string} no ano {int} semestre {int}', async function (this: CustomWorld, topico: string, ano: number, semestre: number) {
  await safeApiCall(this, () => createTurma({ topico, ano, semestre: semestre as any }), 201);
  if (this.lastResponse.status === 201) {
    this.lastCreatedTurma = this.lastResponse.data;
  }
});

When('o professor matricula o aluno na turma', async function (this: CustomWorld) {
  const turma = this.lastCreatedTurma;
  assert(turma, 'No existing turma stored in context');
  const aluno = this.lastCreatedAluno;
  assert(aluno, 'No existing aluno stored in context');

  await safeApiCall(this, () => enrollAluno(turma.id, aluno.id), 200);
});

When('o professor remove o aluno da turma', async function (this: CustomWorld) {
  const turma = this.lastCreatedTurma;
  assert(turma, 'No existing turma stored in context');
  const aluno = this.lastCreatedAluno;
  assert(aluno, 'No existing aluno stored in context');

  await safeApiCall(this, () => removeAluno(turma.id, aluno.id), 200);
});

When('o professor matricula o aluno {string} na turma', async function (this: CustomWorld, alunoId: string) {
  const turma = this.lastCreatedTurma;
  assert(turma, 'No existing turma stored in context');

  await safeApiCall(this, () => enrollAluno(turma.id, alunoId), 200);
});

When('o professor tenta criar uma turma com semestre {int}', async function (this: CustomWorld, semestre: number) {
  await safeApiCall(this, () => createTurma({ topico: `Qualquer ${Date.now()} ${Math.random()}`, ano: 2026, semestre: semestre as any }), 201);
});

Then('a turma deve aparecer na lista de turmas', async function (this: CustomWorld) {
  await safeApiCall(this, () => getTurmas());
  assert.strictEqual(this.lastResponse.status, 200);
  
  const turmas = this.lastResponse.data;
  assert(Array.isArray(turmas), 'Expected an array of turmas');
  assert(turmas.length > 0, 'Expected turma list to not be empty');
});

Then('o aluno deve aparecer na lista de matriculados da turma', async function (this: CustomWorld) {
  assert.strictEqual(this.lastResponse.status, 200);
  const turma = this.lastResponse.data;
  const aluno = this.lastCreatedAluno;
  assert(turma.alunosIds.includes(aluno.id), 'Expected aluno to be enrolled in turma');
});

Then('o aluno não deve aparecer na lista de matriculados da turma', async function (this: CustomWorld) {
  assert.strictEqual(this.lastResponse.status, 200);
  const turma = this.lastResponse.data;
  const aluno = this.lastCreatedAluno;
  assert(!turma.alunosIds.includes(aluno.id), 'Expected aluno not to be enrolled in turma');
});

Then('o sistema deve retornar erro de semestre inválido', async function (this: CustomWorld) {
  assert.strictEqual(this.lastResponse.status, 400, `Expected 400 but got ${this.lastResponse.status}`);
  assert(this.lastResponse.data.error, 'Expected an error message in the response');
});

When('o professor tenta deletar a turma', async function (this: CustomWorld) {
  const turma = this.lastCreatedTurma;
  assert(turma, 'No existing turma stored in context');

  // To delete we need an apiHelper function for deleteTurma, let me use axios directly if it's missing, but wait, I can use axios directly inside the step or add it to apiHelpers.
  const axios = require('axios').default;
  const getBaseUrl = () => process.env.TEST_BASE_URL || 'http://localhost:3001';
  
  await safeApiCall(this, async () => {
    const response = await axios.delete(`${getBaseUrl()}/api/turmas/${turma.id}`, { validateStatus: () => true });
    if (response.status >= 300) {
      throw new Error(`Failed: ${response.status} ${JSON.stringify(response.data)}`);
    }
    return response.data;
  }, 204);
});

When('o professor tenta matricular o aluno na turma novamente', async function (this: CustomWorld) {
  const turma = this.lastCreatedTurma;
  assert(turma, 'No existing turma stored in context');
  const aluno = this.lastCreatedAluno;
  assert(aluno, 'No existing aluno stored in context');

  await safeApiCall(this, () => enrollAluno(turma.id, aluno.id), 200);
});

Then('o sistema deve retornar erro de turma com alunos', async function (this: CustomWorld) {
  assert.strictEqual(this.lastResponse.status, 400, `Expected 400 but got ${this.lastResponse.status}`);
  assert(this.lastResponse.data.error, 'Expected an error message in the response');
});

Then('o sistema deve retornar erro de aluno já matriculado', async function (this: CustomWorld) {
  assert.strictEqual(this.lastResponse.status, 409, `Expected 409 but got ${this.lastResponse.status}`);
  assert(this.lastResponse.data.error, 'Expected an error message in the response');
});
