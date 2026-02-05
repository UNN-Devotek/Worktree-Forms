"use server";

import { db } from "@/lib/database";
import { auth } from "@/auth"; 
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { ensureProjectBucket } from "@/lib/storage";

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
    const projects = await db.project.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        members: {
            where: {
                userId: session.user.id
            },
            select: {
                roles: true
            }
        },
        _count: {
            select: { members: true } 
        }
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
    console.log(`[getProjects] Found ${projects.length} projects for user ${session.user.id}`);
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
    const project = await db.project.findUnique({
      where: { slug },
      include: {
        members: {
          include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true
                }
            }
          }
        }
      }
    });

    if (!project) return null;

    // Check access
    // @ts-ignore: NextAuth types are tricky in dev
    const userId = session.user.id;
    // @ts-ignore
    const userRole = session.user.systemRole as string | undefined;

    const member = project.members.find(m => m.userId === userId);
    if (!member && userRole !== 'ADMIN') return null;

    return project;
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

  try {
    const project = await db.$transaction(async (tx) => {
      // 1. Create Project
      const p = await tx.project.create({
        data: {
          name: data.name,
          description: data.description,
          slug: slug,
          roles: {
            OWNER: ["*"], // Default full access role
            MEMBER: ["read", "write"],
            VIEWER: ["read"]
          },
          createdById: session!.user!.id!, // Required by schema
        },
      });

      // 2. Add Creator as Member with OWNER role
      await tx.projectMember.create({
        data: {
            projectId: p.id,
            userId: session!.user!.id!, // Safe because of check above
            roles: ["OWNER"]
        }
      });

      // 3. Reserve Storage Bucket Folder
      // We do this AFTER DB writes but within the transaction logic flow (though S3 isn't transactional)
      // Ideally, we'd do this inside the transaction, but if S3 fails, we want the DB to rollback.
      // However, Prisma transaction doesn't support async side effects easily that rollback.
      // Best pattern: Do distinct action, throw if fail.
      
      return p;
    });
    
    // Perform storage reservation outside the DB transaction to avoid holding locks
    // If this fails, we effectively have a project without a folder. 
    // We could compensate by deleting the project, or just let it exist and retry later.
    // For this story, we will fail hard if storage fails to ensure compliance.
    const storageResult = await ensureProjectBucket(project.id);
    if (!storageResult.success) {
        // Compensation: Delete the project we just created (Simplistic Saga)
        await db.project.delete({ where: { id: project.id } });
        throw new Error("Failed to reserve storage bucket. Project creation rolled back.");
    }

    revalidatePath("/dashboard");
    revalidatePath("/projects");
    return { data: project };
  } catch (error) {
    console.error("Failed to create project:", error);
    return { error: "Failed to create project" };
  }
}
