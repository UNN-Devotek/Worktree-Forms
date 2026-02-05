"use server";

import { z } from "zod";
import { db } from "@/lib/database";
import { auth } from "@/auth"; // Or your auth provider path
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

// --- Schema ---

const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.string().min(1),
  projectId: z.string().min(1),
});

// --- Actions ---

export async function inviteUser(_prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const rawData = {
    email: formData.get("email"),
    role: formData.get("role"),
    projectId: formData.get("projectId"),
  };

  const validated = inviteUserSchema.safeParse(rawData);

  if (!validated.success) {
    return { error: "Invalid input", details: validated.error.flatten() };
  }

  const { email, role, projectId } = validated.data;

  try {
    // 1. Check if user is already a member
    const existingMember = await db.projectMember.findFirst({
      where: {
        projectId,
        user: { email },
      },
    });

    if (existingMember) {
      return { error: "User is already a member of this project." };
    }

    // 2. Create Invitation
    // Use nanoid for a secure token
    const token = nanoid(32);
    // Expires in 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Upsert: If an invitation exists, update it with new token/role
    await db.invitation.upsert({
      where: {
        projectId_email: { projectId, email },
      },
      update: {
        token,
        roles: [role],
        expiresAt,
        inviterId: session.user.id,
      },
      create: {
        email,
        projectId,
        token,
        roles: [role],
        expiresAt,
        inviterId: session.user.id,
      },
    });

    // 3. Send Email (Mocked)
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;
    console.log(`[EMAIL MOCK] To: ${email}, Link: ${inviteLink}`);

    revalidatePath(`/project/${projectId}/settings/users`); // Adjust path as needed
    return { success: true, message: "Invitation sent!" };
  } catch (error) {
    console.error("Invite Error:", error);
    return { error: "Failed to send invitation." };
  }
}

export async function revokeInvitation(invitationId: string, projectId: string) {
    const session = await auth();
    // TODO: Check permissions (Owner/Admin)
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        await db.invitation.delete({
            where: { id: invitationId } // Ensure project filtering/ownership check in real app
        });
        revalidatePath(`/project/${projectId}/settings/users`);
        return { success: true };
    } catch(e) {
        return { error: "Failed to revoke" };
    }
}

export async function acceptInvite(token: string) {
    const session = await auth();
    // User must be logged in to accept? Or we guide them to signup?
    // Story says "Link to existing user OR prompt signup".
    // For now, assume they must be logged in or we redirect to login with callback.
    
    if (!session?.user?.id) {
        return { error: "Unauthenticated", redirectTo: `/login?callbackUrl=/invite/${token}` };
    }

    try {
        const invitation = await db.invitation.findUnique({
            where: { token },
            include: { project: true }
        });

        if (!invitation) return { error: "Invalid invitation" };
        if (invitation.expiresAt < new Date()) return { error: "Invitation expired" };

        // Transaction: Join Project + Delete Invite
        await db.$transaction([
            db.projectMember.create({
                data: {
                    projectId: invitation.projectId,
                    userId: session.user.id,
                    roles: invitation.roles
                }
            }),
            db.invitation.delete({
                where: { id: invitation.id }
            })
        ]);

        return { success: true, projectSlug: invitation.project.slug };

    } catch (error) {
        console.error("Accept Invite Error", error);
        return { error: "Failed to accept invitation. You might already be a member." };
    }
}
