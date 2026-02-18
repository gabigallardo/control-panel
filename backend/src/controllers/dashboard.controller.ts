import { Request, Response } from 'express';
import type { DashboardMetrics, DateRangeKey } from '@shared/types/dashboard';
import {
    getUniqueUsers,
    getQueryVolume,
    getNonConflictRate,
    getAgentHealth,
    getMockTokenHistory,
    getMockCostAndLatency,
} from '../services/dashboard.service';

const VALID_RANGES: DateRangeKey[] = ['24h', '7d', '30d', 'all'];

export async function getDashboardMetrics(req: Request, res: Response): Promise<void> {
    try {
        const rangeParam = (req.query.range as string) || '24h';
        const range: DateRangeKey = VALID_RANGES.includes(rangeParam as DateRangeKey)
            ? (rangeParam as DateRangeKey)
            : '24h';

        console.log(`📊 Dashboard request — range: ${range}`);

        // Ejecutar todas las consultas en paralelo para máximo rendimiento
        const [uniqueUsers, queryVolume, nonConflictRate, agents, tokenHistory, costAndLatency] =
            await Promise.all([
                getUniqueUsers(range),
                getQueryVolume(range),
                getNonConflictRate(range),
                getAgentHealth(),
                Promise.resolve(getMockTokenHistory()),       // Mock — sin OpenAI key
                Promise.resolve(getMockCostAndLatency()),     // Mock — sin OpenAI key
            ]);

        const metrics: DashboardMetrics = {
            uniqueUsers,
            queryVolume,
            nonConflictRate,
            accumulatedCost: costAndLatency.accumulatedCost,
            averageLatency: costAndLatency.averageLatency,
            agents,
            tokenHistory,
        };

        res.json(metrics);
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('❌ Dashboard controller error:', msg);
        res.status(500).json({
            error: 'Error interno del servidor',
            detail: process.env.NODE_ENV === 'development' ? msg : undefined,
        });
    }
}
