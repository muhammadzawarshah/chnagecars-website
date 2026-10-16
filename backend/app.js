'use strict';

const path = require('node:path');
const fs = require('node:fs');

// Hosting panels may start this file from a different working directory.
process.chdir(__dirname);
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });

const entry = path.join(__dirname, 'dist', 'main.js');
if (!fs.existsSync(entry)) {
  console.error('Backend build missing. Run "npm run build" inside backend before starting app.js.');
  process.exit(1);
}

require(entry);
