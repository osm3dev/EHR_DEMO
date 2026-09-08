import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { pool } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const sql = await readFile(path.join(__dirname, 'schema.sql'), 'utf8');
  console.log('Applying schema…');
  await pool.query(sql);
  console.log('Schema applied. ✔');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
