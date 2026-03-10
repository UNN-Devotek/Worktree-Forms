const isDev = process.env.NODE_ENV === 'development';

module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: './apps/backend',
      // In production, run the compiled JS directly (required for cluster mode)
      // In development, use npm to invoke tsx watch
      script: isDev ? 'npm' : 'dist/index.js',
      args: isDev ? 'run dev' : undefined,
      instances: isDev ? 1 : 2,
      exec_mode: isDev ? 'fork' : 'cluster',
      kill_timeout: 5000,
      listen_timeout: 10000,
      env: {
        NODE_ENV: process.env.NODE_ENV || 'production',
        PORT: process.env.BACKEND_PORT || '5005',
      },
    },
    {
      name: 'frontend',
      cwd: './apps/frontend',
      script: isDev ? 'npm' : 'node_modules/.bin/next',
      args: isDev ? 'run dev' : 'start',
      instances: 1,
      exec_mode: 'fork',
      kill_timeout: 5000,
      listen_timeout: 30000,
      env: {
        NODE_ENV: process.env.NODE_ENV || 'production',
        PORT: process.env.PORT || '3005',
      },
    },
  ],
};