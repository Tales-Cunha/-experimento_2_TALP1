import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'assert';
import { CustomWorld } from '../support/world';
import {
  createAluno,
  createTurma,
  enrollAluno,
  setAvaliacao,
  triggerEmailDigest,
  getAlunos
} from '../support/apiHelpers';
import { promises as fs } from 'fs';
import path from 'path';

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

Given('o professor definiu avaliações para o aluno {string} hoje', async function (this: CustomWorld, cpf: string) {
  // Create an Aluno and a Turma, then enroll them, so the system is ready to evaluate
  const nome = `Aluno ${cpf.replace(/\D/g, '')}`;
  const email = `aluno${cpf.replace(/\D/g, '')}@example.com`;
  const aluno = await createAluno({ nome, cpf, email });
  const turma = await createTurma({ topico: `Turma de Teste de Email ${Date.now()} ${Math.random()}`, ano: 2026, semestre: 1 });
  await enrollAluno(turma.id, aluno.id);

  this.lastCreatedAluno = aluno;
  this.lastCreatedTurma = turma;
});

When('o professor atualiza a mesma avaliação para {string}', async function (this: CustomWorld, conceito: string) {
  const meta = this.lastUsedMeta;
  const alunoId = this.lastUsedAlunoId;
  const turma = this.lastCreatedTurma;
  
  assert(meta, 'No last used meta found in context');
  assert(alunoId, 'No last used aluno found in context');
  assert(turma, 'No existing turma stored in context');

  await safeApiCall(this, () => setAvaliacao(alunoId, turma.id, meta, conceito), 200); // 200 for update
});

When('o job de envio de email diário é executado', async function (this: CustomWorld) {
  await safeApiCall(this, () => triggerEmailDigest(), 200);
});

Then('deve existir exatamente {int} entrada na fila de email para o aluno {string}', async function (this: CustomWorld, expectedCount: number, cpf: string) {
  const dataDir = process.env.DATA_DIR || '/data';
  const filePath = path.join(dataDir, 'emailQueue.json');
  
  let queue = [];
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    queue = JSON.parse(content);
  } catch (error) {
    // fine if it doesn't exist, queue is empty
  }

  const alunos = await getAlunos();
  const aluno = alunos.find((a: any) => a.cpf === cpf);
  assert(aluno, `Aluno with CPF ${cpf} not found`);

  const entriesForStudent = queue.filter((entry: any) => entry.alunoId === aluno.id);
  
  assert.strictEqual(entriesForStudent.length, expectedCount, `Expected ${expectedCount} entries, but found ${entriesForStudent.length}`);
});

Then('o aluno {string} deve ter recebido exatamente {int} email', async function (this: CustomWorld, cpf: string, expectedCount: number) {
  const dataDir = process.env.DATA_DIR || '/data';
  const filePath = path.join(dataDir, 'sentEmails.json');
  
  let sentEmails = [];
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    sentEmails = JSON.parse(content);
  } catch (error) {
    // fine if it doesn't exist, sentEmails is empty
  }

  const alunos = await getAlunos();
  const aluno = alunos.find((a: any) => a.cpf === cpf);
  assert(aluno, `Aluno with CPF ${cpf} not found`);

  const emailsForStudent = sentEmails.filter((email: any) => email.to === aluno.email);
  
  assert.strictEqual(emailsForStudent.length, expectedCount, `Expected ${expectedCount} emails, but found ${emailsForStudent.length}`);
});

Then('o email deve conter a avaliação da meta {string} com conceito {string}', async function (this: CustomWorld, meta: string, conceito: string) {
  const dataDir = process.env.DATA_DIR || '/data';
  const filePath = path.join(dataDir, 'sentEmails.json');
  
  let sentEmails = [];
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    sentEmails = JSON.parse(content);
  } catch (error) {
    assert.fail('sentEmails.json could not be read or is empty');
  }

  // Look at the latest email sent for the current test context
  const latestEmail = sentEmails[sentEmails.length - 1];
  assert(latestEmail, 'No emails have been sent');

  const expectedHtmlSubstring = `${meta}: <code>${conceito}</code>`;
  assert(
    latestEmail.html.includes(expectedHtmlSubstring), 
    `Expected email HTML to include "${expectedHtmlSubstring}", but it was: ${latestEmail.html}`
  );
});

Then('a fila de email deve estar vazia para o aluno {string}', async function (this: CustomWorld, cpf: string) {
  const dataDir = process.env.DATA_DIR || '/data';
  const filePath = path.join(dataDir, 'emailQueue.json');
  
  let queue = [];
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    queue = JSON.parse(content);
  } catch (error) {
    // fine if it doesn't exist, queue is empty
  }

  const alunos = await getAlunos();
  const aluno = alunos.find((a: any) => a.cpf === cpf);
  assert(aluno, `Aluno with CPF ${cpf} not found`);

  const entriesForStudent = queue.filter((entry: any) => entry.alunoId === aluno.id);
  
  assert.strictEqual(entriesForStudent.length, 0, `Expected email queue to be empty for student, but found ${entriesForStudent.length} entries`);
});

Given('o professor definiu avaliações para o aluno {string} em {int} turmas hoje', async function (this: CustomWorld, cpf: string, count: number) {
  const nome = `Aluno ${cpf.replace(/\D/g, '')}`;
  const email = `aluno${cpf.replace(/\D/g, '')}@example.com`;
  const aluno = await createAluno({ nome, cpf, email });
  this.lastCreatedAluno = aluno;
  
  this.parameters.turmas = [];
  for (let i = 1; i <= count; i++) {
    const turma = await createTurma({ topico: `Turma Multi ${i} ${Date.now()} ${Math.random()}`, ano: 2026, semestre: 1 });
    await enrollAluno(turma.id, aluno.id);
    this.parameters.turmas.push(turma);
  }
});

When('o professor define a avaliação de {string} na turma {int} meta {string} como {string}', async function (this: CustomWorld, cpf: string, index: number, meta: string, conceito: string) {
  const alunos = await getAlunos();
  const aluno = alunos.find((a: any) => a.cpf === cpf);
  assert(aluno, `Aluno with CPF ${cpf} not found`);

  const turma = this.parameters.turmas[index - 1];
  assert(turma, `No existing turma stored in context at index ${index - 1}`);

  await safeApiCall(this, () => setAvaliacao(aluno.id, turma.id, meta, conceito), 201);
});

Given('nenhum aluno foi avaliado hoje', async function (this: CustomWorld) {
  const cpf = '518.082.544-06';
  const nome = `Aluno ${cpf.replace(/\D/g, '')}`;
  const email = `aluno${cpf.replace(/\D/g, '')}@example.com`;
  const aluno = await createAluno({ nome, cpf, email });
  this.lastCreatedAluno = aluno;
});
