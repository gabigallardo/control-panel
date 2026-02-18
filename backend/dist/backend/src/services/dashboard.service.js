"use strict";
// ─── Dashboard Service ─────────────────────────────────────────────────
// Híbrido: Supabase Client SDK (HTTPS) para métricas de negocio,
//          OpenAI Organization API para tokens/costos (con fallback a mock).
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUniqueUsers = getUniqueUsers;
exports.getQueryVolume = getQueryVolume;
exports.getNonConflictRate = getNonConflictRate;
exports.getAgentHealth = getAgentHealth;
exports.getTokenHistory = getTokenHistory;
exports.getCostAndLatency = getCostAndLatency;
const supabase_1 = require("../config/supabase");
const env_1 = require("../config/env");
const dateRange_1 = require("@shared/types/dateRange");
const openai_service_1 = require("./openai.service");
// ── Helpers ────────────────────────────────────────────────────────────
function getRangeDate(range) {
    const opt = dateRange_1.DATE_RANGE_OPTIONS.find((o) => o.key === range);
    if (!opt || opt.minutes === 0)
        return null; // null = all time
    const d = new Date(Date.now() - opt.minutes * 60000);
    return d.toISOString();
}
function isDbConfigured() {
    return !!env_1.env.SUPABASE_URL && !!env_1.env.SUPABASE_SERVICE_KEY;
}
// ═══════════════════════════════════════════════════════════════════════
// PARTE REAL — Consultas via Supabase Client SDK (HTTPS)
// ═══════════════════════════════════════════════════════════════════════
// ── Usuarios Únicos ────────────────────────────────────────────────────
async function getUniqueUsers(range) {
    if (!isDbConfigured())
        return mockUniqueUsers(range);
    try {
        const supabase = (0, supabase_1.getSupabaseClient)();
        const since = getRangeDate(range);
        let query = supabase.from('session').select('email');
        if (since) {
            query = query.gte('created_at', since);
        }
        const { data, error } = await query;
        if (error)
            throw new Error(error.message);
        // Contar emails únicos en memoria
        const uniqueEmails = new Set(data?.map(row => row.email));
        return uniqueEmails.size;
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('❌ getUniqueUsers error:', msg);
        return mockUniqueUsers(range);
    }
}
// ── Volumen de Consultas ───────────────────────────────────────────────
async function getQueryVolume(range) {
    if (!isDbConfigured())
        return mockQueryVolume(range);
    try {
        const supabase = (0, supabase_1.getSupabaseClient)();
        const since = getRangeDate(range);
        let query = supabase
            .from('session')
            .select('*', { count: 'exact', head: true });
        if (since) {
            query = query.gte('created_at', since);
        }
        const { count, error } = await query;
        if (error)
            throw new Error(error.message);
        return count ?? 0;
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('❌ getQueryVolume error:', msg);
        return mockQueryVolume(range);
    }
}
// ── Índice de No-Conflictividad ────────────────────────────────────────
async function getNonConflictRate(range) {
    if (!isDbConfigured())
        return mockNonConflictRate();
    try {
        const supabase = (0, supabase_1.getSupabaseClient)();
        const since = getRangeDate(range);
        // ── Total de sesiones en el rango ──
        let totalQuery = supabase
            .from('session')
            .select('*', { count: 'exact', head: true });
        if (since) {
            totalQuery = totalQuery.gte('created_at', since);
        }
        const { count: totalSessions, error: totalError } = await totalQuery;
        if (totalError)
            throw new Error(totalError.message);
        if (!totalSessions || totalSessions === 0)
            return 100;
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
            if (sessError)
                throw new Error(sessError.message);
            const sessionIds = sessionData?.map(s => s.session_id) ?? [];
            if (sessionIds.length > 0) {
                conflictQuery = conflictQuery.in('session_id', sessionIds);
            }
            else {
                return 100;
            }
        }
        const { data: conflictData, error: conflictError } = await conflictQuery;
        if (conflictError)
            throw new Error(conflictError.message);
        const uniqueConflicts = new Set(conflictData?.map(f => f.session_id));
        const conflicts = uniqueConflicts.size;
        return Math.round(((totalSessions - conflicts) / totalSessions) * 100);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('❌ getNonConflictRate error:', msg);
        return mockNonConflictRate();
    }
}
const AGENTS = [
    { name: 'Router', table: 'documents_intake' },
    { name: 'Admisor', table: 'documents_intake' },
    { name: 'Informador', table: 'documents_referral' },
    { name: 'Derivador', table: 'documents_closer' },
];
const HEALTH_THRESHOLD_MINUTES = 15;
async function getAgentHealth() {
    if (!isDbConfigured())
        return mockAgentHealth();
    const supabase = (0, supabase_1.getSupabaseClient)();
    const threshold = new Date(Date.now() - HEALTH_THRESHOLD_MINUTES * 60000).toISOString();
    const results = await Promise.all(AGENTS.map(async (agent) => {
        try {
            const { data, error } = await supabase
                .from(agent.table)
                .select('created_at')
                .gte('created_at', threshold)
                .order('created_at', { ascending: false })
                .limit(1);
            if (error)
                throw new Error(error.message);
            const isOperative = (data?.length ?? 0) > 0;
            return {
                name: agent.name,
                status: isOperative ? 'OPERATIVO' : 'INACTIVO',
                lastActivity: data?.[0]?.created_at ?? new Date().toISOString(),
            };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`❌ Health check "${agent.name}" error:`, msg);
            return {
                name: agent.name,
                status: 'INACTIVO',
                lastActivity: new Date().toISOString(),
            };
        }
    }));
    return results;
}
// ═══════════════════════════════════════════════════════════════════════
// TOKENS & COSTOS — Real OpenAI con fallback a Mock
// ═══════════════════════════════════════════════════════════════════════
/**
 * Obtiene historial de tokens. Intenta datos reales de OpenAI primero.
 */
async function getTokenHistory(range) {
    try {
        const billing = await (0, openai_service_1.getOpenAiBillingData)(range);
        if (billing)
            return billing.tokenHistory;
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('❌ getTokenHistory real error, using mock:', msg);
    }
    return getMockTokenHistory();
}
/**
 * Obtiene costo acumulado y latencia. Intenta datos reales de OpenAI primero.
 */
async function getCostAndLatency(range) {
    try {
        const billing = await (0, openai_service_1.getOpenAiBillingData)(range);
        if (billing) {
            return {
                accumulatedCost: billing.accumulatedCost,
                averageLatency: parseFloat((1.1 + Math.random() * 0.7).toFixed(1)), // latencia sigue siendo estimada
                modelDistribution: billing.modelDistribution,
            };
        }
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('❌ getCostAndLatency real error, using mock:', msg);
    }
    return getMockCostAndLatency();
}
// ── Mock helpers ────────────────────────────────────────────────────────
function getMockTokenHistory() {
    const points = [];
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
function getMockCostAndLatency() {
    return {
        accumulatedCost: parseFloat((3800 + Math.random() * 800).toFixed(2)),
        averageLatency: parseFloat((1.1 + Math.random() * 0.7).toFixed(1)),
    };
}
// ═══════════════════════════════════════════════════════════════════════
// MOCK FALLBACKS — Se usan cuando la DB no está configurada o falla
// ═══════════════════════════════════════════════════════════════════════
function mockUniqueUsers(range) {
    const map = { '24h': 1245, '7d': 5830, '30d': 18200, all: 42500 };
    return map[range] ?? 1245;
}
function mockQueryVolume(range) {
    const map = { '24h': 389, '7d': 2450, '30d': 9870, all: 34500 };
    return map[range] ?? 389;
}
function mockNonConflictRate() {
    return 94;
}
function mockAgentHealth() {
    const now = new Date().toISOString();
    return [
        { name: 'Router', status: 'OPERATIVO', lastActivity: now },
        { name: 'Admisor', status: 'OPERATIVO', lastActivity: now },
        { name: 'Informador', status: 'OPERATIVO', lastActivity: now },
        { name: 'Derivador', status: 'OPERATIVO', lastActivity: now },
    ];
}
