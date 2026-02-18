// ─── Dashboard Service ─────────────────────────────────────────────────
// Híbrido: Supabase Client SDK (HTTPS) para métricas de negocio,
//          Mock para consumo de tokens / costos (sin API Key de OpenAI).

import { getSupabaseClient } from '../config/supabase';
import { env } from '../config/env';
import type { AgentStatus, TokenDataPoint, DateRangeKey } from '@shared/types/dashboard';
import type { DateRangeOption } from '@shared/types/dateRange';
import { DATE_RANGE_OPTIONS } from '@shared/types/dateRange';

// ── Helpers ────────────────────────────────────────────────────────────

function getRangeDate(range: DateRangeKey): string | null {
    const opt = DATE_RANGE_OPTIONS.find((o: DateRangeOption) => o.key === range);
    if (!opt || opt.minutes === 0) return null; // null = all time
    const d = new Date(Date.now() - opt.minutes * 60_000);
    return d.toISOString();
}

function isDbConfigured(): boolean {
    return !!env.SUPABASE_URL && !!env.SUPABASE_SERVICE_KEY;
}

// ═══════════════════════════════════════════════════════════════════════
// PARTE REAL — Consultas via Supabase Client SDK (HTTPS)
// ═══════════════════════════════════════════════════════════════════════

// ── Usuarios Únicos ────────────────────────────────────────────────────

export async function getUniqueUsers(range: DateRangeKey): Promise<number> {
    if (!isDbConfigured()) return mockUniqueUsers(range);

    try {
        const supabase = getSupabaseClient();
        const since = getRangeDate(range);

        let query = supabase.from('session').select('email');

        if (since) {
            query = query.gte('created_at', since);
        }

        const { data, error } = await query;

        if (error) throw new Error(error.message);

        // Contar emails únicos en memoria
        const uniqueEmails = new Set(data?.map(row => row.email));
        return uniqueEmails.size;
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('❌ getUniqueUsers error:', msg);
        return mockUniqueUsers(range);
    }
}

// ── Volumen de Consultas ───────────────────────────────────────────────

export async function getQueryVolume(range: DateRangeKey): Promise<number> {
    if (!isDbConfigured()) return mockQueryVolume(range);

    try {
        const supabase = getSupabaseClient();
        const since = getRangeDate(range);

        let query = supabase
            .from('session')
            .select('*', { count: 'exact', head: true });

        if (since) {
            query = query.gte('created_at', since);
        }

        const { count, error } = await query;

        if (error) throw new Error(error.message);
        return count ?? 0;
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('❌ getQueryVolume error:', msg);
        return mockQueryVolume(range);
    }
}

// ── Índice de No-Conflictividad ────────────────────────────────────────

export async function getNonConflictRate(range: DateRangeKey): Promise<number> {
    if (!isDbConfigured()) return mockNonConflictRate();

    try {
        const supabase = getSupabaseClient();
        const since = getRangeDate(range);

        // ── Total de sesiones en el rango ──
        let totalQuery = supabase
            .from('session')
            .select('*', { count: 'exact', head: true });

        if (since) {
            totalQuery = totalQuery.gte('created_at', since);
        }

        const { count: totalSessions, error: totalError } = await totalQuery;
        if (totalError) throw new Error(totalError.message);

        if (!totalSessions || totalSessions === 0) return 100;

        // ── Sesiones con feedback negativo (rating = false) ──
        let conflictQuery = supabase
            .from('feedback')
            .select('session_id');

        conflictQuery = conflictQuery.eq('rating', false);

        if (since) {
            // Filtrar por sesiones dentro del rango
            const sessionIdsQuery = supabase
                .from('session')
                .select('session_id')
                .gte('created_at', since);

            const { data: sessionData, error: sessError } = await sessionIdsQuery;
            if (sessError) throw new Error(sessError.message);

            const sessionIds = sessionData?.map(s => s.session_id) ?? [];
            if (sessionIds.length > 0) {
                conflictQuery = conflictQuery.in('session_id', sessionIds);
            } else {
                return 100;
            }
        }

        const { data: conflictData, error: conflictError } = await conflictQuery;
        if (conflictError) throw new Error(conflictError.message);

        const uniqueConflicts = new Set(conflictData?.map(f => f.session_id));
        const conflicts = uniqueConflicts.size;

        return Math.round(((totalSessions - conflicts) / totalSessions) * 100);
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('❌ getNonConflictRate error:', msg);
        return mockNonConflictRate();
    }
}

// ── Estado de Salud Agéntico (Health Check) ────────────────────────────

interface AgentConfig {
    name: string;
    table: string;
}

const AGENTS: AgentConfig[] = [
    { name: 'Router', table: 'documents_intake' },
    { name: 'Admisor', table: 'documents_intake' },
    { name: 'Informador', table: 'documents_referral' },
    { name: 'Derivador', table: 'documents_closer' },
];

const HEALTH_THRESHOLD_MINUTES = 15;

export async function getAgentHealth(): Promise<AgentStatus[]> {
    if (!isDbConfigured()) return mockAgentHealth();

    const supabase = getSupabaseClient();
    const threshold = new Date(Date.now() - HEALTH_THRESHOLD_MINUTES * 60_000).toISOString();

    const results = await Promise.all(
        AGENTS.map(async (agent: AgentConfig) => {
            try {
                const { data, error } = await supabase
                    .from(agent.table)
                    .select('created_at')
                    .gte('created_at', threshold)
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (error) throw new Error(error.message);

                const isOperative = (data?.length ?? 0) > 0;
                return {
                    name: agent.name,
                    status: isOperative ? 'OPERATIVO' : 'INACTIVO',
                    lastActivity: data?.[0]?.created_at ?? new Date().toISOString(),
                } as AgentStatus;
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err);
                console.error(`❌ Health check "${agent.name}" error:`, msg);
                return {
                    name: agent.name,
                    status: 'INACTIVO',
                    lastActivity: new Date().toISOString(),
                } as AgentStatus;
            }
        })
    );

    return results;
}

// ═══════════════════════════════════════════════════════════════════════
// PARTE MOCK — Tokens & Costos (sin API Key de OpenAI)
// ═══════════════════════════════════════════════════════════════════════

export function getMockTokenHistory(): TokenDataPoint[] {
    const points: TokenDataPoint[] = [];
    let base = 800;
    for (let h = 0; h < 24; h++) {
        const multiplier = h >= 9 && h <= 18 ? 2.5 : 1;
        const noise = (Math.random() - 0.3) * 400;
        const tokens = Math.max(100, Math.round((base + noise) * multiplier));
        const cost = parseFloat((tokens * 0.0015).toFixed(2));
        base += (Math.random() - 0.4) * 100;
        points.push({
            hour: `${h.toString().padStart(2, '0')}:00`,
            tokens,
            cost,
        });
    }
    return points;
}

export function getMockCostAndLatency(): { accumulatedCost: number; averageLatency: number } {
    return {
        accumulatedCost: parseFloat((3800 + Math.random() * 800).toFixed(2)),
        averageLatency: parseFloat((1.1 + Math.random() * 0.7).toFixed(1)),
    };
}

// ═══════════════════════════════════════════════════════════════════════
// MOCK FALLBACKS — Se usan cuando la DB no está configurada o falla
// ═══════════════════════════════════════════════════════════════════════

function mockUniqueUsers(range: DateRangeKey): number {
    const map: Record<DateRangeKey, number> = { '24h': 1245, '7d': 5830, '30d': 18200, all: 42500 };
    return map[range] ?? 1245;
}

function mockQueryVolume(range: DateRangeKey): number {
    const map: Record<DateRangeKey, number> = { '24h': 389, '7d': 2450, '30d': 9870, all: 34500 };
    return map[range] ?? 389;
}

function mockNonConflictRate(): number {
    return 94;
}

function mockAgentHealth(): AgentStatus[] {
    const now = new Date().toISOString();
    return [
        { name: 'Router', status: 'OPERATIVO', lastActivity: now },
        { name: 'Admisor', status: 'OPERATIVO', lastActivity: now },
        { name: 'Informador', status: 'OPERATIVO', lastActivity: now },
        { name: 'Derivador', status: 'OPERATIVO', lastActivity: now },
    ];
}
