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

    // ── OpenAI ────────────────────────────────────────────────────────
    // Admin API Key — necesaria para acceder a /v1/organization/costs y usage
    // Se obtiene en: https://platform.openai.com/settings/organization/api-keys
    OPENAI_ADMIN_KEY: process.env.OPENAI_ADMIN_KEY || '',
    // Organization ID (opcional, pero recomendado)
    OPENAI_ORG_ID: process.env.OPENAI_ORG_ID || '',
    // API Key estándar (para uso general, no billing)
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
} as const;

// ── Log de estado ──────────────────────────────────────────────────────

console.log('📋 Env cargado:');
console.log(`   DATABASE_URL:     ${env.DATABASE_URL ? '✅ Configurada' : '❌ No definida'}`);
console.log(`   SUPABASE_URL:     ${env.SUPABASE_URL ? '✅ Configurada' : '❌ No definida'}`);
console.log(`   SERVICE_KEY:      ${env.SUPABASE_SERVICE_KEY ? '✅ Configurada' : '❌ No definida'}`);
console.log(`   OPENAI_ADMIN_KEY: ${env.OPENAI_ADMIN_KEY ? '✅ Configurada' : '⚠️  No definida (billing = mock)'}`);
console.log(`   OPENAI_ORG_ID:    ${env.OPENAI_ORG_ID ? '✅ Configurada' : '⚠️  No definida'}`);
console.log(`   PORT:             ${env.PORT}`);
