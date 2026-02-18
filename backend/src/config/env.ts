// ─── Environment Variables Validator ───────────────────────────────────
// Carga y valida las variables de entorno desde .env

import dotenv from 'dotenv';
dotenv.config();

// ── Validación ─────────────────────────────────────────────────────────

function requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        console.warn(`⚠️  Variable de entorno "${key}" no definida. Algunas funciones operarán en modo Mock.`);
        return '';
    }
    return value;
}

// ── Exportar configuración tipada ──────────────────────────────────────

export const env = {
    // ── Base de Datos ──────────────────────────────────────────────────
    // Connection string directa a PostgreSQL (pg Pool)
    DATABASE_URL: requireEnv('SUPABASE_DB_URL'),

    // ── Supabase Client SDK ───────────────────────────────────────────
    SUPABASE_URL: requireEnv('SUPABASE_URL'),
    SUPABASE_SERVICE_KEY: requireEnv('SUPABASE_SERVICE_KEY'),

    // ── Servidor ──────────────────────────────────────────────────────
    PORT: parseInt(process.env.PORT || '3001', 10),

    // ── OpenAI (aún no disponible — se usa Mock) ──────────────────────
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
} as const;

// ── Log de estado ──────────────────────────────────────────────────────

console.log('📋 Env cargado:');
console.log(`   DATABASE_URL: ${env.DATABASE_URL ? '✅ Configurada' : '❌ No definida'}`);
console.log(`   SUPABASE_URL: ${env.SUPABASE_URL ? '✅ Configurada' : '❌ No definida'}`);
console.log(`   SERVICE_KEY:  ${env.SUPABASE_SERVICE_KEY ? '✅ Configurada' : '❌ No definida'}`);
console.log(`   PORT:         ${env.PORT}`);
