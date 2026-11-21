#!/usr/bin/env node

import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error("Usage: node scripts/hash-password.mjs <password>");
  console.error("Example: node scripts/hash-password.mjs myStrongPassword123");
  process.exit(1);
}

const saltRounds = 10;
const hash = bcrypt.hashSync(password, saltRounds);

console.log("\nGenerated ADMIN_PASSWORD_HASH:\n");
console.log(hash);
console.log("\nAdd this to your .env.local as:");
console.log(`ADMIN_PASSWORD_HASH='${hash}'\n`);
