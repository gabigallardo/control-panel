// ─── Shared Types: Dashboard ───────────────────────────────────────────

export type DateRangeKey = '24h' | '7d' | '30d' | '12m';

export interface AgentStatus {
  name: string;
  status: 'OPERATIVO' | 'INACTIVO';
  lastActivity: string; // ISO timestamp
}

export interface TokenDataPoint {
  hour: string;   // e.g. "00:00", "01:00"
  tokens: number;
  cost: number;   // USD
}

export interface ModelUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;   // USD
}

export interface DashboardMetrics {
  uniqueUsers: number;
  queryVolume: number;
  nonConflictRate: number;      // 0–100 percentage
  accumulatedCost: number;      // USD
  averageLatency: number;       // seconds
  agents: AgentStatus[];
  tokenHistory: TokenDataPoint[];
  modelDistribution?: ModelUsage[];  // opcional — solo cuando hay datos reales
}

export interface OpenAiBillingData {
  accumulatedCost: number;      // USD — gasto total en el rango
  tokenHistory: TokenDataPoint[];
  modelDistribution: ModelUsage[];
}

