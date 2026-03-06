import { ProjectEntity, ProjectMemberEntity, UserEntity, PublicTokenEntity } from "@/lib/dynamo";
import { notFound } from "next/navigation";
import { InviteUserDialog } from "@/features/projects/components/settings/invite-user-dialog";
import { UserListTable } from "@/features/projects/components/settings/user-list-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProjectUsersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // 1. Get Project by slug
  const projectResult = await ProjectEntity.query.bySlug({ slug }).go();
  const project = projectResult.data[0];
  if (!project) return notFound();

  // 2. Get members with user details
  const membersResult = await ProjectMemberEntity.query.primary({ projectId: project.projectId }).go();

  const userResults = await Promise.all(
    membersResult.data.map((m) => UserEntity.query.primary({ userId: m.userId }).go())
  );
  const userMap = new Map(
    userResults.map((r) => {
      const u = r.data[0];
      return [u?.userId ?? "", u];
    })
  );

  const members = membersResult.data.map((m) => {
    const u = userMap.get(m.userId);
    return {
      userId: m.userId,
      projectId: m.projectId,
      roles: m.roles ?? [],
      user: u
        ? { id: u.userId, name: u.name ?? null, email: u.email, image: u.avatarKey ?? null }
        : { id: m.userId, name: null, email: m.email ?? "", image: null },
    };
  });

  // 3. Get pending invitations (stored as PublicTokens for this project)
  // Note: PublicTokenEntity is keyed by token, not by project. We cannot efficiently
  // query by projectId without a GSI. For now, pass empty invitations.
  const invitations: Array<{
    id: string;
    email: string;
    roles: string[];
    expiresAt: string;
    inviter: { name: string | null; email: string };
  }> = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage members and pending invitations for {project.name}.
          </p>
        </div>
        <InviteUserDialog projectId={project.projectId} />
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
                People with access to this project.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <UserListTable
                projectId={project.projectId}
                members={members}
                invitations={invitations}
            />
        </CardContent>
      </Card>
    </div>
  );
}
