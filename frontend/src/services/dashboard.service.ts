import type { DashboardMetrics, DateRangeKey } from '@shared/types/dashboard';

// ── Mock data fallback (frontend-only, no backend needed) ──────────────

function generateMockData(range: DateRangeKey): DashboardMetrics {
    const rangeMap: Record<DateRangeKey, { users: number; volume: number }> = {
        '24h': { users: 1245, volume: 389 },
        '7d': { users: 5830, volume: 2450 },
        '30d': { users: 18200, volume: 9870 },
        'all': { users: 42500, volume: 34500 },
    };

    const { users, volume } = rangeMap[range];

    const tokenHistory = Array.from({ length: 24 }, (_, h) => {
        const multiplier = h >= 9 && h <= 18 ? 2.5 : 1;
        const tokens = Math.max(100, Math.round((800 + (Math.random() - 0.3) * 400) * multiplier));
        return {
            hour: `${h.toString().padStart(2, '0')}:00`,
            tokens,
            cost: parseFloat((tokens * 0.0015).toFixed(2)),
        };
    });

    return {
        uniqueUsers: users,
        queryVolume: volume,
        nonConflictRate: 94,
        accumulatedCost: parseFloat((3800 + Math.random() * 800).toFixed(2)),
        averageLatency: parseFloat((1.1 + Math.random() * 0.7).toFixed(1)),
        agents: [
            { name: 'Router', status: 'OPERATIVO', lastActivity: new Date().toISOString() },
            { name: 'Admisor', status: 'OPERATIVO', lastActivity: new Date().toISOString() },
            { name: 'Informador', status: 'OPERATIVO', lastActivity: new Date().toISOString() },
            { name: 'Derivador', status: 'OPERATIVO', lastActivity: new Date().toISOString() },
        ],
        tokenHistory,
    };
}

// ── API ────────────────────────────────────────────────────────────────

export async function fetchDashboardMetrics(range: DateRangeKey): Promise<DashboardMetrics> {
    try {
        const res = await fetch(`/api/dashboard?range=${range}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.warn('Backend unreachable, using mock data:', err);
        return generateMockData(range);
    }
}
