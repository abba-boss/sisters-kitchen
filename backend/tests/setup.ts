import { DataSource } from 'typeorm';
import 'reflect-metadata';

// Test database configuration — in-memory SQLite to match the app's real DB (SQLite),
// so tests run without an external MySQL server.
export const testDataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:',
  entities: ['src/entities/**/*.ts'],
  synchronize: true, // OK for test database
  dropSchema: true, // Clean slate for each test run
  logging: false,
});

// Setup before all tests
beforeAll(async () => {
  await testDataSource.initialize();
});

// Cleanup after all tests
afterAll(async () => {
  if (testDataSource.isInitialized) {
    await testDataSource.destroy();
  }
});

// Clear data between tests
afterEach(async () => {
  if (!testDataSource.isInitialized) return;
  // Disable FK enforcement while clearing so table order doesn't matter.
  await testDataSource.query("PRAGMA foreign_keys = OFF");
  const entities = testDataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = testDataSource.getRepository(entity.name);
    await repository.clear();
  }
  await testDataSource.query("PRAGMA foreign_keys = ON");
});
