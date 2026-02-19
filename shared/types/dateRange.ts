// ─── Shared Types: Date Range ──────────────────────────────────────────

import type { DateRangeKey } from './dashboard';

export interface DateRangeOption {
    key: DateRangeKey;
    label: string;
    minutes: number; // 0 = all time
}

export const DATE_RANGE_OPTIONS: DateRangeOption[] = [
    { key: '24h', label: '24hs', minutes: 1440 },
    { key: '7d', label: '7 días', minutes: 10080 },
    { key: '30d', label: '30 días', minutes: 43200 },
    { key: '12m', label: 'Anual', minutes: 525600 },
];  