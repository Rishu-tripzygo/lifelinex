/** PM2 process config — port 3012 keeps lifelinex isolated from other apps on this VPS. */
module.exports = {
  apps: [
    {
      name: "lifelinex",
      cwd: "/var/www/lifelinex",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3012",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "3012",
      },
    },
  ],
};
