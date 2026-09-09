import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { pool } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const url = process.env.DATABASE_URL ?? '';
  const host = url ? new URL(url).host : '(PGHOST env)';
  const sql = await readFile(path.join(__dirname, 'schema.sql'), 'utf8');

  console.log(`Applying schema to ${host} …`);
  const client = await pool.connect();
  try {
    // schema.sql is idempotent: it DROPs and recreates only the `ehr` schema.
    await client.query(sql);
  } finally {
    client.release();
  }
  console.log('Schema applied. ✔  Run `npm run db:seed` next.');
  await pool.end();
}

main().catch((err) => {
  console.error('\nMigration failed:', err.message);
  console.error(
    '\nIf the host ends in `-pooler` or uses PgBouncer/transaction pooling, use the\n' +
      'DIRECT (non-pooled) connection string for migrations, then switch back.',
  );
  process.exit(1);
});
