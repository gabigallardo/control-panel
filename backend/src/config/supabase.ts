// ─── Supabase Client (Admin / Service Role) ───────────────────────────
// Usa la Service Key para operaciones server-side con permisos elevados.
// Para queries SQL directas, usar el Pool de database.ts en su lugar.

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

let client: SupabaseClient | null = null;

/**
 * Devuelve un cliente Supabase singleton con la Service Role Key.
 * Útil para: Auth admin, Storage, Realtime, Edge Functions, etc.
 */
export function getSupabaseClient(): SupabaseClient {
    if (!client) {
        if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
            throw new Error(
                '❌ SUPABASE_URL y/o SUPABASE_SERVICE_KEY no están definidas.\n' +
                '   Copia .env.example → .env y configura tus credenciales de Supabase.'
            );
        }

        client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
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
export async function testSupabaseConnection(): Promise<boolean> {
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
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('🔴 Supabase client test error:', msg);
        return false;
    }
}
