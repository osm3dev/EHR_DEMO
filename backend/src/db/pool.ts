import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

/**
 * Managed Postgres providers (Vercel Postgres, Neon, Supabase, RDS, …) require
 * TLS and often present a chain Node won't verify by default. Enable SSL for any
 * non-local host; keep it off for `localhost` so local dev needs no certs.
 */
function sslConfig(): pg.PoolConfig['ssl'] {
  if (process.env.PGSSL === 'false') return undefined;
  const host = process.env.PGHOST ?? (connectionString ? new URL(connectionString).hostname : 'localhost');
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  if (isLocal && process.env.PGSSL !== 'true') return undefined;
  return { rejectUnauthorized: false };
}

export const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30_000,
  ssl: sslConfig(),
});

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Unexpected PostgreSQL error', err);
});

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params as never);
}

// Every request runs with the ehr schema on the search_path.
export async function withSchema<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('SET search_path TO ehr, public');
    return await fn(client);
  } finally {
    client.release();
  }
}
