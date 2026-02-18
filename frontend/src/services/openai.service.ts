// ─── OpenAI Billing Frontend Service ───────────────────────────────────

import type { DateRangeKey, OpenAiBillingData } from '@shared/types/dashboard';

/**
 * Obtiene datos de billing de OpenAI desde el backend.
 * Devuelve null si el backend no tiene la Admin Key configurada.
 */
export async function fetchOpenAiBilling(range: DateRangeKey): Promise<OpenAiBillingData | null> {
    try {
        const res = await fetch(`/api/openai/billing?range=${range}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.isMock) return null;
        return data as OpenAiBillingData;
    } catch (err) {
        console.warn('OpenAI billing unavailable:', err);
        return null;
    }
}
