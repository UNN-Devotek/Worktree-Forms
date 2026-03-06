/**
 * Dedicated DynamoDB client for the @auth/dynamodb-adapter.
 *
 * The auth table uses lowercase pk/sk keys (adapter requirement),
 * which conflicts with the main app table's PK/SK schema.
 * NEVER share this table with the main application data.
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.DYNAMODB_REGION ?? "us-east-1",
  ...(process.env.DYNAMODB_ENDPOINT && {
    endpoint: process.env.DYNAMODB_ENDPOINT,
  }),
});

export const authDocClient = DynamoDBDocument.from(client, {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
});

export const AUTH_TABLE_NAME =
  process.env.DYNAMODB_AUTH_TABLE_NAME ?? "worktree-auth-local";
