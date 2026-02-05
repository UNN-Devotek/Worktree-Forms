import { expect, test, describe, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { getAuthenticatedDb } from "@/lib/auth-db";

const timestamp = Date.now();
// Ensure unique IDs
const userAId = `user_a_${timestamp}`;
const userBId = `user_b_${timestamp}`;
const projectAId = `proj_a_${timestamp}`;
const projectBId = `proj_b_${timestamp}`;

describe("RLS Integration", () => {
  beforeAll(async () => {
    // create users (User table has no RLS, so global db works)
    await db.user.createMany({
      data: [
        { id: userAId, email: `a_${timestamp}@test.com`, systemRole: "MEMBER" },
        { id: userBId, email: `b_${timestamp}@test.com`, systemRole: "MEMBER" },
      ],
    });

    // Create Project A (User A)
    const ctxUserA = getAuthenticatedDb(userAId);
    await ctxUserA.project.create({
      data: {
        id: projectAId,
        name: "Project A",
        slug: `proj-a-${timestamp}`,
        createdById: userAId,
        members: {
          create: { userId: userAId, roles: ["OWNER"] }
        }
      },
    });

    // Create Project B (User B)
    const ctxUserB = getAuthenticatedDb(userBId);
    await ctxUserB.project.create({
      data: {
        id: projectBId,
        name: "Project B",
        slug: `proj-b-${timestamp}`,
        createdById: userBId,
        members: {
          create: { userId: userBId, roles: ["OWNER"] }
        }
      },
    });

    // Create Forms
    // User A creates Form in Project A
    const ctxA = getAuthenticatedDb(userAId, projectAId);
    await ctxA.form.create({
      data: {
        slug: `form-a-${timestamp}`,
        title: "Form A",
        form_schema: {},
        projectId: projectAId,
      },
    });

    // User B creates Form in Project B
    const ctxB = getAuthenticatedDb(userBId, projectBId);
    await ctxB.form.create({
      data: {
        slug: `form-b-${timestamp}`,
        title: "Form B",
        form_schema: {},
        projectId: projectBId,
      },
    });
  });

  afterAll(async () => {
    // Cleanup with Owner Context (RLS Enabled)
    const ctxA = getAuthenticatedDb(userAId, projectAId);
    const ctxB = getAuthenticatedDb(userBId, projectBId);
    
    // Delete Projects (Cascades to Forms/Members)
    await ctxA.project.delete({ where: { id: projectAId } }).catch(e => console.error("Cleanup A failed", e));
    await ctxB.project.delete({ where: { id: projectBId } }).catch(e => console.error("Cleanup B failed", e));
    
    // Delete Users (Global DB bypasses RLS on User table? 
    // Wait, User table had no FORCE RLS, but db user triggers OWNER bypass anyway if no FORCE.
    // So db.user.delete works.)
    await db.user.deleteMany({ where: { id: { in: [userAId, userBId] } } }).catch(e => console.error("Cleanup Users failed", e));
  });

  test("User A cannot see Form B", async () => {
    const ctx = getAuthenticatedDb(userAId, projectAId);
    const forms = await ctx.form.findMany();
    
    const formTitles = forms.map(f => f.title);
    expect(formTitles).toContain("Form A");
    expect(formTitles).not.toContain("Form B");
  });

  test("User A cannot see Project B in list", async () => {
    const ctx = getAuthenticatedDb(userAId); 
    const projects = await ctx.project.findMany();
    
    const projectNames = projects.map(p => p.name);
    expect(projectNames).toContain("Project A");
    expect(projectNames).not.toContain("Project B");
  });
  
  // Note: Delete Project B attempt would fail.
  // Test "User A cannot DELETE Project B" requires error catch?
  // Not strictly necessary if visibility is verified.
});
