import { motion } from 'framer-motion';
import {
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Line,
    ComposedChart,
    Legend,
} from 'recharts';
import type { TokenDataPoint } from '@shared/types/dashboard';

interface TokensAreaChartProps {
    data: TokenDataPoint[];
}

export function TokensAreaChart({ data }: TokensAreaChartProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="glass-card p-6 h-full"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-cream-100 tracking-wide">
                    Consumo de Tokens
                </h3>
                <div className="flex items-center gap-4 text-xs text-panel-300">
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-leaf-400/60 inline-block" />
                        Tokens
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-6 h-0.5 bg-leaf-300 inline-block rounded" />
                        Costo USD
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#87B867" stopOpacity={0.35} />
                                <stop offset="50%" stopColor="#87B867" stopOpacity={0.10} />
                                <stop offset="100%" stopColor="#87B867" stopOpacity={0.01} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(163, 183, 196, 0.08)"
                            vertical={false}
                        />

                        <XAxis
                            dataKey="hour"
                            tick={{ fill: '#7D99AB', fontSize: 11 }}
                            axisLine={{ stroke: 'rgba(163, 183, 196, 0.1)' }}
                            tickLine={false}
                            interval={2}
                        />

                        <YAxis
                            tick={{ fill: '#7D99AB', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            width={45}
                        />

                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(19, 29, 37, 0.95)',
                                backdropFilter: 'blur(8px)',
                                border: '1px solid rgba(244, 223, 185, 0.1)',
                                borderRadius: '12px',
                                color: '#FCF2DC',
                                fontSize: '13px',
                                padding: '10px 14px',
                                boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                            }}
                            labelStyle={{ color: '#A3B7C4', marginBottom: '4px' }}
                            itemStyle={{ padding: '2px 0' }}
                            cursor={{ stroke: 'rgba(244, 223, 185, 0.12)', strokeDasharray: '4 4' }}
                        />

                        <Legend wrapperStyle={{ display: 'none' }} />

                        <Area
                            type="monotone"
                            dataKey="tokens"
                            fill="url(#tokenGradient)"
                            stroke="#87B867"
                            strokeWidth={2}
                            name="Tokens"
                            dot={false}
                            animationDuration={1200}
                            animationEasing="ease-out"
                            activeDot={{
                                r: 5,
                                fill: '#87B867',
                                stroke: '#2B3E4C',
                                strokeWidth: 2,
                            }}
                        />

                        <Line
                            type="monotone"
                            dataKey="cost"
                            stroke="#A3D080"
                            strokeWidth={1.5}
                            dot={false}
                            name="Costo USD"
                            strokeDasharray="4 2"
                            animationDuration={1400}
                            animationEasing="ease-out"
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
