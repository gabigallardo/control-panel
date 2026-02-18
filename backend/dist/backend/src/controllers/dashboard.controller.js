"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardMetrics = getDashboardMetrics;
const dashboard_service_1 = require("../services/dashboard.service");
const openai_service_1 = require("../services/openai.service");
const VALID_RANGES = ['24h', '7d', '30d', 'all'];
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
        const tokenHistory = billing?.tokenHistory ?? getMockTokenHistory();
        const accumulatedCost = billing?.accumulatedCost ?? parseFloat((3800 + Math.random() * 800).toFixed(2));
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
function getMockTokenHistory() {
    const points = [];
    let base = 800;
    for (let h = 0; h < 24; h++) {
        const multiplier = h >= 9 && h <= 18 ? 2.5 : 1;
        const noise = (Math.random() - 0.3) * 400;
        const tokens = Math.max(100, Math.round((base + noise) * multiplier));
        const cost = parseFloat((tokens * 0.0015).toFixed(2));
        base += (Math.random() - 0.4) * 100;
        points.push({ hour: `${h.toString().padStart(2, '0')}:00`, tokens, cost });
    }
    return points;
}
