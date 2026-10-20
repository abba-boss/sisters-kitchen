import { DataSource } from 'typeorm';
import 'reflect-metadata';

// Test database configuration
export const testDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME ? `${process.env.DB_NAME}_test` : 'sisters_kitchen_test',
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
  await testDataSource.destroy();
});

// Clear data between tests
afterEach(async () => {
  const entities = testDataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = testDataSource.getRepository(entity.name);
    await repository.clear();
  }
});
