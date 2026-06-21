module.exports = {
  apps: [
    {
      name:         'cloudwatch-pro',
      script:       'server.js',
      cwd:          '/opt/CloudWatch_Pro/backend',
      instances:    1,
      autorestart:  true,
      watch:        false,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
        PORT:     3000
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file:  '/var/log/cloudwatch-pro/error.log',
      out_file:    '/var/log/cloudwatch-pro/out.log',
      merge_logs:  true
    }
  ]
}
