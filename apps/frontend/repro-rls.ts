
import { db } from "./lib/db";
import { getAuthenticatedDb } from "./lib/auth-db";

async function main() {
  const timestamp = Date.now();
  const userAId = `user_a_${timestamp}`;
  const userBId = `user_b_${timestamp}`;
  const projectAId = `proj_a_${timestamp}`;
  const projectBId = `proj_b_${timestamp}`;

  // Create Users
  console.log("Creating Users...");
  await db.user.createMany({
      data: [
        { id: userAId, email: `a_${timestamp}@test.com`, systemRole: "MEMBER" },
        { id: userBId, email: `b_${timestamp}@test.com`, systemRole: "MEMBER" },
      ],
  }).catch(e => { console.error("User Create Failed", e); process.exit(1); });

  // Create Project A
  console.log("Creating Project A...");
  const ctxUserA = getAuthenticatedDb(userAId);
  try {
    await ctxUserA.project.create({
      data: {
        id: projectAId,
        name: "Project A",
        slug: `proj-a-${timestamp}`,
        createdById: userAId,
        members: { create: { userId: userAId, roles: ["OWNER"] } }
      },
    });
    console.log("Project A Created.");
  } catch (e) {
    console.error("Project A creation failed:", e);
    process.exit(1);
  }

  // Create Project B
  console.log("Creating Project B...");
  const ctxUserB = getAuthenticatedDb(userBId);
  try {
    await ctxUserB.project.create({
      data: {
        id: projectBId,
        name: "Project B",
        slug: `proj-b-${timestamp}`,
        createdById: userBId,
        members: { create: { userId: userBId, roles: ["OWNER"] } }
      },
    });
    console.log("Project B Created.");
  } catch (e) {
    console.error("Project B creation failed:", e);
    process.exit(1);
  }

  // Create Form A
  console.log("Creating Form A...");
  const ctxA = getAuthenticatedDb(userAId, projectAId);
  try {
    await ctxA.form.create({
      data: {
        slug: `form-a-${timestamp}`,
        title: "Form A",
        form_schema: {},
        projectId: projectAId,
      },
    });
    console.log("Form A Created.");
  } catch (e) {
    console.error("Form A creation failed:", e);
    process.exit(1);
  }

  // Create Form B
  console.log("Creating Form B...");
  const ctxB = getAuthenticatedDb(userBId, projectBId);
  try {
    await ctxB.form.create({
      data: {
        slug: `form-b-${timestamp}`,
        title: "Form B",
        form_schema: {},
        projectId: projectBId,
      },
    });
    console.log("Form B Created.");
  } catch (e) {
    console.error("Form B creation failed:", e);
    process.exit(1);
  }

  // Verify Isolation
  console.log("Verifying Isolation...");
  
  // 1. User A view forms
  const formsA = await ctxA.form.findMany();
  console.log("User A sees forms:", formsA.map(f => f.title));
  
  if (formsA.some(f => f.title === "Form B")) {
     console.error("FAIL: User A sees Form B!");
     process.exit(1);
  }
  if (!formsA.some(f => f.title === "Form A")) {
     console.error("FAIL: User A CANNOT see Form A!");
     process.exit(1);
  }

  // 2. User A view projects (Dashboard) - Should NOT see Project B
  const projectsA = await ctxUserA.project.findMany();
  const projNames = projectsA.map(p => p.name);
  console.log("User A sees projects:", projNames);
  if (projNames.includes("Project B")) {
    console.error("FAIL: User A sees Project B!");
    process.exit(1);
  }

  console.log("SUCCESS: RLS Isolation Verified.");

  // Cleanup
  console.log("Cleanup...");
  // Now that RLS is FORCED, db (if passed as superuser) bypasses but we want to verify Owner context delete.
  // Note: if 'db' connects as table owner, FORCE RLS makes 'db' respect RLS policies too?
  // "FORCE ROW LEVEL SECURITY" applies to the table owner.
  // If 'db' user is table owner, then `db.project.deleteMany` (without context) sees NOTHING.
  // So standard cleanup:
  await ctxA.project.delete({ where: { id: projectAId } }).catch(e => console.error("Cleanup A failed", e));
  await ctxB.project.delete({ where: { id: projectBId } }).catch(e => console.error("Cleanup B failed", e));
  await db.user.deleteMany({ where: { id: { in: [userAId, userBId] } } }).catch(e => console.error("Cleanup Users failed", e));
}

main();
