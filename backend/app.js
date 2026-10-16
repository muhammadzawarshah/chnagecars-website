'use strict';

const path = require('node:path');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

// Hosting panels may start this file from a different working directory.
process.chdir(__dirname);
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
for (const args of [['install', '--include=dev'], ['run', 'build']]) {
  console.log(`Running npm ${args.join(' ')}...`);
  const result = spawnSync(npm, args, {
    cwd: __dirname,
    env: process.env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.error || result.status !== 0) {
    console.error(`npm ${args.join(' ')} failed.`, result.error || result.signal || '');
    process.exit(result.status || 1);
  }
}

require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });

const entry = path.join(__dirname, 'dist', 'main.js');
if (!fs.existsSync(entry)) {
  console.error('Backend build completed but dist/main.js is missing.');
  process.exit(1);
}

require(entry);
