// ─── OpenAI Billing Controller ─────────────────────────────────────────

import { Request, Response } from 'express';
import type { DateRangeKey } from '@shared/types/dashboard';
import { getOpenAiBillingData } from '../services/openai.service';

const VALID_RANGES: DateRangeKey[] = ['24h', '7d', '30d', 'all'];

/**
 * GET /api/openai/billing?range=24h|7d|30d|all
 * Devuelve datos de billing de OpenAI (costos, tokens, modelos).
 * Si no hay Admin Key configurada, devuelve un objeto con isMock: true.
 */
export async function getOpenAiBilling(req: Request, res: Response): Promise<void> {
    try {
        const rangeParam = (req.query.range as string) || '24h';
        const range: DateRangeKey = VALID_RANGES.includes(rangeParam as DateRangeKey)
            ? (rangeParam as DateRangeKey)
            : '24h';

        console.log(`💰 OpenAI Billing request — range: ${range}`);

        const billingData = await getOpenAiBillingData(range);

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
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('❌ OpenAI Billing controller error:', msg);
        res.status(500).json({
            error: 'Error obteniendo datos de billing de OpenAI',
            detail: process.env.NODE_ENV === 'development' ? msg : undefined,
        });
    }
}
