import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { acceptInvite } from "@/features/users/server/invite-actions";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await auth();

  // 1. Validate Token & Fetch Invite
  const invitation = await db.invitation.findUnique({
    where: { token },
    include: { project: true, inviter: true },
  });

  if (!invitation) return notFound();
  
  if (invitation.expiresAt < new Date()) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">Invitation Expired</CardTitle>
            <CardDescription>
              This invitation link is no longer valid. Please ask the project owner to send a new one.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // 2. Handle Acceptance Action
  async function handleAccept() {
    "use server";
    const result = await acceptInvite(token);
    
    if (result.error) {
        if (result.redirectTo) {
            redirect(result.redirectTo);
        }
        // Ideally show error toast, but in simple server action form, we might redirect or throw
        throw new Error(result.error);
    }
    
    if (result.success && result.projectSlug) {
        redirect(`/project/${result.projectSlug}`);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>You&apos;ve been invited!</CardTitle>
            <CardDescription>
                <strong>{invitation.inviter.name || invitation.inviter.email}</strong> has invited you to join the project <strong>{invitation.project.name}</strong> as a {invitation.roles.join(", ")}.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {!session?.user && (
                <div className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                    You will need to sign in or create an account to accept this invitation.
                </div>
            )}
            <div className="text-center text-sm text-muted-foreground">
                Invited as: <span className="font-medium text-foreground">{invitation.email}</span>
            </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
            <form action={handleAccept} className="w-full">
                <Button className="w-full" size="lg" type="submit">
                    {session?.user ? "Join Project" : "Sign in to Join"}
                </Button>
            </form>
            <p className="text-xs text-muted-foreground">
                By joining, you agree to share your profile information with the project owners.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
