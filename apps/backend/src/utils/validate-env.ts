/**
 * Environment variable validation for Docker deployment.
 * Validates DynamoDB/S3/Redis stack (no Prisma/PostgreSQL).
 */

export function validateEnvironment(): void {
  const required = [
    'JWT_SECRET',
    'S3_BUCKET',
    'DYNAMODB_TABLE_NAME',
  ];

  const missing = required.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (process.env.NODE_ENV === 'production') {
    // In production there must be no local endpoint overrides
    if (process.env.DYNAMODB_ENDPOINT) {
      throw new Error('DYNAMODB_ENDPOINT must not be set in production (use real AWS DynamoDB).');
    }
    if (process.env.S3_ENDPOINT) {
      throw new Error('S3_ENDPOINT must not be set in production (use real AWS S3).');
    }
  }
}
