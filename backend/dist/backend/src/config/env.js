"use strict";
// ─── Environment Variables Validator ───────────────────────────────────
// Carga y valida las variables de entorno desde .env
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// ── Validación ─────────────────────────────────────────────────────────
function requireEnv(key) {
    const value = process.env[key];
    if (!value) {
        console.warn(`⚠️  Variable de entorno "${key}" no definida. Algunas funciones operarán en modo Mock.`);
        return '';
    }
    return value;
}
// ── Exportar configuración tipada ──────────────────────────────────────
exports.env = {
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
};
// ── Log de estado ──────────────────────────────────────────────────────
console.log('📋 Env cargado:');
console.log(`   DATABASE_URL:     ${exports.env.DATABASE_URL ? '✅ Configurada' : '❌ No definida'}`);
console.log(`   SUPABASE_URL:     ${exports.env.SUPABASE_URL ? '✅ Configurada' : '❌ No definida'}`);
console.log(`   SERVICE_KEY:      ${exports.env.SUPABASE_SERVICE_KEY ? '✅ Configurada' : '❌ No definida'}`);
console.log(`   OPENAI_ADMIN_KEY: ${exports.env.OPENAI_ADMIN_KEY ? '✅ Configurada' : '⚠️  No definida (billing = mock)'}`);
console.log(`   OPENAI_ORG_ID:    ${exports.env.OPENAI_ORG_ID ? '✅ Configurada' : '⚠️  No definida'}`);
console.log(`   PORT:             ${exports.env.PORT}`);
