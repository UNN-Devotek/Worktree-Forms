"use server";

import { z } from "zod";
import {
  ProjectMemberEntity,
  UserEntity,
  InvitationEntity,
  ProjectEntity,
} from "@/lib/dynamo";
import { docClient, TABLE_NAME } from "@/lib/dynamo/client";
import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { auth } from "@/auth";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

// --- Schema ---

const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(["VIEWER", "EDITOR", "ADMIN"]).default("VIEWER"),
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
    role: formData.get("role") || "VIEWER",
    projectId: formData.get("projectId"),
  };

  const validated = inviteUserSchema.safeParse(rawData);

  if (!validated.success) {
    return { error: "Invalid input", details: validated.error.flatten() };
  }

  const { email, role, projectId } = validated.data;

  try {
    // 1. Check caller has ADMIN+ access
    const callerMembership = await ProjectMemberEntity.query.primary({
      projectId,
      userId: session.user.id,
    }).go();
    const callerRoles = callerMembership.data[0]?.roles ?? [];
    const hasAdmin = callerRoles.some((r) =>
      ["ADMIN", "OWNER"].includes(r)
    );
    if (!hasAdmin) {
      return { error: "Requires ADMIN role to invite users." };
    }

    // 2. Check if already invited (pending)
    const existing = await InvitationEntity.query.byEmail({ email }).go();
    const alreadyInvited = existing.data.find(
      (inv) => inv.projectId === projectId && inv.status === "PENDING"
    );
    if (alreadyInvited) {
      return { error: "User already has a pending invitation." };
    }

    // 3. Check if already a member
    const userResult = await UserEntity.query.byEmail({ email }).go();
    const existingUser = userResult.data[0];

    if (existingUser) {
      const memberResult = await ProjectMemberEntity.query.primary({
        projectId,
        userId: existingUser.userId,
      }).go();
      if (memberResult.data.length > 0) {
        return { error: "User is already a member of this project." };
      }
    }

    // 4. Create invitation
    const invitationId = nanoid();
    const token = nanoid(32);
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString(); // 7 days

    await InvitationEntity.create({
      invitationId,
      projectId,
      email,
      roles: [role],
      token,
      invitedBy: session.user.id,
      expiresAt,
      status: "PENDING",
    }).go();

    // Story 1-2: Send invitation email via SES/SMTP (deferred — invite link returned to caller)
    // const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;
    // await sendInvitationEmail({ email, token, projectId });

    revalidatePath(`/project/${projectId}/settings/users`);
    return { success: true, message: "Invitation sent!", invitationId, token };
  } catch (error) {
    console.error("Invite Error:", error);
    return { error: "Failed to send invitation." };
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
    return {
      error: "Unauthenticated",
      redirectTo: `/login?callbackUrl=/invite/${token}`,
    };
  }

  try {
    // Look up the current user to get their email
    const userResult = await UserEntity.query.primary({
      userId: session.user.id,
    }).go();
    const user = userResult.data[0];
    if (!user) {
      return { error: "User not found" };
    }

    // Find invitation by email GSI, then filter by token
    const invitations = await InvitationEntity.query
      .byEmail({ email: user.email })
      .go();
    const invitation = invitations.data.find(
      (inv) => inv.token === token && inv.status === "PENDING"
    );
    if (!invitation) {
      return { error: "Invalid or expired invitation" };
    }

    if (
      invitation.expiresAt &&
      new Date(invitation.expiresAt) < new Date()
    ) {
      return { error: "Invitation has expired" };
    }

    const now = new Date().toISOString();

    // Atomic: create membership + mark invitation accepted via TransactWrite
    await docClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            // Create project membership
            Put: {
              TableName: TABLE_NAME,
              Item: {
                PK: `PROJECT#${invitation.projectId}`,
                SK: `MEMBER#${session.user.id}`,
                GSI1PK: `USER#${session.user.id}`,
                GSI1SK: `PROJECT#${invitation.projectId}`,
                projectId: invitation.projectId,
                userId: session.user.id,
                roles: invitation.roles,
                email: user.email,
                joinedAt: now,
                __edb_e__: "projectMember",
                __edb_v__: "1",
              },
              ConditionExpression: "attribute_not_exists(SK)",
            },
          },
          {
            // Mark invitation as accepted
            Update: {
              TableName: TABLE_NAME,
              Key: {
                PK: `PROJECT#${invitation.projectId}`,
                SK: `INVITE#${invitation.invitationId}`,
              },
              UpdateExpression:
                "SET #status = :accepted, acceptedAt = :now",
              ConditionExpression: "#status = :pending",
              ExpressionAttributeNames: { "#status": "status" },
              ExpressionAttributeValues: {
                ":accepted": "ACCEPTED",
                ":pending": "PENDING",
                ":now": now,
              },
            },
          },
        ],
      })
    );

    // Get project slug for redirect
    const projectResult = await ProjectEntity.query
      .primary({ projectId: invitation.projectId })
      .go();
    const projectSlug = projectResult.data[0]?.slug;

    revalidatePath("/dashboard");
    return {
      success: true,
      projectSlug: projectSlug ?? invitation.projectId,
    };
  } catch (error) {
    console.error("Accept Invite Error", error);
    return {
      error:
        "Failed to accept invitation. You might already be a member.",
    };
  }
}

export async function revokeInvitation(
  invitationId: string,
  projectId: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  // Require ADMIN+ role to revoke invitations
  const callerMembership = await ProjectMemberEntity.query.primary({
    projectId,
    userId: session.user.id,
  }).go();
  const callerRoles = callerMembership.data[0]?.roles ?? [];
  const hasAdmin = callerRoles.some((r) => ["ADMIN", "OWNER"].includes(r));
  if (!hasAdmin) return { error: "Requires ADMIN role." };

  try {
    await InvitationEntity.patch({ projectId, invitationId })
      .set({ status: "REVOKED" })
      .go();
    revalidatePath(`/project/${projectId}/settings/users`);
    return { success: true };
  } catch (error) {
    console.error("Revoke Error:", error);
    return { error: "Failed to revoke invitation." };
  }
}

export async function getProjectInvitations(projectId: string, limit = 100) {
  const session = await auth();
  if (!session?.user?.id) return [];

  // Verify caller is a member of the project
  const membership = await ProjectMemberEntity.query.primary({
    projectId,
    userId: session.user.id,
  }).go();
  if (membership.data.length === 0) return [];

  const result = await InvitationEntity.query.primary({ projectId }).go({ limit });
  return result.data.filter((inv) => inv.status === "PENDING");
}
