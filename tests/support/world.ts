import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';

export class CustomWorld extends World {
  lastResponse: any = null;
  lastError: any = null;
  baseUrl: string;

  constructor(options: IWorldOptions) {
    super(options);
    this.baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3001';
  }
}

setWorldConstructor(CustomWorld);
