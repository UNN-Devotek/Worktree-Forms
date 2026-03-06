"use server";

import { ProjectEntity, ProjectMemberEntity, UserEntity } from "@/lib/dynamo";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { ensureProjectFolder } from "@/lib/storage";

export type ProjectData = {
  name: string;
  description?: string;
};

export async function getProjects() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  try {
    // 1. Get all project memberships for the user
    const memberships = await ProjectMemberEntity.query.byUser({ userId: session.user.id }).go();

    if (memberships.data.length === 0) {
      return [];
    }

    // 2. Fetch each project in parallel
    const projectResults = await Promise.all(
      memberships.data.map((m) =>
        ProjectEntity.query.primary({ projectId: m.projectId }).go()
      )
    );

    // 3. Also get member counts per project in parallel
    const memberCountResults = await Promise.all(
      memberships.data.map((m) =>
        ProjectMemberEntity.query.primary({ projectId: m.projectId }).go()
      )
    );

    // 4. Build a membership roles map and member counts map
    const rolesMap = new Map(memberships.data.map((m) => [m.projectId, m.roles]));
    const memberCountMap = new Map(
      memberCountResults.map((r, i) => [memberships.data[i].projectId, r.data.length])
    );

    // 5. Combine into result
    const projects = projectResults
      .flatMap((r) => r.data)
      .filter(Boolean)
      .map((p) => ({
        ...p,
        id: p.projectId,
        members: [{ roles: rolesMap.get(p.projectId) ?? [] }],
        _count: { members: memberCountMap.get(p.projectId) ?? 0 },
      }))
      .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));

    return projects;
  } catch (error) {
    console.error("Failed to get projects:", error);
    return [];
  }
}

export async function getProject(slug: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  try {
    // 1. Find project by slug
    const projectResult = await ProjectEntity.query.bySlug({ slug }).go();
    const project = projectResult.data[0];
    if (!project) return null;

    // 2. Get all members of this project
    const membersResult = await ProjectMemberEntity.query.primary({ projectId: project.projectId }).go();

    // 3. Check access
    const userId = session.user.id;
    const userRole = (session.user as Record<string, unknown>).systemRole as string | undefined;
    const member = membersResult.data.find((m) => m.userId === userId);
    if (!member && userRole !== "ADMIN") return null;

    // 4. Fetch user details for each member in parallel
    const userResults = await Promise.all(
      membersResult.data.map((m) => UserEntity.query.primary({ userId: m.userId }).go())
    );
    const userMap = new Map(
      userResults.map((r) => {
        const u = r.data[0];
        return u
          ? [u.userId, { id: u.userId, name: u.name ?? null, email: u.email, image: u.avatarKey ?? null }]
          : ["", null];
      })
    );

    // 5. Build response matching old shape
    return {
      ...project,
      id: project.projectId,
      members: membersResult.data.map((m) => ({
        userId: m.userId,
        projectId: m.projectId,
        roles: m.roles ?? [],
        user: userMap.get(m.userId) ?? { id: m.userId, name: null, email: m.email ?? "", image: null },
      })),
    };
  } catch (error) {
    console.error("Failed to get project:", error);
    return null;
  }
}

export async function createProject(data: ProjectData) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  // Generate URL-friendly slug: name-slugified + random 5 chars
  const baseSlug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const slug = `${baseSlug}-${nanoid(5)}`;
  const projectId = nanoid();

  try {
    // 1. Create Project
    await ProjectEntity.create({
      projectId,
      name: data.name,
      description: data.description,
      slug,
      ownerId: session.user.id,
    }).go();

    // 2. Add Creator as Member with OWNER role
    await ProjectMemberEntity.create({
      projectId,
      userId: session.user.id,
      roles: ["OWNER"],
    }).go();

    // 3. Reserve Storage Bucket Folder
    try {
      await ensureProjectFolder(projectId);
    } catch (storageError) {
      // Compensation: Delete the project we just created (Simplistic Saga)
      await ProjectEntity.delete({ projectId }).go();
      await ProjectMemberEntity.delete({ projectId, userId: session.user.id }).go();
      throw new Error("Failed to reserve storage folder. Project creation rolled back.");
    }

    revalidatePath("/dashboard");
    revalidatePath("/projects");
    return { data: { id: projectId, projectId, name: data.name, slug } };
  } catch (error) {
    console.error("Failed to create project:", error);
    return { error: "Failed to create project" };
  }
}
