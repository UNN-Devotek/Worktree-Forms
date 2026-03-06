"use server";

import { z } from "zod";
import { ProjectMemberEntity, UserEntity, PublicTokenEntity, ProjectEntity } from "@/lib/dynamo";
import { auth } from "@/auth";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

// --- Schema ---

const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.string().min(1),
  projectId: z.string().min(1),
});

// --- Actions ---

export async function inviteUser(_prevState: unknown, formData: FormData) {
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
    // First find user by email
    const userResult = await UserEntity.query.byEmail({ email }).go();
    const existingUser = userResult.data[0];

    if (existingUser) {
      // Check if this user is already a member of the project
      const memberResult = await ProjectMemberEntity.query.primary({ projectId }).go();
      const isMember = memberResult.data.some((m) => m.userId === existingUser.userId);
      if (isMember) {
        return { error: "User is already a member of this project." };
      }
    }

    // 2. Create Invitation token
    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await PublicTokenEntity.create({
      token,
      projectId,
      entityType: "INVITE",
      createdBy: session.user.id,
      expiresAt,
    }).go();

    // 3. Send Email (Mocked)
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;
    console.log(`[EMAIL MOCK] To: ${email}, Link: ${inviteLink}`);

    revalidatePath(`/project/${projectId}/settings/users`);
    return { success: true, message: "Invitation sent!" };
  } catch (error) {
    console.error("Invite Error:", error);
    return { error: "Failed to send invitation." };
  }
}

export async function revokeInvitation(invitationToken: string, projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await PublicTokenEntity.delete({ token: invitationToken }).go();
    revalidatePath(`/project/${projectId}/settings/users`);
    return { success: true };
  } catch (e) {
    return { error: "Failed to revoke" };
  }
}

export async function acceptInvite(token: string): Promise<{
  success?: boolean;
  projectSlug?: string;
  error?: string;
  redirectTo?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthenticated", redirectTo: `/login?callbackUrl=/invite/${token}` };
  }

  try {
    const tokenResult = await PublicTokenEntity.query.primary({ token }).go();
    const invitation = tokenResult.data[0];

    if (!invitation) return { error: "Invalid invitation" };
    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
      return { error: "Invitation expired" };
    }

    const projectId = invitation.projectId;
    if (!projectId) return { error: "Invalid invitation - no project" };

    // Add user as member
    await ProjectMemberEntity.create({
      projectId,
      userId: session.user.id,
      roles: ["MEMBER"],
    }).go();

    // Delete the invitation token
    await PublicTokenEntity.delete({ token }).go();

    // Get project slug for redirect
    const projectResult = await ProjectEntity.query.primary({ projectId }).go();
    const projectSlug = projectResult.data[0]?.slug;

    return { success: true, projectSlug: projectSlug ?? projectId };
  } catch (error) {
    console.error("Accept Invite Error", error);
    return { error: "Failed to accept invitation. You might already be a member." };
  }
}
