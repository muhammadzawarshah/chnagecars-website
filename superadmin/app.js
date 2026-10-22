'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

process.chdir(__dirname);
// Existing hosting environment variables take precedence over these files.
for (const name of ['.env.local', '.env']) {
  const file = path.join(__dirname, name);
  if (fs.existsSync(file)) process.loadEnvFile(file);
}
process.env.NODE_ENV ||= 'production';
process.env.PORT ||= '3001';
process.env.HOSTNAME = '0.0.0.0';

if (!process.env.API_URL) {
  console.error('Set API_URL in the hosting environment or .env.local (including /api/v1).');
  process.exit(1);
}

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
for (const args of [['install', '--include=dev'], ['run', 'build', '--', '--webpack']]) {
  console.log(`Running npm ${args.join(' ')}...`);
  const result = spawnSync(npm, args, {
    cwd: __dirname, env: process.env, stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.error || result.status !== 0) {
    console.error('Admin setup failed:', result.error || result.signal || args.join(' '));
    process.exit(result.status || 1);
  }
}

const standalone = path.join(__dirname, '.next', 'standalone');
fs.cpSync(path.join(__dirname, 'public'), path.join(standalone, 'public'), { recursive: true });
fs.cpSync(path.join(__dirname, '.next', 'static'), path.join(standalone, '.next', 'static'), { recursive: true });
require(path.join(standalone, 'server.js'));
