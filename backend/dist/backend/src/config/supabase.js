"use strict";
// ─── Supabase Client (Admin / Service Role) ───────────────────────────
// Usa la Service Key para operaciones server-side con permisos elevados.
// Para queries SQL directas, usar el Pool de database.ts en su lugar.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupabaseClient = getSupabaseClient;
exports.testSupabaseConnection = testSupabaseConnection;
const supabase_js_1 = require("@supabase/supabase-js");
const env_1 = require("./env");
let client = null;
/**
 * Devuelve un cliente Supabase singleton con la Service Role Key.
 * Útil para: Auth admin, Storage, Realtime, Edge Functions, etc.
 */
function getSupabaseClient() {
    if (!client) {
        if (!env_1.env.SUPABASE_URL || !env_1.env.SUPABASE_SERVICE_KEY) {
            throw new Error('❌ SUPABASE_URL y/o SUPABASE_SERVICE_KEY no están definidas.\n' +
                '   Copia .env.example → .env y configura tus credenciales de Supabase.');
        }
        client = (0, supabase_js_1.createClient)(env_1.env.SUPABASE_URL, env_1.env.SUPABASE_SERVICE_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
        console.log('✅ Cliente Supabase inicializado correctamente');
    }
    return client;
}
/**
 * Verifica que el cliente Supabase puede comunicarse con el proyecto.
 */
async function testSupabaseConnection() {
    try {
        const supabase = getSupabaseClient();
        // Query liviana para verificar conectividad
        const { error } = await supabase.from('session').select('session_id').limit(1);
        if (error) {
            console.error('🔴 Supabase client test falló:', error.message);
            return false;
        }
        console.log('🟢 Supabase client conectado correctamente');
        return true;
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('🔴 Supabase client test error:', msg);
        return false;
    }
}
