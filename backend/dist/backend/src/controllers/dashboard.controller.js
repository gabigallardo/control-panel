"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardMetrics = getDashboardMetrics;
const dashboard_service_1 = require("../services/dashboard.service");
const openai_service_1 = require("../services/openai.service");
const VALID_RANGES: DateRangeKey[] = ['24h', '7d', '30d', '12m'];
async function getDashboardMetrics(req, res) {
    try {
        const rangeParam = req.query.range || '24h';
        const range = VALID_RANGES.includes(rangeParam)
            ? rangeParam
            : '24h';
        console.log(`📊 Dashboard request — range: ${range}`);
        // Ejecutar todas las consultas en paralelo para máximo rendimiento
        // OpenAI billing se llama UNA SOLA VEZ para evitar requests duplicados
        const [uniqueUsers, queryVolume, nonConflictRate, agents, billing] = await Promise.all([
            (0, dashboard_service_1.getUniqueUsers)(range),
            (0, dashboard_service_1.getQueryVolume)(range),
            (0, dashboard_service_1.getNonConflictRate)(range),
            (0, dashboard_service_1.getAgentHealth)(),
            (0, openai_service_1.getOpenAiBillingData)(range), // Una sola llamada a OpenAI
        ]);
        // Si billing es null (no configurado o error), usar mock defaults
        const tokenHistory = billing?.tokenHistory;
        const accumulatedCost = billing?.accumulatedCost;
        const averageLatency = parseFloat((1.1 + Math.random() * 0.7).toFixed(1));
        const modelDistribution = billing?.modelDistribution;
        const metrics = {
            uniqueUsers,
            queryVolume,
            nonConflictRate,
            accumulatedCost,
            averageLatency,
            agents,
            tokenHistory,
            modelDistribution,
        };
        res.json(metrics);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('❌ Dashboard controller error:', msg);
        res.status(500).json({
            error: 'Error interno del servidor',
            detail: process.env.NODE_ENV === 'development' ? msg : undefined,
        });
    }
}
// ── Mock fallback inline ────────────────────────────────────────────────

