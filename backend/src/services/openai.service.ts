// ─── OpenAI Billing Service ────────────────────────────────────────────
// Consulta las APIs de organización de OpenAI para obtener costos y uso
// reales. Si la Admin Key no está configurada, devuelve datos mock.

import { env } from '../config/env';
import type { TokenDataPoint, DateRangeKey, OpenAiBillingData, ModelUsage } from '@shared/types/dashboard';
import type { DateRangeOption } from '@shared/types/dateRange';
import { DATE_RANGE_OPTIONS } from '@shared/types/dateRange';

// ── Config ─────────────────────────────────────────────────────────────

const OPENAI_BASE = 'https://api.openai.com/v1/organization';

function isOpenAiConfigured(): boolean {
    return !!env.OPENAI_ADMIN_KEY;
}

function getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        'Authorization': `Bearer ${env.OPENAI_ADMIN_KEY}`,
        'Content-Type': 'application/json',
    };
    if (env.OPENAI_ORG_ID) {
        headers['OpenAI-Organization'] = env.OPENAI_ORG_ID;
    }
    return headers;
}

// ── Helpers ─────────────────────────────────────────────────────────────

function getRangeStartUnix(range: DateRangeKey): number {
    const opt = DATE_RANGE_OPTIONS.find((o: DateRangeOption) => o.key === range);
    if (!opt || opt.minutes === 0) {
        // "all" → últimos 90 días (máximo razonable para la API)
        return Math.floor((Date.now() - 90 * 24 * 60 * 60_000) / 1000);
    }
    return Math.floor((Date.now() - opt.minutes * 60_000) / 1000);
}

// ═══════════════════════════════════════════════════════════════════════
// API CALLS — OpenAI Organization Endpoints
// ═══════════════════════════════════════════════════════════════════════

/**
 * GET /v1/organization/costs
 * Devuelve el costo diario, opcionalmente agrupado por line_item/project_id.
 */
export async function getOpenAiCosts(
    startTime: number,
    endTime?: number,
    groupBy?: string[],
    limit: number = 180,
): Promise<any> {
    const params = new URLSearchParams();
    params.set('start_time', startTime.toString());
    if (endTime) params.set('end_time', endTime.toString());
    params.set('bucket_width', '1d');
    params.set('limit', limit.toString());
    if (groupBy && groupBy.length > 0) {
        groupBy.forEach((g) => params.append('group_by[]', g));
    }

    const url = `${OPENAI_BASE}/costs?${params.toString()}`;
    console.log(`🔍 OpenAI Costs request: ${url}`);

    const headers = getHeaders();
    const res = await fetch(url, { headers });
    if (!res.ok) {
        const body = await res.text();
        console.error(`❌ OpenAI Costs API error ${res.status}: ${body}`);
        throw new Error(`OpenAI Costs API error ${res.status}: ${body}`);
    }
    return res.json();
}

/**
 * GET /v1/organization/usage/completions
 * Devuelve uso de tokens para completions, agrupado por modelo.
 */
export async function getOpenAiCompletionsUsage(
    startTime: number,
    endTime?: number,
    groupBy?: string[],
    limit: number = 180,
): Promise<any> {
    const params = new URLSearchParams();
    params.set('start_time', startTime.toString());
    if (endTime) params.set('end_time', endTime.toString());
    params.set('bucket_width', '1d');
    params.set('limit', limit.toString());
    if (groupBy && groupBy.length > 0) {
        groupBy.forEach((g) => params.append('group_by[]', g));
    }

    const url = `${OPENAI_BASE}/usage/completions?${params.toString()}`;
    console.log(`🔍 OpenAI Usage request: ${url}`);

    const headers = getHeaders();
    const res = await fetch(url, { headers });
    if (!res.ok) {
        const body = await res.text();
        console.error(`❌ OpenAI Usage API error ${res.status}: ${body}`);
        throw new Error(`OpenAI Usage API error ${res.status}: ${body}`);
    }
    return res.json();
}

// ═══════════════════════════════════════════════════════════════════════
// HIGH-LEVEL — Billing Data para el Dashboard
// ═══════════════════════════════════════════════════════════════════════

/**
 * Obtiene datos de billing reales de OpenAI.
 * Si la Admin Key no está configurada, devuelve null (para que el caller
 * use mock data como fallback).
 */
export async function getOpenAiBillingData(range: DateRangeKey): Promise<OpenAiBillingData | null> {
    if (!isOpenAiConfigured()) {
        console.log('⚠️  OPENAI_ADMIN_KEY no configurada — usando datos Mock para billing');
        return null;
    }

    try {
        const startTime = getRangeStartUnix(range);
        const endTime = Math.floor(Date.now() / 1000);

        // Ejecutar ambas consultas en paralelo
        const [costsResponse, usageResponse] = await Promise.all([
            getOpenAiCosts(startTime, endTime, ['line_item']),
            getOpenAiCompletionsUsage(startTime, endTime, ['model']),
        ]);

        // ── Procesar costos acumulados ──
        let accumulatedCost = 0;
        const dailyCosts: { date: string; cost: number }[] = [];

        if (costsResponse?.data) {
            for (const bucket of costsResponse.data) {
                let bucketCost = 0;
                if (bucket.results) {
                    for (const result of bucket.results) {
                        const amount = result.amount?.value ?? 0;
                        bucketCost += amount;
                    }
                }
                accumulatedCost += bucketCost;
                const date = new Date(bucket.start_time * 1000).toISOString().split('T')[0];
                dailyCosts.push({ date, cost: bucketCost });
            }
        }

        // ── Procesar uso de tokens por modelo ──
        const modelMap = new Map<string, ModelUsage>();
        const hourlyTokens = new Map<string, number>();

        if (usageResponse?.data) {
            for (const bucket of usageResponse.data) {
                // Acumular por hora
                const hour = new Date(bucket.start_time * 1000);
                const hourKey = `${hour.getHours().toString().padStart(2, '0')}:00`;

                if (bucket.results) {
                    for (const result of bucket.results) {
                        const model = result.model ?? result.group?.model ?? 'unknown';
                        const inputTokens = result.input_tokens ?? 0;
                        const outputTokens = result.output_tokens ?? 0;
                        const totalTokens = inputTokens + outputTokens;

                        // Agregar al mapa por modelo
                        const existing = modelMap.get(model) || {
                            model,
                            inputTokens: 0,
                            outputTokens: 0,
                            totalTokens: 0,
                            cost: 0,
                        };
                        existing.inputTokens += inputTokens;
                        existing.outputTokens += outputTokens;
                        existing.totalTokens += totalTokens;
                        modelMap.set(model, existing);

                        // Agregar al mapa horario
                        hourlyTokens.set(hourKey, (hourlyTokens.get(hourKey) || 0) + totalTokens);
                    }
                }
            }
        }

        // ── Construir tokenHistory (24 horas) ──
        const tokenHistory: TokenDataPoint[] = [];
        for (let h = 0; h < 24; h++) {
            const hourKey = `${h.toString().padStart(2, '0')}:00`;
            const tokens = hourlyTokens.get(hourKey) || 0;
            // Costo estimado basado en precio promedio por token
            const cost = parseFloat((tokens * 0.000003).toFixed(4));
            tokenHistory.push({ hour: hourKey, tokens, cost });
        }

        // ── Model distribution ──
        const modelDistribution: ModelUsage[] = Array.from(modelMap.values()).sort(
            (a, b) => b.totalTokens - a.totalTokens,
        );

        console.log(`✅ OpenAI Billing: costo=$${accumulatedCost.toFixed(2)}, modelos=${modelDistribution.length}`);

        return {
            accumulatedCost: parseFloat(accumulatedCost.toFixed(2)),
            tokenHistory,
            modelDistribution,
        };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('❌ OpenAI Billing error:', msg);
        return null; // Fallback a mock
    }
}
