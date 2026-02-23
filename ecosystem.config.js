module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: './apps/backend',
      script: 'npm',
      args: process.env.NODE_ENV === 'development' ? 'run dev' : 'run start',
      instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
      exec_mode: process.env.NODE_ENV === 'production' ? 'cluster' : 'fork',
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
      script: 'npm',
      args: process.env.NODE_ENV === 'development' ? 'run dev' : 'run start',
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