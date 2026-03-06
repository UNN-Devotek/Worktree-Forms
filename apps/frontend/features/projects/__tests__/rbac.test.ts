import { describe, it, expect, vi } from "vitest";

// Mock next-auth and DynamoDB dependencies that are imported at module level
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/dynamo", () => ({ ProjectMemberEntity: {} }));

import { hasRole } from "@/lib/rbac";

describe("hasRole", () => {
  it("VIEWER passes VIEWER check", () => {
    expect(hasRole(["VIEWER"], "VIEWER")).toBe(true);
  });

  it("VIEWER fails EDITOR check", () => {
    expect(hasRole(["VIEWER"], "EDITOR")).toBe(false);
  });

  it("VIEWER fails ADMIN check", () => {
    expect(hasRole(["VIEWER"], "ADMIN")).toBe(false);
  });

  it("VIEWER fails OWNER check", () => {
    expect(hasRole(["VIEWER"], "OWNER")).toBe(false);
  });

  it("EDITOR passes VIEWER check", () => {
    expect(hasRole(["EDITOR"], "VIEWER")).toBe(true);
  });

  it("EDITOR passes EDITOR check", () => {
    expect(hasRole(["EDITOR"], "EDITOR")).toBe(true);
  });

  it("EDITOR fails ADMIN check", () => {
    expect(hasRole(["EDITOR"], "ADMIN")).toBe(false);
  });

  it("ADMIN passes EDITOR check", () => {
    expect(hasRole(["ADMIN"], "EDITOR")).toBe(true);
  });

  it("ADMIN passes VIEWER check", () => {
    expect(hasRole(["ADMIN"], "VIEWER")).toBe(true);
  });

  it("ADMIN fails OWNER check", () => {
    expect(hasRole(["ADMIN"], "OWNER")).toBe(false);
  });

  it("OWNER passes all checks", () => {
    expect(hasRole(["OWNER"], "VIEWER")).toBe(true);
    expect(hasRole(["OWNER"], "EDITOR")).toBe(true);
    expect(hasRole(["OWNER"], "ADMIN")).toBe(true);
    expect(hasRole(["OWNER"], "OWNER")).toBe(true);
  });

  it("multiple roles: highest wins", () => {
    expect(hasRole(["VIEWER", "EDITOR"], "EDITOR")).toBe(true);
  });

  it("multiple roles: still fails if none meet minimum", () => {
    expect(hasRole(["VIEWER", "EDITOR"], "ADMIN")).toBe(false);
  });

  it("empty roles array fails all checks", () => {
    expect(hasRole([], "VIEWER")).toBe(false);
  });

  it("unknown role string is ignored", () => {
    expect(hasRole(["UNKNOWN"], "VIEWER")).toBe(false);
  });
});
