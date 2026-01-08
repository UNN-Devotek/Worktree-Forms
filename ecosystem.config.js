module.exports = {
  apps: [
    {
      name: "backend",
      cwd: "./apps/backend",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
        BACKEND_PORT: "5005",
        PORT: "5005",  // Backend uses PORT env var
      },
    },
    {
      name: "frontend",
      cwd: "./apps/frontend",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
        PORT: "3005",  // Frontend uses PORT env var
      },
    },
  ],
};
