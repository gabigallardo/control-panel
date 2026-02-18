"use strict";
// ─── OpenAI Billing Controller ─────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOpenAiBilling = getOpenAiBilling;
const openai_service_1 = require("../services/openai.service");
const VALID_RANGES = ['24h', '7d', '30d', 'all'];
/**
 * GET /api/openai/billing?range=24h|7d|30d|all
 * Devuelve datos de billing de OpenAI (costos, tokens, modelos).
 * Si no hay Admin Key configurada, devuelve un objeto con isMock: true.
 */
async function getOpenAiBilling(req, res) {
    try {
        const rangeParam = req.query.range || '24h';
        const range = VALID_RANGES.includes(rangeParam)
            ? rangeParam
            : '24h';
        console.log(`💰 OpenAI Billing request — range: ${range}`);
        const billingData = await (0, openai_service_1.getOpenAiBillingData)(range);
        if (!billingData) {
            res.json({
                isMock: true,
                message: 'OPENAI_ADMIN_KEY no configurada — datos mock',
            });
            return;
        }
        res.json({
            isMock: false,
            ...billingData,
        });
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('❌ OpenAI Billing controller error:', msg);
        res.status(500).json({
            error: 'Error obteniendo datos de billing de OpenAI',
            detail: process.env.NODE_ENV === 'development' ? msg : undefined,
        });
    }
}
