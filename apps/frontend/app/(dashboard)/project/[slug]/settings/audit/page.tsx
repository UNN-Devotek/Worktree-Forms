import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAuditLogs, getAuditActionTypes } from "@/actions/audit";
import { AuditLogTable } from "@/features/projects/components/audit-log-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Audit Log",
  description: "View project audit trail and security events.",
};

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; action?: string }>;
};

export default async function AuditLogPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page || "1", 10);
  const actionFilter = resolvedSearchParams.action;

  // Fetch logs and action types
  const [logsResult, actionsResult] = await Promise.all([
    getAuditLogs(slug, page, 50, actionFilter),
    getAuditActionTypes(slug),
  ]);

  // Handle errors
  if (logsResult.error) {
    if (logsResult.error.includes("Forbidden")) {
      return (
        <div className="container max-w-4xl py-10">
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              Access Denied: Only project owners can view audit logs.
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    notFound();
  }

  if (actionsResult.error) {
    notFound();
  }

  return (
    <div className="container max-w-6xl space-y-6 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground">
          View all security and administrative events for this project. Logs are retained for 90 days.
        </p>
      </div>

      <AuditLogTable
        logs={logsResult.logs!}
        pagination={logsResult.pagination!}
        projectSlug={slug}
        actionTypes={actionsResult.actions!}
        currentFilter={actionFilter}
      />

      <div className="rounded-lg border bg-muted/50 p-4">
        <h3 className="mb-2 text-sm font-semibold">Privacy Notice</h3>
        <p className="text-xs text-muted-foreground">
          Audit logs include IP addresses for security purposes. Data is retained for 90 days and
          automatically deleted thereafter. For GDPR data export requests, use the &ldquo;Export CSV&rdquo; button.
        </p>
      </div>
    </div>
  );
}
