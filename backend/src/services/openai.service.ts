import https from 'https';
import { IncomingMessage } from 'http';
import { env } from '../config/env';
import type { TokenDataPoint, DateRangeKey, OpenAiBillingData, ModelUsage } from '@shared/types/dashboard';
import type { DateRangeOption } from '@shared/types/dateRange';
import { DATE_RANGE_OPTIONS } from '@shared/types/dateRange';

// ── Constants ──────────────────────────────────────────────────────────

const MODEL_PRICES: Record<string, { input: number; output: number }> = {
    // GPT-4o
    'gpt-4o': { input: 2.50, output: 10.00 }, // $2.50 / $10.00 per 1M (Updated Aug 2024)
    'gpt-4o-2024-05-13': { input: 5.00, output: 15.00 },
    'gpt-4o-2024-08-06': { input: 2.50, output: 10.00 },

    // GPT-4o-mini
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4o-mini-2024-07-18': { input: 0.15, output: 0.60 },

    // GPT-4 Turbo
    'gpt-4-turbo': { input: 10.00, output: 30.00 },
    'gpt-4-turbo-2024-04-09': { input: 10.00, output: 30.00 },
    'gpt-4-0125-preview': { input: 10.00, output: 30.00 },
    'gpt-4-1106-preview': { input: 10.00, output: 30.00 },

    // GPT-3.5 Turbo
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
    'gpt-3.5-turbo-0125': { input: 0.50, output: 1.50 },
    'gpt-3.5-turbo-1106': { input: 1.00, output: 2.00 },
};

// Default fallback price (approx gpt-3.5-turbo legacy)
const DEFAULT_PRICE = { input: 0.50, output: 1.50 };

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
        // "all" → últimos 90 días (maximo razonable para una visualización diaria)
        return Math.floor((Date.now() - 90 * 24 * 60 * 60_000) / 1000);
    }
    return Math.floor((Date.now() - opt.minutes * 60_000) / 1000);
}

/**
 * Selecciona bucket_width y limit apropiados según las restricciones de OpenAI:
 *   bucket_width=1m  → max limit 1440
 *   bucket_width=1h  → max limit 168
 *   bucket_width=1d  → max limit 31
 */
function getBucketConfig(range: DateRangeKey): { bucketWidth: string; limit: number } {
    switch (range) {
        case '24h':
            return { bucketWidth: '1h', limit: 24 };
        case '7d':
            return { bucketWidth: '1d', limit: 7 };
        case '30d':
            return { bucketWidth: '1d', limit: 31 };
        case 'all':
        default:
            return { bucketWidth: '1d', limit: 91 };
    }
}

// ── Custom Fetch IPv4 ──────────────────────────────────────────────────

/**
 * Custom fetch implementation that forces IPv4 (family: 4).
 * Node.js v20+ on Windows has issues resolving IPv6 for some domains (like api.openai.com),
 * causing fetch to hang/timeout. This forces IPv4 usage.
 */
async function fetchIPv4(url: string, options: { headers?: Record<string, string>; signal?: AbortSignal }): Promise<{
    ok: boolean;
    status: number;
    text: () => Promise<string>;
    json: () => Promise<any>;
}> {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);

        const reqOptions = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: options.headers,
            family: 4, // ⚡ FORCE IPv4
            timeout: 10_000, // 10s timeout
        };

        const req = https.request(reqOptions, (res: IncomingMessage) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({
                    ok: (res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 300,
                    status: res.statusCode ?? 0,
                    text: async () => data,
                    json: async () => JSON.parse(data),
                });
            });
        });

        req.on('error', (err) => reject(new Error(`IPv4 Fetch Error: ${err.message}`)));

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('IPv4 Fetch Timeout (10s)'));
        });

        if (options.signal) {
            options.signal.addEventListener('abort', () => {
                req.destroy();
                reject(new Error('IPv4 Fetch Aborted'));
            });
        }

        req.end();
    });
}

// ═══════════════════════════════════════════════════════════════════════
// API CALLS — OpenAI Organization Endpoints
// ═══════════════════════════════════════════════════════════════════════

/**
 * GET /v1/organization/costs
 * Devuelve el costo, opcionalmente agrupado por line_item/project_id.
 */
export async function getOpenAiCosts(
    startTime: number,
    endTime: number,
    bucketWidth: string,
    limit: number,
    groupBy?: string[],
): Promise<any> {
    // OpenAI Costs API solo soporta bucket_width='1d'
    const finalBucketWidth = '1d';
    const finalLimit = 31;

    const params = new URLSearchParams();
    params.set('start_time', startTime.toString());
    params.set('end_time', endTime.toString());
    params.set('bucket_width', finalBucketWidth);
    params.set('limit', finalLimit.toString());
    if (groupBy && groupBy.length > 0) {
        groupBy.forEach((g) => params.append('group_by[]', g));
    }

    const url = `${OPENAI_BASE}/costs?${params.toString()}`;
    console.log(`🔍 OpenAI Costs request: ${url}`);

    const headers = getHeaders();

    // Usar nuestro custom fetch IPv4
    const res = await fetchIPv4(url, { headers });

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
    endTime: number,
    bucketWidth: string,
    limit: number,
    groupBy?: string[],
): Promise<any> {
    const params = new URLSearchParams();
    params.set('start_time', startTime.toString());
    params.set('end_time', endTime.toString());
    params.set('bucket_width', bucketWidth);
    params.set('limit', limit.toString());
    if (groupBy && groupBy.length > 0) {
        groupBy.forEach((g) => params.append('group_by[]', g));
    }

    const url = `${OPENAI_BASE}/usage/completions?${params.toString()}`;
    console.log(`🔍 OpenAI Usage request: ${url}`);

    const headers = getHeaders();

    // Usar nuestro custom fetch IPv4
    const res = await fetchIPv4(url, { headers });

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
        const { bucketWidth, limit } = getBucketConfig(range);

        console.log(`📡 OpenAI query: range=${range}, bucket=${bucketWidth}, limit=${limit}`);

        // Ejecutar ambas consultas en paralelo
        const [costsResponse, usageResponse] = await Promise.all([
            getOpenAiCosts(startTime, endTime, bucketWidth, limit, ['line_item']),
            getOpenAiCompletionsUsage(startTime, endTime, bucketWidth, limit, ['model']),
        ]);

        // ── Procesar costos acumulados ──
        let accumulatedCost = 0;
        const dailyCosts: { date: string; cost: number }[] = [];

        if (costsResponse?.data) {
            for (const bucket of costsResponse.data) {
                let bucketCost = 0;
                if (bucket.results) {
                    for (const result of bucket.results) {
                        const amount = Number(result.amount?.value ?? 0);
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
        const hourlyCalculatedCosts = new Map<string, number>(); // Nuevo: costos horarios estimados

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

                        // Determinar precio del modelo
                        const price = MODEL_PRICES[model] || MODEL_PRICES[model.replace(/-20\d{2}-\d{2}-\d{2}$/, '')] || DEFAULT_PRICE;

                        // Calcular costo
                        const cost = (inputTokens / 1_000_000 * price.input) + (outputTokens / 1_000_000 * price.output);

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
                        existing.cost += cost; // Acumular costo por modelo
                        modelMap.set(model, existing);

                        // Agregar al mapa horario
                        hourlyTokens.set(hourKey, (hourlyTokens.get(hourKey) || 0) + totalTokens);
                        hourlyCalculatedCosts.set(hourKey, (hourlyCalculatedCosts.get(hourKey) || 0) + cost);
                    }
                }
            }
        }

        // ── Procesar uso de tokens (Hourly vs Daily) ──
        const tokenHistory: TokenDataPoint[] = [];

        if (range === '24h') {
            // Lógica para 24h: Usar costos calculados basados en modelos
            for (let h = 0; h < 24; h++) {
                const hourKey = `${h.toString().padStart(2, '0')}:00`;
                const tokens = hourlyTokens.get(hourKey) || 0;
                // Usar costo calculado si existe, sino 0
                const cost = parseFloat((hourlyCalculatedCosts.get(hourKey) || 0).toFixed(6));
                tokenHistory.push({ hour: hourKey, tokens, cost });
            }
        } else {
            // Lógica para rangos DIARIOS (7d, 30d, all)
            // OpenAI devuelve 'usageResponse' con bucket_width=1d, grouped by model.
            // Necesitamos agrupar por DÍA.

            const dailyTokens = new Map<string, number>();

            if (usageResponse?.data) {
                for (const bucket of usageResponse.data) {
                    const date = new Date(bucket.start_time * 1000).toISOString().split('T')[0]; // YYYY-MM-DD

                    let totalBucketTokens = 0;
                    if (bucket.results) {
                        for (const res of bucket.results) {
                            totalBucketTokens += (res.input_tokens ?? 0) + (res.output_tokens ?? 0);
                        }
                    }
                    dailyTokens.set(date, (dailyTokens.get(date) || 0) + totalBucketTokens);
                }
            }

            // Generar array de fechas para el eje X
            const start = new Date(startTime * 1000);
            const end = new Date(endTime * 1000);

            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const isoDate = d.toISOString().split('T')[0];
                const dayLabel = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`; // DD/MM

                const tokens = dailyTokens.get(isoDate) || 0;

                // Buscar costo real de manera segura
                const dailyCostEntry = dailyCosts.find(c => c.date === isoDate);
                // Si existe entrada pero cost es 0, queremos usar 0, no el fallback.
                let realCost = (dailyCostEntry && typeof dailyCostEntry.cost === 'number')
                    ? dailyCostEntry.cost
                    : 0; // Si no hay dato de costo real, asumimos 0 por ahora (o podríamos sumar costos estimados models)

                // Si costo real es 0 pero hay tokens, intentar usar estimado models (opcional, pero consistente con 24h)
                // Para simplificar, en vista diaria preferimos el costo 'real' de la API de costos si está disponible.

                tokenHistory.push({
                    hour: dayLabel,
                    tokens,
                    cost: parseFloat(realCost.toFixed(4))
                });
            }
        }

        // ── Model distribution ──
        const modelDistribution: ModelUsage[] = Array.from(modelMap.values()).sort(
            (a, b) => b.totalTokens - a.totalTokens,
        );

        // ── Recalcular accumulatedCost basado en tokenHistory ──
        const totalCalculatedCost = tokenHistory.reduce((acc, curr) => acc + curr.cost, 0);

        // Si el costo de la API es 0 (o mucho menor al calculado), usar el calculado.
        const finalAccumulatedCost = (accumulatedCost === 0 || totalCalculatedCost > accumulatedCost)
            ? totalCalculatedCost
            : accumulatedCost;

        console.log(`✅ OpenAI Billing: costoAPI=$${accumulatedCost.toFixed(4)}, costoCalc=$${totalCalculatedCost.toFixed(4)}, final=$${finalAccumulatedCost.toFixed(4)}`);

        return {
            accumulatedCost: parseFloat(finalAccumulatedCost.toFixed(4)),
            tokenHistory,
            modelDistribution,
        };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('❌ OpenAI Billing error:', msg);
        return null; // Fallback a mock
    }
}
