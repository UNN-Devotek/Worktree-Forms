/**
 * Environment variable validation for Docker deployment
 * Ensures production environment is correctly configured
 */

export function validateEnvironment(): void {
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'MINIO_BUCKET_NAME',
  ]

  const missingVars = requiredVars.filter(varName => !process.env[varName])

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    )
  }

  // Validate DATABASE_URL is not using localhost in production
  if (process.env.NODE_ENV === 'production') {
    const dbUrl = process.env.DATABASE_URL || ''

    if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
      throw new Error(
        'DATABASE_URL cannot use localhost in production. Use Docker service name instead.'
      )
    }

    // Validate MinIO endpoint
    const minioHost = process.env.MINIO_HOST || 'minio'
    const minioEndpoint = process.env.MINIO_ENDPOINT || ''

    if (minioHost === 'localhost' && !minioEndpoint) {
      console.warn(
        'WARNING: MINIO_HOST is set to localhost. This may fail in Docker. Use service name instead.'
      )
    }
  }

  console.log('✓ Environment validation passed')
}
