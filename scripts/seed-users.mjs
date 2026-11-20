// Seeds the demo users into the backend database. Safe to run repeatedly: existing emails are skipped.
// Lives outside backend/ (read-only) and borrows its dependencies and .env.
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'backend');
const require = createRequire(path.join(backend, 'package.json'));
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(backend, '.env'), quiet: true });

const USERS = [
  ['Admin User', 'admin@civicevents.test', 'Admin#1234', 'admin', true],
  ['Demo User', 'user@civicevents.test', 'User#1234', 'user', true],
  ['Amina Okafor', 'amina.okafor@civicevents.test', 'User#1234', 'user', true],
  ['Liam Dupont', 'liam.dupont@civicevents.test', 'User#1234', 'user', true],
  ['Sofia Mensah', 'sofia.mensah@civicevents.test', 'User#1234', 'user', true],
  ['Daniel Karekezi', 'daniel.karekezi@civicevents.test', 'User#1234', 'user', false],
];

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
});

let added = 0;
for (const [name, email, password, role, active] of USERS) {
  const hash = await bcrypt.hash(password, 10);
  const res = await pool.query(
    'INSERT INTO users (full_name, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING',
    [name, email, hash, role, active]
  );
  added += res.rowCount;
}
console.log('Seeded users: ' + added + ' added, ' + (USERS.length - added) + ' already existed');
await pool.end();
