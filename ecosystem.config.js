module.exports = {
  apps: [
    {
      name: "bupobook",
      script: "npm",
      args: "start",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        PORT: 8520,
      },
      max_memory_restart: "512M",
    },
  ],
};
