module.exports = {
  apps: [
    {
      name: "backend",
      cwd: "./apps/backend",
      script: "npm",
      args: process.env.NODE_ENV === 'development' ? "run dev" : "run start",
      env: {
        NODE_ENV: process.env.NODE_ENV || "production",
        PORT: process.env.BACKEND_PORT || "5005",
      },
    },
    {
      name: "frontend",
      cwd: "./apps/frontend",
      script: "npm",
      args: process.env.NODE_ENV === 'development' ? "run dev" : "run start",
      env: {
        NODE_ENV: process.env.NODE_ENV || "production",
        PORT: process.env.PORT || "3005",
      },
    },
  ],
};