import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: {
    project: {
      findUnique: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { getAuditLogs, exportAuditLogs } from "@/actions/audit";
import { auth } from "@/auth";
import { db } from "@/lib/db";

describe("Audit Security Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAuditLogs - RBAC Enforcement", () => {
    it("should reject unauthorized users (no session)", async () => {
      (auth as any).mockResolvedValue(null);

      const result = await getAuditLogs("test-project");

      expect(result.error).toBe("Unauthorized");
      expect(db.project.findUnique).not.toHaveBeenCalled();
    });

    it("should reject non-members (project not found for user)", async () => {
      (auth as any).mockResolvedValue({ user: { id: "user1" } });
      (db.project.findUnique as any).mockResolvedValue(null);

      const result = await getAuditLogs("test-project");

      expect(result.error).toBe("Project not found");
    });

    it("should reject non-owners (403 Forbidden)", async () => {
      (auth as any).mockResolvedValue({ user: { id: "user1" } });
      (db.project.findUnique as any).mockResolvedValue({
        id: "proj1",
        slug: "test-project",
        members: [
          { userId: "user1", roles: ["MEMBER"] }, // Not OWNER
        ],
      });

      const result = await getAuditLogs("test-project");

      expect(result.error).toBe("Forbidden: Only project owners can view audit logs");
      expect(db.auditLog.findMany).not.toHaveBeenCalled();
    });

    it("should allow owners to view logs", async () => {
      (auth as any).mockResolvedValue({ user: { id: "user1" } });
      (db.project.findUnique as any).mockResolvedValue({
        id: "proj1",
        slug: "test-project",
        members: [
          { userId: "user1", roles: ["OWNER"] }, // Is OWNER
        ],
      });
      (db.auditLog.findMany as any).mockResolvedValue([]);
      (db.auditLog.count as any).mockResolvedValue(0);

      const result = await getAuditLogs("test-project");

      expect(result.error).toBeUndefined();
      expect(result.logs).toEqual([]);
      expect(db.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ projectId: "proj1" }),
        })
      );
    });
  });

  describe("exportAuditLogs - RBAC Enforcement", () => {
    it("should reject unauthorized users", async () => {
      (auth as any).mockResolvedValue(null);

      const result = await exportAuditLogs("test-project");

      expect(result.error).toBe("Unauthorized");
    });

    it("should reject non-owners", async () => {
      (auth as any).mockResolvedValue({ user: { id: "user1" } });
      (db.project.findUnique as any).mockResolvedValue({
        id: "proj1",
        members: [{ userId: "user1", roles: ["MEMBER"] }],
      });

      const result = await exportAuditLogs("test-project");

      expect(result.error).toBe("Forbidden: Only project owners can export audit logs");
    });

    it("should allow owners to export", async () => {
      (auth as any).mockResolvedValue({ user: { id: "user1" } });
      (db.project.findUnique as any).mockResolvedValue({
        id: "proj1",
        slug: "test-project",
        members: [{ userId: "user1", roles: ["OWNER"] }],
      });
      (db.auditLog.findMany as any).mockResolvedValue([
        {
          id: "log1",
          timestamp: new Date("2026-01-15T12:00:00Z"),
          user: { name: "John Doe", email: "john@example.com" },
          action: "INVITE_SENT",
          resource: "User",
          details: { email: "test@example.com" },
          ipAddress: "192.168.1.1",
        },
      ]);

      const result = await exportAuditLogs("test-project");

      expect(result.error).toBeUndefined();
      expect(result.csv).toContain("INVITE_SENT");
      expect(result.csv).toContain("john@example.com");
      expect(result.filename).toContain("test-project");
    });
  });

  describe("Project Scoping", () => {
    it("should only return logs for the requested project", async () => {
      (auth as any).mockResolvedValue({ user: { id: "user1" } });
      (db.project.findUnique as any).mockResolvedValue({
        id: "proj1",
        members: [{ userId: "user1", roles: ["OWNER"] }],
      });
      (db.auditLog.findMany as any).mockResolvedValue([]);
      (db.auditLog.count as any).mockResolvedValue(0);

      await getAuditLogs("test-project");

      expect(db.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ projectId: "proj1" }),
        })
      );
    });
  });
});
