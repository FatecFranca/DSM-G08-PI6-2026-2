import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL precisa estar configurada para iniciar a API.');
}

export const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined
});

pool.on('error', error => {
  console.error('[POSTGRES] Erro inesperado no pool:', error);
});
