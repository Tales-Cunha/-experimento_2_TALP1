import { Before } from '@cucumber/cucumber';
import { access, writeFile } from 'node:fs/promises';
import path from 'node:path';
import axios, { AxiosError } from 'axios';

const primaryDataFile = '/data/alunos.json';
const fallbackDataFile = path.resolve(__dirname, '../../data/alunos.json');

async function resetDataFile(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    await writeFile(filePath, '[]\n', 'utf-8');
    return true;
  } catch {
    return false;
  }
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isRetryableConnectionError(error: unknown): boolean {
  if (!(error instanceof AxiosError)) {
    return false;
  }

  return error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET';
}

async function waitForApiReady(): Promise<void> {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      const response = await axios.get('http://localhost:3001/api/health', {
        validateStatus: () => true,
      });

      if (response.status === 200) {
        return;
      }
    } catch (error: unknown) {
      if (!isRetryableConnectionError(error) || attempt === 30) {
        throw error;
      }
    }

    await sleep(250);
  }

  throw new Error('API did not become ready at http://localhost:3001/api/health');
}

Before(async () => {
  await waitForApiReady();

  const resetPrimary = await resetDataFile(primaryDataFile);

  if (!resetPrimary) {
    const resetFallback = await resetDataFile(fallbackDataFile);

    if (!resetFallback) {
      throw new Error(
        `Could not reset alunos.json in either ${primaryDataFile} or ${fallbackDataFile}`,
      );
    }
  }
});
