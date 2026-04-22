import { Before } from '@cucumber/cucumber';
import { promises as fs } from 'fs';
import path from 'path';

Before(async function () {
  const dataDir = process.env.DATA_DIR;
  if (!dataDir) {
    throw new Error('DATA_DIR environment variable is not set');
  }

  const files = ['alunos.json', 'turmas.json', 'avaliacoes.json', 'emailQueue.json', 'sentEmails.json'];
  
  for (const file of files) {
    const filePath = path.join(dataDir, file);
    try {
      await fs.writeFile(filePath, '[]\n', 'utf-8');
    } catch (error) {
      console.error(`Could not reset file: ${filePath}`, error);
    }
  }
});
