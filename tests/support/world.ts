import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';

export class CustomWorld extends World {
  lastResponse: any = null;
  lastError: any = null;
  baseUrl: string;

  // Scenario-scoped state to prevent data leaking via this.parameters
  lastCreatedAluno: any = null;
  lastCreatedTurma: any = null;
  lastUsedMeta: string | null = null;
  lastUsedAlunoId: string | null = null;

  constructor(options: IWorldOptions) {
    super(options);
    this.baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3001';
  }
}

setWorldConstructor(CustomWorld);
