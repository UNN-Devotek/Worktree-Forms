"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import { exportAuditLogs } from "@/actions/audit";
import { toast } from "sonner";

type AuditLog = {
  id: string;
  action: string;
  resource: string;
  details: any;
  ipAddress: string | null;
  timestamp: Date;
  user: {
    name: string | null;
    email: string;
    image: string | null;
  };
};

type AuditLogTableProps = {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  projectSlug: string;
  actionTypes: string[];
  currentFilter?: string;
};

export function AuditLogTable({
  logs,
  pagination,
  projectSlug,
  actionTypes,
  currentFilter,
}: AuditLogTableProps) {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    params.set("page", newPage.toString());
    if (currentFilter) params.set("action", currentFilter);
    router.push(`?${params.toString()}`);
  };

  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams();
    params.set("page", "1");
    if (value !== "all") params.set("action", value);
    router.push(`?${params.toString()}`);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportAuditLogs(projectSlug);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Download CSV
      const blob = new Blob([result.csv!], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename!;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Audit log exported successfully");
    } catch (error) {
      toast.error("Failed to export audit log");
    } finally {
      setIsExporting(false);
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes("DELETE") || action.includes("REVOKED")) return "destructive";
    if (action.includes("CREATED") || action.includes("SENT")) return "default";
    if (action.includes("CHANGED")) return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={currentFilter || "all"} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actionTypes.map((action) => (
                <SelectItem key={action} value={action}>
                  {action.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {pagination.total} {pagination.total === 1 ? "entry" : "entries"}
          </span>
        </div>

        <Button onClick={handleExport} disabled={isExporting} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? "Exporting..." : "Export CSV"}
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">
                    {formatTimestamp(log.timestamp)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={log.user.image || ""} />
                        <AvatarFallback className="text-xs">
                          {log.user.name?.substring(0, 2).toUpperCase() || "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{log.user.name || "Unknown"}</span>
                        <span className="text-xs text-muted-foreground">{log.user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActionBadgeVariant(log.action)}>
                      {log.action.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{log.resource}</TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                    {log.details ? JSON.stringify(log.details) : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {log.ipAddress || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
