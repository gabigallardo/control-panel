import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DashboardMetrics, DateRangeKey } from '@shared/types/dashboard';
import { DATE_RANGE_OPTIONS } from '@shared/types/dateRange';
import { fetchDashboardMetrics } from '../services/dashboard.service';
import { MetricCard } from '../components/cards/MetricCard';
import { HealthIndicator } from '../components/cards/HealthIndicator';
import { TokensAreaChart } from '../components/charts/TokensAreaChart';
import { Dropdown } from '../components/ui/Dropdown';
import { AnimatedCounter } from '../components/ui/AnimatedCounter';

export default function Dashboard() {
    const [range, setRange] = useState<DateRangeKey>('24h');
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchDashboardMetrics(range);
            setMetrics(data);
        } catch (err) {
            console.error('Failed to load dashboard:', err);
        } finally {
            setLoading(false);
        }
    }, [range]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const dropdownOptions = DATE_RANGE_OPTIONS.map((o) => ({ key: o.key, label: o.label }));

    return (
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-grid-pattern">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex items-center justify-between mb-8"
            >
                <h1 className="text-2xl lg:text-3xl font-bold text-cream-100 tracking-tight">
                    Panel de Control –{' '}
                    <span className="text-sand-300 font-semibold">Protección al Consumidor</span>
                </h1>
                <Dropdown options={dropdownOptions} value={range} onChange={(k) => setRange(k as DateRangeKey)} />
            </motion.div>

            {/* Loading skeleton with shimmer */}
            {loading && !metrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                    {[1, 2, 3, 4].map((i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.08 }}
                            className="h-32 shimmer"
                        />
                    ))}
                </div>
            )}

            <AnimatePresence mode="wait">
                {metrics && (
                    <motion.div
                        key={range}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                    >
                        {/* KPI Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                            <MetricCard
                                title="Usuarios Únicos"
                                value={metrics.uniqueUsers}
                                index={0}
                                icon={
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                }
                            />
                            <MetricCard
                                title="Volumen de Consultas"
                                value={metrics.queryVolume}
                                index={1}
                                icon={
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                    </svg>
                                }
                            />
                            <MetricCard
                                title="Índice de No-Conflictividad"
                                value={`${metrics.nonConflictRate}%`}
                                subtitle="Basado en feedback positivo de sesiones"
                                index={2}
                                icon={
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                }
                            />
                            <MetricCard
                                title="Gasto Acumulado"
                                value={metrics.accumulatedCost.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                                prefix="$"
                                index={3}
                                icon={
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                }
                            />
                        </div>

                        {/* Main content: Chart + Health */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
                            <div className="lg:col-span-2">
                                <TokensAreaChart data={metrics.tokenHistory} />
                            </div>
                            <div className="lg:col-span-1">
                                <HealthIndicator agents={metrics.agents} />
                            </div>
                        </div>

                        {/* Bottom row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Latency card */}
                            <motion.div
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.45 }}
                                className="glass-card p-6 flex items-center gap-5 group"
                            >
                                <motion.div
                                    className="w-12 h-12 rounded-xl bg-leaf-400/10 flex items-center justify-center"
                                    whileHover={{ scale: 1.08, rotate: -5 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                                >
                                    <svg className="w-6 h-6 text-leaf-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </motion.div>
                                <div>
                                    <p className="text-sm text-panel-300 font-medium">Latencia Promedio</p>
                                    <p className="text-3xl font-bold text-cream-100">
                                        <AnimatedCounter value={metrics.averageLatency * 10} duration={1000} />
                                        <span className="text-panel-400 text-lg ml-0.5">s</span>
                                    </p>
                                </div>
                            </motion.div>

                            {/* Model Distribution */}
                            <motion.div
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.55 }}
                                className="glass-card p-6"
                            >
                                <p className="text-sm text-panel-300 font-medium mb-4">Distribución por Modelo</p>
                                <div className="flex items-end gap-8 h-20">
                                    <div className="flex flex-col items-center gap-2">
                                        <motion.div
                                            className="w-16 bg-gradient-to-t from-leaf-500 to-leaf-400 rounded-md"
                                            initial={{ height: 0 }}
                                            animate={{ height: 60 }}
                                            transition={{ duration: 0.8, delay: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                                        />
                                        <span className="text-xs text-panel-300">GPT-4o</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <motion.div
                                            className="w-16 bg-gradient-to-t from-leaf-300/50 to-leaf-200/40 rounded-md"
                                            initial={{ height: 0 }}
                                            animate={{ height: 35 }}
                                            transition={{ duration: 0.8, delay: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                                        />
                                        <span className="text-xs text-panel-300">GPT-4o-mini</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
