// ─── PostgreSQL Connection Pool (node-postgres) ───────────────────────
// Conexión directa a Supabase PostgreSQL vía pg Pool.

import { Pool } from 'pg';
import { env } from './env';

let pool: Pool | null = null;

export function getPool(): Pool {
    if (!pool) {
        if (!env.DATABASE_URL) {
            throw new Error(
                '❌ DATABASE_URL no está definida. Copia .env.example → .env y configura tu Connection String.'
            );
        }

        pool = new Pool({
            connectionString: env.DATABASE_URL,
            // ── Pool tuning ──────────────────────────────────────────────
            max: 10,                    // máximo conexiones simultáneas
            idleTimeoutMillis: 30_000,  // cerrar idle después de 30s
            connectionTimeoutMillis: 5_000, // timeout al conectar
            ssl: { rejectUnauthorized: false }, // Supabase requiere SSL
        });

        // Log on first successful connection
        pool.on('connect', () => {
            console.log('✅ Conectado a Supabase PostgreSQL correctamente');
        });

        pool.on('error', (err) => {
            console.error('❌ Error inesperado en el pool de conexiones:', err.message);
        });
    }

    return pool;
}

/**
 * Test de conectividad — se llama al arrancar el servidor.
 * No lanza excepción: solo loguea el resultado.
 */
export async function testConnection(): Promise<boolean> {
    try {
        const pool = getPool();
        const result = await pool.query('SELECT NOW() AS server_time');
        console.log('🟢 DB alive — server_time:', result.rows[0].server_time);
        return true;
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('🔴 No se pudo conectar a la base de datos:', message);
        return false;
    }
}

/**
 * Cierra el pool limpiamente (para graceful shutdown).
 */
export async function closePool(): Promise<void> {
    if (pool) {
        await pool.end();
        pool = null;
        console.log('🔒 Pool de conexiones cerrado');
    }
}
