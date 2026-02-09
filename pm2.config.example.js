module.exports = {
  apps: [
{
      name: 'n8n-utils',
      script: 'bun',
      args: 'run start',
      cwd: '/home/user/code/n8n-utils-server',
      env: {
        NODE_ENV: 'production bun dist/server.js',
        PORT: 7875,
        PATH: `${process.env.HOME}/.bun/bin:${process.env.PATH}`
      },
      max_memory_restart: '300M',
      out_file: '/home/user/.pm2/logs/n8n_utils_out.log',
      error_file: '/home/user/.pm2/logs/n8n_utils_error.log',
      merge_logs: true
    }
  ]
}