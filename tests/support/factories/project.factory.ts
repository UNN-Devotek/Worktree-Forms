import { faker } from '@faker-js/faker';

export type Project = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export const createProject = (overrides: Partial<Project> = {}): Project => {
  const name = faker.commerce.productName();
  const slug = faker.helpers.slugify(name).toLowerCase() + '-' + faker.string.alphanumeric(6);

  return {
    id: faker.string.uuid(),
    name,
    slug,
    description: faker.lorem.sentence(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
};
