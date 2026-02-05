import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock deps
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: {
    userPreference: { upsert: vi.fn() },
    user: { update: vi.fn() },
  },
}));
vi.mock("@/lib/storage", () => ({
  s3Client: { send: vi.fn() },
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Import what we want to test
import { updateTheme, uploadAvatar } from "@/actions/user";
import { auth } from "@/auth";
import { db } from "@/lib/db";

describe("Profile Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateTheme", () => {
    it("should reject unauthorized users", async () => {
      (auth as any).mockResolvedValue(null);
      await expect(updateTheme("dark")).rejects.toThrow("Unauthorized");
    });

    it("should reject invalid themes", async () => {
      (auth as any).mockResolvedValue({ user: { id: "user1" } });
      await expect(updateTheme("blue")).rejects.toThrow("Invalid theme");
    });

    it("should update user preference", async () => {
      (auth as any).mockResolvedValue({ user: { id: "user1" } });
      (db.userPreference.upsert as any).mockResolvedValue({});

      const result = await updateTheme("dark");
      expect(result.success).toBe(true);
      expect(db.userPreference.upsert).toHaveBeenCalledWith({
        where: { userId: "user1" },
        update: { theme: "dark" },
        create: { userId: "user1", theme: "dark" },
      });
    });
  });
});
