import * as z from "zod";

// Kept minimal for future use if needed, but currently unused by Microsoft/Dev flow
export const UserRoleSchema = z.enum(["ADMIN", "USER", "VIEWER"]);

export type UserRole = z.infer<typeof UserRoleSchema>;

