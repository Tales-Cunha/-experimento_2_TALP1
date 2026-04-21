import assert from 'node:assert/strict';

import { Before, Given, Then, When, type DataTable } from '@cucumber/cucumber';
import axios, { AxiosError, type AxiosResponse } from 'axios';

interface AlunoPayload {
  id?: string;
  nome: string;
  cpf: string;
  email: string;
}

interface ApiErrorBody {
  error?: string;
}

const api = axios.create({
  baseURL: 'http://localhost:3001',
  validateStatus: () => true,
});

let lastResponse: AxiosResponse<unknown> | null = null;
let currentStudentId: string | null = null;
let pendingRemovalStudentId: string | null = null;

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isRetryableConnectionError(error: unknown): boolean {
  if (!(error instanceof AxiosError)) {
    return false;
  }

  return error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET';
}

async function withConnectionRetry<T>(request: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 20; attempt += 1) {
    try {
      return await request();
    } catch (error: unknown) {
      if (!isRetryableConnectionError(error) || attempt === 20) {
        throw error;
      }

      lastError = error;
      await sleep(300);
    }
  }

  throw lastError;
}

Before(async () => {
  lastResponse = null;
  currentStudentId = null;
  pendingRemovalStudentId = null;

  await withConnectionRetry(async () => {
    await api.get('/api/health');
  });
});

function getLastResponse(): AxiosResponse<unknown> {
  assert.ok(lastResponse, 'Expected a response, but no request has been sent yet.');
  return lastResponse;
}

function getResponseBodyAsArray(response: AxiosResponse<unknown>): AlunoPayload[] {
  assert.ok(Array.isArray(response.data), 'Expected response body to be an array.');
  return response.data as AlunoPayload[];
}

function getResponseBodyAsObject(response: AxiosResponse<unknown>): Record<string, unknown> {
  assert.equal(typeof response.data, 'object', 'Expected response body to be an object.');
  assert.notEqual(response.data, null, 'Expected response body to be a non-null object.');
  return response.data as Record<string, unknown>;
}

async function createStudent(nome: string, cpf: string, email: string): Promise<AxiosResponse<unknown>> {
  return withConnectionRetry(async () => api.post('/api/alunos', { nome, cpf, email }));
}

Given('the student registry is empty', async () => {
  const response = await withConnectionRetry(async () => api.get('/api/alunos'));
  assert.equal(response.status, 200);

  const alunos = getResponseBodyAsArray(response);
  assert.equal(alunos.length, 0, 'Expected no students before scenario steps run.');
});

Given('the student registry contains the following students:', async (table: DataTable) => {
  const rows = table.hashes() as Array<{ nome: string; cpf: string; email: string }>;

  for (const row of rows) {
    const response = await createStudent(row.nome, row.cpf, row.email);
    assert.equal(response.status, 201, `Expected student ${row.cpf} creation to succeed.`);
  }
});

Given(
  'the student registry contains a student with nome {string}, cpf {string}, and email {string}',
  async (nome: string, cpf: string, email: string) => {
    const response = await createStudent(nome, cpf, email);
    assert.equal(response.status, 201);

    const body = getResponseBodyAsObject(response);
    assert.equal(typeof body.id, 'string', 'Expected created student to include id.');
    currentStudentId = body.id as string;
    pendingRemovalStudentId = currentStudentId;
  },
);

Given('no student exists with id {string}', async (id: string) => {
  pendingRemovalStudentId = id;

  const response = await withConnectionRetry(async () => api.get('/api/alunos'));
  assert.equal(response.status, 200);

  const alunos = getResponseBodyAsArray(response);
  const found = alunos.some((aluno) => aluno.id === id);
  assert.equal(found, false, `Expected student id ${id} to be absent.`);
});

When('I request the list of students', async () => {
  lastResponse = await withConnectionRetry(async () => api.get('/api/alunos'));
});

When(
  'I create a student with nome {string}, cpf {string}, and email {string}',
  async (nome: string, cpf: string, email: string) => {
    lastResponse = await createStudent(nome, cpf, email);

    if (lastResponse.status === 201) {
      const body = getResponseBodyAsObject(lastResponse);
      if (typeof body.id === 'string') {
        currentStudentId = body.id;
        pendingRemovalStudentId = body.id;
      }
    }
  },
);

When(
  'I update this student\'s nome to {string} and email to {string}',
  async (nome: string, email: string) => {
    assert.ok(currentStudentId, 'Expected current student id to be set before update.');

    lastResponse = await withConnectionRetry(async () =>
      api.put(`/api/alunos/${currentStudentId}`, { nome, email }),
    );
  },
);

When('I remove this student', async () => {
  const id = pendingRemovalStudentId ?? currentStudentId;
  assert.ok(id, 'Expected a student id to remove.');

  lastResponse = await withConnectionRetry(async () => api.delete(`/api/alunos/${id}`));
});

When('I remove the student with id {string}', async (id: string) => {
  lastResponse = await withConnectionRetry(async () => api.delete(`/api/alunos/${id}`));
});

Then('the response status should be {int}', (statusCode: number) => {
  const response = getLastResponse();
  assert.equal(response.status, statusCode);
});

Then('the response body should be an empty list', () => {
  const response = getLastResponse();
  const alunos = getResponseBodyAsArray(response);
  assert.equal(alunos.length, 0);
});

Then('the response body should contain {int} students', (count: number) => {
  const response = getLastResponse();
  const alunos = getResponseBodyAsArray(response);
  assert.equal(alunos.length, count);
});

Then('the response body should include a student with cpf {string}', (cpf: string) => {
  const response = getLastResponse();
  const alunos = getResponseBodyAsArray(response);
  const found = alunos.some((aluno) => aluno.cpf === cpf);
  assert.equal(found, true, `Expected CPF ${cpf} in response body.`);
});

Then('the response body should include an {string}', (fieldName: string) => {
  const response = getLastResponse();
  const body = getResponseBodyAsObject(response);

  assert.equal(
    fieldName in body,
    true,
    `Expected response body to include field ${fieldName}.`,
  );

  const fieldValue = body[fieldName];
  assert.notEqual(fieldValue, undefined, `Expected field ${fieldName} to be defined.`);

  if (fieldName === 'id') {
    assert.equal(typeof fieldValue, 'string', 'Expected id to be a string.');
    assert.notEqual((fieldValue as string).trim().length, 0, 'Expected id to be non-empty.');
  }
});

Then('the response body should include nome {string}', (nome: string) => {
  const response = getLastResponse();
  const body = getResponseBodyAsObject(response);
  assert.equal(body.nome, nome);
});

Then('the response body should include cpf {string}', (cpf: string) => {
  const response = getLastResponse();
  const body = getResponseBodyAsObject(response);
  assert.equal(body.cpf, cpf);
});

Then('the response body should include email {string}', (email: string) => {
  const response = getLastResponse();
  const body = getResponseBodyAsObject(response);
  assert.equal(body.email, email);
});

Then('the response body should contain an error message mentioning duplicate CPF', () => {
  const response = getLastResponse();
  const body = getResponseBodyAsObject(response) as ApiErrorBody;
  assert.equal(typeof body.error, 'string', 'Expected an error message string.');

  const matches = /cpf.*(already exists|duplicate)|duplicate.*cpf/i.test(body.error ?? '');
  assert.equal(matches, true, `Expected duplicate CPF message, got: ${body.error ?? 'undefined'}`);
});

Then('the response body should contain an error message mentioning invalid CPF format', () => {
  const response = getLastResponse();
  const body = getResponseBodyAsObject(response) as ApiErrorBody;
  assert.equal(typeof body.error, 'string', 'Expected an error message string.');

  const matches = /cpf.*(format|invalid)|format.*cpf|invalid.*cpf/i.test(body.error ?? '');
  assert.equal(matches, true, `Expected invalid CPF format message, got: ${body.error ?? 'undefined'}`);
});

Then('requesting the list of students should not include cpf {string}', async (cpf: string) => {
  const response = await withConnectionRetry(async () => api.get('/api/alunos'));
  assert.equal(response.status, 200);

  const alunos = getResponseBodyAsArray(response);
  const found = alunos.some((aluno) => aluno.cpf === cpf);
  assert.equal(found, false, `Expected CPF ${cpf} to be absent from registry.`);
});

Then('the response body should contain an error message indicating the student was not found', () => {
  const response = getLastResponse();
  const body = getResponseBodyAsObject(response) as ApiErrorBody;
  assert.equal(typeof body.error, 'string', 'Expected an error message string.');

  const matches = /(student\s+not\s+found|not\s+found|nao\s+encontrado|não\s+encontrado)/i.test(
    body.error ?? '',
  );
  assert.equal(matches, true, `Expected not found message, got: ${body.error ?? 'undefined'}`);
});
