import { describe, it, expect, beforeEach } from "vitest";
import { Entity } from "electrodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import {
  setupDynamoDBTests,
  getTestDocClient,
  TEST_TABLE,
} from "../../../../../../../tests/setup/dynamodb.js";

/**
 * Builds a UserEntity wired to the test dynalite instance.
 * Mirrors the production entity schema in user.entity.ts exactly.
 */
function makeTestUserEntity(docClient: DynamoDBDocumentClient) {
  return new Entity(
    {
      model: { entity: "user", version: "1", service: "worktree" },
      attributes: {
        userId: { type: "string" as const, required: true },
        email: { type: "string" as const, required: true },
        name: { type: "string" as const },
        passwordHash: { type: "string" as const },
        avatarKey: { type: "string" as const },
        role: { type: "string" as const, default: "USER" },
        theme: { type: "string" as const, default: "system" },
        locale: { type: "string" as const, default: "en" },
        createdAt: {
          type: "string" as const,
          default: () => new Date().toISOString(),
        },
        updatedAt: {
          type: "string" as const,
          default: () => new Date().toISOString(),
        },
      },
      indexes: {
        primary: {
          pk: {
            field: "PK",
            composite: ["userId"],
            template: "USER#${userId}",
          },
          sk: { field: "SK", composite: [], template: "USER" },
        },
        byEmail: {
          index: "GSI1",
          pk: {
            field: "GSI1PK",
            composite: ["email"],
            template: "${email}",
          },
          sk: { field: "GSI1SK", composite: [], template: "USER" },
        },
      },
    },
    { table: TEST_TABLE, client: docClient }
  );
}

setupDynamoDBTests();

describe("UserEntity integration", () => {
  let UserEntity: ReturnType<typeof makeTestUserEntity>;

  beforeEach(() => {
    const docClient = getTestDocClient();
    UserEntity = makeTestUserEntity(docClient);
  });

  it("creates and retrieves a user by userId", async () => {
    const userId = crypto.randomUUID();
    const email = `test-${userId}@example.com`;

    await UserEntity.create({
      userId,
      email,
      name: "Test User",
    }).go();

    const result = await UserEntity.query.primary({ userId }).go();
    expect(result.data).toHaveLength(1);
    expect(result.data[0].email).toBe(email);
    expect(result.data[0].name).toBe("Test User");
    expect(result.data[0].role).toBe("USER");
    expect(result.data[0].theme).toBe("system");
    expect(result.data[0].locale).toBe("en");
  });

  it("finds user by email via GSI1 index", async () => {
    const userId = crypto.randomUUID();
    const email = `gsi-${userId}@example.com`;

    await UserEntity.create({
      userId,
      email,
      name: "GSI Test",
    }).go();

    const result = await UserEntity.query.byEmail({ email }).go();
    expect(result.data).toHaveLength(1);
    expect(result.data[0].userId).toBe(userId);
    expect(result.data[0].name).toBe("GSI Test");
  });

  it("updates user fields with patch", async () => {
    const userId = crypto.randomUUID();
    await UserEntity.create({
      userId,
      email: `update-${userId}@example.com`,
      name: "Original",
    }).go();

    await UserEntity.patch({ userId }).set({ name: "Updated Name" }).go();

    const result = await UserEntity.query.primary({ userId }).go();
    expect(result.data[0].name).toBe("Updated Name");
  });

  it("returns empty array for non-existent user", async () => {
    const result = await UserEntity.query
      .primary({ userId: "nonexistent-id" })
      .go();
    expect(result.data).toHaveLength(0);
  });

  it("applies default values on create", async () => {
    const userId = crypto.randomUUID();
    await UserEntity.create({
      userId,
      email: `defaults-${userId}@example.com`,
    }).go();

    const result = await UserEntity.query.primary({ userId }).go();
    const user = result.data[0];
    expect(user.role).toBe("USER");
    expect(user.theme).toBe("system");
    expect(user.locale).toBe("en");
    expect(user.createdAt).toBeDefined();
    expect(user.updatedAt).toBeDefined();
    // Timestamps should be valid ISO strings
    expect(() => new Date(user.createdAt!).toISOString()).not.toThrow();
  });

  it("stores and retrieves passwordHash and avatarKey", async () => {
    const userId = crypto.randomUUID();
    await UserEntity.create({
      userId,
      email: `hash-${userId}@example.com`,
      passwordHash: "$2b$10$abcdef1234567890",
      avatarKey: "avatars/user123.jpg",
    }).go();

    const result = await UserEntity.query.primary({ userId }).go();
    expect(result.data[0].passwordHash).toBe("$2b$10$abcdef1234567890");
    expect(result.data[0].avatarKey).toBe("avatars/user123.jpg");
  });

  it("deletes a user", async () => {
    const userId = crypto.randomUUID();
    await UserEntity.create({
      userId,
      email: `delete-${userId}@example.com`,
    }).go();

    await UserEntity.delete({ userId }).go();

    const result = await UserEntity.query.primary({ userId }).go();
    expect(result.data).toHaveLength(0);
  });
});
