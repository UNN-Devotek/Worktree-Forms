import { describe, it, expect, beforeEach } from "vitest";
import { Entity } from "electrodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import {
  setupDynamoDBTests,
  getTestDocClient,
  TEST_TABLE,
} from "../../../../test/setup/dynamodb.js";

/**
 * Builds a ProjectMemberEntity wired to the test dynalite instance.
 * Mirrors the production entity schema in project-member.entity.ts exactly.
 */
function makeTestProjectMemberEntity(docClient: DynamoDBDocumentClient) {
  return new Entity(
    {
      model: {
        entity: "projectMember",
        version: "1",
        service: "worktree",
      },
      attributes: {
        projectId: { type: "string" as const, required: true },
        userId: { type: "string" as const, required: true },
        roles: {
          type: "list" as const,
          items: { type: "string" as const },
          default: () => ["VIEWER"],
        },
        invitedBy: { type: "string" as const },
        email: { type: "string" as const },
        joinedAt: {
          type: "string" as const,
          default: () => new Date().toISOString(),
        },
      },
      indexes: {
        primary: {
          pk: {
            field: "PK",
            composite: ["projectId"],
            template: "PROJECT#${projectId}",
          },
          sk: {
            field: "SK",
            composite: ["userId"],
            template: "MEMBER#${userId}",
          },
        },
        byUser: {
          index: "GSI1",
          pk: {
            field: "GSI1PK",
            composite: ["userId"],
            template: "USER#${userId}",
          },
          sk: {
            field: "GSI1SK",
            composite: ["projectId"],
            template: "PROJECT#${projectId}",
          },
        },
      },
    },
    { table: TEST_TABLE, client: docClient }
  );
}

setupDynamoDBTests();

describe("ProjectMemberEntity integration", () => {
  let MemberEntity: ReturnType<typeof makeTestProjectMemberEntity>;

  beforeEach(() => {
    const docClient = getTestDocClient();
    MemberEntity = makeTestProjectMemberEntity(docClient);
  });

  it("creates a project membership", async () => {
    const projectId = crypto.randomUUID();
    const userId = crypto.randomUUID();

    await MemberEntity.create({
      projectId,
      userId,
      roles: ["ADMIN"],
      email: "admin@test.com",
    }).go();

    const result = await MemberEntity.query
      .primary({ projectId })
      .go();
    expect(result.data).toHaveLength(1);
    expect(result.data[0].userId).toBe(userId);
    expect(result.data[0].roles).toEqual(["ADMIN"]);
  });

  it("queries all members of a project", async () => {
    const projectId = crypto.randomUUID();
    const user1 = crypto.randomUUID();
    const user2 = crypto.randomUUID();
    const user3 = crypto.randomUUID();

    await Promise.all([
      MemberEntity.create({
        projectId,
        userId: user1,
        roles: ["ADMIN"],
      }).go(),
      MemberEntity.create({
        projectId,
        userId: user2,
        roles: ["EDITOR"],
      }).go(),
      MemberEntity.create({
        projectId,
        userId: user3,
        roles: ["VIEWER"],
      }).go(),
    ]);

    const result = await MemberEntity.query
      .primary({ projectId })
      .go();
    expect(result.data).toHaveLength(3);

    const userIds = result.data.map((m) => m.userId).sort();
    expect(userIds).toEqual([user1, user2, user3].sort());
  });

  it("queries all projects for a user via GSI1", async () => {
    const userId = crypto.randomUUID();
    const proj1 = crypto.randomUUID();
    const proj2 = crypto.randomUUID();

    await Promise.all([
      MemberEntity.create({
        projectId: proj1,
        userId,
        roles: ["ADMIN"],
      }).go(),
      MemberEntity.create({
        projectId: proj2,
        userId,
        roles: ["VIEWER"],
      }).go(),
    ]);

    const result = await MemberEntity.query.byUser({ userId }).go();
    expect(result.data).toHaveLength(2);

    const projectIds = result.data.map((m) => m.projectId).sort();
    expect(projectIds).toEqual([proj1, proj2].sort());
  });

  it("applies default roles when none provided", async () => {
    const projectId = crypto.randomUUID();
    const userId = crypto.randomUUID();

    await MemberEntity.create({ projectId, userId }).go();

    const result = await MemberEntity.query
      .primary({ projectId })
      .go();
    expect(result.data[0].roles).toEqual(["VIEWER"]);
  });

  it("updates member roles", async () => {
    const projectId = crypto.randomUUID();
    const userId = crypto.randomUUID();

    await MemberEntity.create({
      projectId,
      userId,
      roles: ["VIEWER"],
    }).go();

    await MemberEntity.patch({ projectId, userId })
      .set({ roles: ["EDITOR", "VIEWER"] })
      .go();

    const result = await MemberEntity.query
      .primary({ projectId })
      .go();
    expect(result.data[0].roles).toEqual(["EDITOR", "VIEWER"]);
  });

  it("removes a member from a project", async () => {
    const projectId = crypto.randomUUID();
    const userId = crypto.randomUUID();

    await MemberEntity.create({ projectId, userId }).go();
    await MemberEntity.delete({ projectId, userId }).go();

    const result = await MemberEntity.query
      .primary({ projectId })
      .go();
    expect(result.data).toHaveLength(0);
  });

  it("tracks invitedBy and email metadata", async () => {
    const projectId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const inviterId = crypto.randomUUID();

    await MemberEntity.create({
      projectId,
      userId,
      invitedBy: inviterId,
      email: "invited@test.com",
    }).go();

    const result = await MemberEntity.query
      .primary({ projectId })
      .go();
    expect(result.data[0].invitedBy).toBe(inviterId);
    expect(result.data[0].email).toBe("invited@test.com");
    expect(result.data[0].joinedAt).toBeDefined();
  });

  it("isolates members between different projects", async () => {
    const proj1 = crypto.randomUUID();
    const proj2 = crypto.randomUUID();
    const user1 = crypto.randomUUID();
    const user2 = crypto.randomUUID();

    await Promise.all([
      MemberEntity.create({ projectId: proj1, userId: user1 }).go(),
      MemberEntity.create({ projectId: proj2, userId: user2 }).go(),
    ]);

    const proj1Members = await MemberEntity.query
      .primary({ projectId: proj1 })
      .go();
    const proj2Members = await MemberEntity.query
      .primary({ projectId: proj2 })
      .go();

    expect(proj1Members.data).toHaveLength(1);
    expect(proj1Members.data[0].userId).toBe(user1);
    expect(proj2Members.data).toHaveLength(1);
    expect(proj2Members.data[0].userId).toBe(user2);
  });
});
