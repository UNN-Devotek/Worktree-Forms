import { faker } from '@faker-js/faker';

export type UserRole = 'admin' | 'editor' | 'viewer'; // Matching backend/prisma
export type SystemRole = 'ADMIN' | 'MEMBER'; // Frontend RBAC

export type User = {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  systemRole: SystemRole;
  createdAt: string;
  updatedAt: string;
};

export const createUser = (overrides: Partial<User> = {}): User => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const email = `user-${faker.string.uuid()}@test.com`;

  return {
    id: faker.string.uuid(),
    email,
    password: 'password123', // Default password for testing
    name: `${firstName} ${lastName}`,
    role: 'viewer',
    systemRole: 'MEMBER',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
};
