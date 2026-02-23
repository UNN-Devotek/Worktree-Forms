import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { InviteUserDialog } from "@/features/projects/components/settings/invite-user-dialog";
import { UserListTable } from "@/features/projects/components/settings/user-list-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProjectUsersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // 1. Get Project ID from Slug
  const project = await db.project.findUnique({
    where: { slug },
    include: {
        members: {
            include: { user: true }
        },
        invitations: {
            include: { inviter: true }
        }
    }
  });

  if (!project) return notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage members and pending invitations for {project.name}.
          </p>
        </div>
        <InviteUserDialog projectId={project.id} />
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
                projectId={project.id} 
                members={project.members} 
                invitations={project.invitations} 
            />
        </CardContent>
      </Card>
    </div>
  );
}
