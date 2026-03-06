import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));
vi.mock("@/lib/dynamo", () => ({
  ProjectEntity: {
    query: {
      bySlug: vi.fn(() => ({ go: vi.fn() })),
    },
  },
  ProjectMemberEntity: {
    query: {
      primary: vi.fn(() => ({ go: vi.fn() })),
    },
  },
  AuditLogEntity: {
    query: {
      primary: vi.fn(() => ({ go: vi.fn() })),
    },
  },
  UserEntity: {
    query: {
      primary: vi.fn(() => ({ go: vi.fn() })),
    },
  },
}));

import { getAuditLogs, exportAuditLogs } from "@/actions/audit";
import { auth } from "@/auth";
import { ProjectEntity, ProjectMemberEntity, AuditLogEntity, UserEntity } from "@/lib/dynamo";

describe("Audit Security Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAuditLogs - RBAC Enforcement", () => {
    it("should reject unauthorized users (no session)", async () => {
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await getAuditLogs("test-project");

      expect(result.error).toBe("Unauthorized");
    });

    it("should reject non-members (project not found for user)", async () => {
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: "user1" } });
      (ProjectEntity.query.bySlug as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: [] }),
      });

      const result = await getAuditLogs("test-project");

      expect(result.error).toBe("Project not found");
    });

    it("should reject non-owners (403 Forbidden)", async () => {
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: "user1" } });
      (ProjectEntity.query.bySlug as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [{ projectId: "proj1", slug: "test-project" }],
        }),
      });
      (ProjectMemberEntity.query.primary as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [{ userId: "user1", roles: ["MEMBER"] }],
        }),
      });

      const result = await getAuditLogs("test-project");

      expect(result.error).toBe("Forbidden: Only project owners can view audit logs");
    });

    it("should allow owners to view logs", async () => {
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: "user1" } });
      (ProjectEntity.query.bySlug as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [{ projectId: "proj1", slug: "test-project" }],
        }),
      });
      (ProjectMemberEntity.query.primary as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [{ userId: "user1", roles: ["OWNER"] }],
        }),
      });
      (AuditLogEntity.query.primary as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: [] }),
      });

      const result = await getAuditLogs("test-project");

      expect(result.error).toBeUndefined();
      expect(result.logs).toEqual([]);
    });
  });

  describe("exportAuditLogs - RBAC Enforcement", () => {
    it("should reject unauthorized users", async () => {
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await exportAuditLogs("test-project");

      expect(result.error).toBe("Unauthorized");
    });

    it("should reject non-owners", async () => {
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: "user1" } });
      (ProjectEntity.query.bySlug as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [{ projectId: "proj1", slug: "test-project" }],
        }),
      });
      (ProjectMemberEntity.query.primary as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [{ userId: "user1", roles: ["MEMBER"] }],
        }),
      });

      const result = await exportAuditLogs("test-project");

      expect(result.error).toBe("Forbidden: Only project owners can export audit logs");
    });

    it("should allow owners to export", async () => {
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: "user1" } });
      (ProjectEntity.query.bySlug as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [{ projectId: "proj1", slug: "test-project" }],
        }),
      });
      (ProjectMemberEntity.query.primary as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [{ userId: "user1", roles: ["OWNER"] }],
        }),
      });
      (AuditLogEntity.query.primary as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [
            {
              auditId: "log1",
              createdAt: "2026-01-15T12:00:00Z",
              userId: "user1",
              action: "INVITE_SENT",
              entityType: "User",
              details: { email: "test@example.com" },
              ipAddress: "192.168.1.1",
            },
          ],
        }),
      });
      (UserEntity.query.primary as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [{ userId: "user1", name: "John Doe", email: "john@example.com" }],
        }),
      });

      const result = await exportAuditLogs("test-project");

      expect(result.error).toBeUndefined();
      expect(result.csv).toContain("INVITE_SENT");
      expect(result.csv).toContain("john@example.com");
      expect(result.filename).toContain("test-project");
    });
  });

  describe("Project Scoping", () => {
    it("should only return logs for the requested project", async () => {
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: "user1" } });
      (ProjectEntity.query.bySlug as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [{ projectId: "proj1", slug: "test-project" }],
        }),
      });
      (ProjectMemberEntity.query.primary as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [{ userId: "user1", roles: ["OWNER"] }],
        }),
      });
      (AuditLogEntity.query.primary as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: [] }),
      });

      await getAuditLogs("test-project");

      expect(AuditLogEntity.query.primary).toHaveBeenCalledWith({ projectId: "proj1" });
    });
  });
});
