"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOpenAiCosts = getOpenAiCosts;
exports.getOpenAiCompletionsUsage = getOpenAiCompletionsUsage;
exports.getOpenAiBillingData = getOpenAiBillingData;
const https_1 = __importDefault(require("https"));
const env_1 = require("../config/env");
const dateRange_1 = require("@shared/types/dateRange");
// ── Config ─────────────────────────────────────────────────────────────
const OPENAI_BASE = 'https://api.openai.com/v1/organization';
function isOpenAiConfigured() {
    return !!env_1.env.OPENAI_ADMIN_KEY;
}
function getHeaders() {
    const headers = {
        'Authorization': `Bearer ${env_1.env.OPENAI_ADMIN_KEY}`,
        'Content-Type': 'application/json',
    };
    if (env_1.env.OPENAI_ORG_ID) {
        headers['OpenAI-Organization'] = env_1.env.OPENAI_ORG_ID;
    }
    return headers;
}
// ── Helpers ─────────────────────────────────────────────────────────────
function getRangeStartUnix(range) {
    const opt = dateRange_1.DATE_RANGE_OPTIONS.find((o) => o.key === range);
    if (!opt || opt.minutes === 0) {
        // "all" → últimos 31 días (máximo para bucket_width=1d)
        return Math.floor((Date.now() - 31 * 24 * 60 * 60000) / 1000);
    }
    return Math.floor((Date.now() - opt.minutes * 60000) / 1000);
}
/**
 * Selecciona bucket_width y limit apropiados según las restricciones de OpenAI:
 *   bucket_width=1m  → max limit 1440
 *   bucket_width=1h  → max limit 168
 *   bucket_width=1d  → max limit 31
 */
function getBucketConfig(range) {
    switch (range) {
        case '24h':
            return { bucketWidth: '1h', limit: 25 };
        case '7d':
            return { bucketWidth: '1d', limit: 8 };
        case '30d':
            return { bucketWidth: '1d', limit: 32 };
        case 'all':
        default:
            return { bucketWidth: '1d', limit: 92 };
    }
}
// ── Custom Fetch IPv4 ──────────────────────────────────────────────────
/**
 * Custom fetch implementation that forces IPv4 (family: 4).
 * Node.js v20+ on Windows has issues resolving IPv6 for some domains (like api.openai.com),
 * causing fetch to hang/timeout. This forces IPv4 usage.
 */
async function fetchIPv4(url, options) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const reqOptions = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: options.headers,
            family: 4, // ⚡ FORCE IPv4
            timeout: 10000, // 10s timeout
        };
        const req = https_1.default.request(reqOptions, (res) => {
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
async function getOpenAiCosts(startTime, endTime, bucketWidth, limit, groupBy) {
    const params = new URLSearchParams();
    params.set('start_time', startTime.toString());
    params.set('end_time', endTime.toString());
    params.set('bucket_width', bucketWidth);
    params.set('limit', limit.toString());
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
async function getOpenAiCompletionsUsage(startTime, endTime, bucketWidth, limit, groupBy) {
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
async function getOpenAiBillingData(range) {
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
        const dailyCosts = [];
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
        const modelMap = new Map();
        const hourlyTokens = new Map();
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
        const tokenHistory = [];
        for (let h = 0; h < 24; h++) {
            const hourKey = `${h.toString().padStart(2, '0')}:00`;
            const tokens = hourlyTokens.get(hourKey) || 0;
            // Costo estimado basado en precio promedio por token
            const cost = parseFloat((tokens * 0.000003).toFixed(4));
            tokenHistory.push({ hour: hourKey, tokens, cost });
        }
        // ── Model distribution ──
        const modelDistribution = Array.from(modelMap.values()).sort((a, b) => b.totalTokens - a.totalTokens);
        console.log(`✅ OpenAI Billing: costo=$${accumulatedCost.toFixed(2)}, modelos=${modelDistribution.length}`);
        return {
            accumulatedCost: parseFloat(accumulatedCost.toFixed(2)),
            tokenHistory,
            modelDistribution,
        };
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('❌ OpenAI Billing error:', msg);
        return null; // Fallback a mock
    }
}
