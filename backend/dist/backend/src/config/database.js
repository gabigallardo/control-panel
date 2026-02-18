"use strict";
// ─── PostgreSQL Connection Pool (node-postgres) ───────────────────────
// Conexión directa a Supabase PostgreSQL vía pg Pool.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPool = getPool;
exports.testConnection = testConnection;
exports.closePool = closePool;
const pg_1 = require("pg");
const env_1 = require("./env");
let pool = null;
function getPool() {
    if (!pool) {
        if (!env_1.env.DATABASE_URL) {
            throw new Error('❌ DATABASE_URL no está definida. Copia .env.example → .env y configura tu Connection String.');
        }
        pool = new pg_1.Pool({
            connectionString: env_1.env.DATABASE_URL,
            // ── Pool tuning ──────────────────────────────────────────────
            max: 10, // máximo conexiones simultáneas
            idleTimeoutMillis: 30000, // cerrar idle después de 30s
            connectionTimeoutMillis: 5000, // timeout al conectar
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
async function testConnection() {
    try {
        const pool = getPool();
        const result = await pool.query('SELECT NOW() AS server_time');
        console.log('🟢 DB alive — server_time:', result.rows[0].server_time);
        return true;
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('🔴 No se pudo conectar a la base de datos:', message);
        return false;
    }
}
/**
 * Cierra el pool limpiamente (para graceful shutdown).
 */
async function closePool() {
    if (pool) {
        await pool.end();
        pool = null;
        console.log('🔒 Pool de conexiones cerrado');
    }
}
