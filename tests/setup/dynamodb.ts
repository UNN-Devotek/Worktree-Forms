/**
 * Shared DynamoDB test infrastructure using dynalite.
 *
 * Starts an in-memory DynamoDB instance per test file (via vitest worker),
 * creates the single-table schema (PK/SK + GSI1), and exposes helpers
 * so integration tests can build ElectroDB entities against the test table.
 *
 * Usage:
 *   import { setupDynamoDBTests, getTestDocClient, TEST_TABLE } from "../../tests/setup/dynamodb";
 *   setupDynamoDBTests();
 *   // in beforeEach or test body:
 *   const docClient = getTestDocClient();
 */

import { beforeAll, afterAll, afterEach } from "vitest";
import { DynamoDBClient, CreateTableCommand, DeleteTableCommand, ResourceInUseException } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const dynalite = require("dynalite");

export const TEST_TABLE = "worktree-test";

let dynaliteServer: ReturnType<typeof dynalite>;
let testEndpoint: string;

/**
 * Returns a DynamoDBDocumentClient pointing at the in-memory dynalite instance.
 * Call only after setupDynamoDBTests() has run (i.e., inside beforeAll/beforeEach/test blocks).
 */
export function getTestDocClient(): DynamoDBDocumentClient {
  const client = new DynamoDBClient({
    endpoint: testEndpoint,
    region: "us-east-1",
    credentials: { accessKeyId: "local", secretAccessKey: "local" },
  });
  return DynamoDBDocumentClient.from(client);
}

/**
 * Returns the endpoint URL for the running dynalite instance.
 */
export function getTestEndpoint(): string {
  return testEndpoint;
}

/**
 * Creates the single-table with PK/SK + GSI1 (GSI1PK/GSI1SK).
 */
async function createTable(client: DynamoDBClient): Promise<void> {
  try {
    await client.send(
      new CreateTableCommand({
        TableName: TEST_TABLE,
        KeySchema: [
          { AttributeName: "PK", KeyType: "HASH" },
          { AttributeName: "SK", KeyType: "RANGE" },
        ],
        AttributeDefinitions: [
          { AttributeName: "PK", AttributeType: "S" },
          { AttributeName: "SK", AttributeType: "S" },
          { AttributeName: "GSI1PK", AttributeType: "S" },
          { AttributeName: "GSI1SK", AttributeType: "S" },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: "GSI1",
            KeySchema: [
              { AttributeName: "GSI1PK", KeyType: "HASH" },
              { AttributeName: "GSI1SK", KeyType: "RANGE" },
            ],
            Projection: { ProjectionType: "ALL" },
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5,
            },
          },
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      })
    );
  } catch (e: unknown) {
    if (!(e instanceof ResourceInUseException)) throw e;
  }
}

/**
 * Deletes and recreates the table to reset state between tests.
 */
async function resetTable(client: DynamoDBClient): Promise<void> {
  try {
    await client.send(new DeleteTableCommand({ TableName: TEST_TABLE }));
  } catch {
    // Table might not exist yet — that's fine
  }
  await createTable(client);
}

/**
 * Call at the top level of a describe() block to wire up dynalite lifecycle.
 * The dynalite server starts before all tests and stops after all tests.
 * The table is recreated (wiped) between each test for isolation.
 */
export function setupDynamoDBTests(): void {
  beforeAll(async () => {
    // Start dynalite on a random port
    dynaliteServer = dynalite({
      createTableMs: 0,
      deleteTableMs: 0,
      updateTableMs: 0,
    });

    await new Promise<void>((resolve) => {
      dynaliteServer.listen(0, () => {
        const port = dynaliteServer.address().port;
        testEndpoint = `http://localhost:${port}`;
        resolve();
      });
    });

    // Create the table once at startup
    const client = new DynamoDBClient({
      endpoint: testEndpoint,
      region: "us-east-1",
      credentials: { accessKeyId: "local", secretAccessKey: "local" },
    });
    await createTable(client);
  });

  afterEach(async () => {
    // Reset table between tests for isolation
    const client = new DynamoDBClient({
      endpoint: testEndpoint,
      region: "us-east-1",
      credentials: { accessKeyId: "local", secretAccessKey: "local" },
    });
    await resetTable(client);
  });

  afterAll(async () => {
    if (dynaliteServer?.listening) {
      await new Promise<void>((resolve) => {
        dynaliteServer.close(() => resolve());
      });
    }
  });
}
