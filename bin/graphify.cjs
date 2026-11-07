#!/usr/bin/env node
const { spawnSync } = require('child_process');
const args = process.argv.slice(2);
const finalArgs = args.length === 0 ? ['update', '.'] : args;
const res = spawnSync('graphify', finalArgs, { stdio: 'inherit', shell: true });
process.exit(res.status !== null ? res.status : 0);
