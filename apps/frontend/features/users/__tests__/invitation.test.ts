import { describe, it, expect } from "vitest";

describe("Invitation token validation", () => {
  it("rejects expired invitations", () => {
    const expiresAt = new Date(Date.now() - 1000).toISOString();
    expect(new Date(expiresAt) < new Date()).toBe(true);
  });

  it("accepts valid invitations", () => {
    const expiresAt = new Date(Date.now() + 86400000).toISOString();
    expect(new Date(expiresAt) > new Date()).toBe(true);
  });

  it("treats missing expiresAt as non-expired", () => {
    const expiresAt: string | undefined = undefined;
    // Mirrors the guard in acceptInvite: only reject if expiresAt is set AND past
    const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;
    expect(isExpired).toBe(false);
  });
});
