import { motion } from 'framer-motion';
import type { AgentStatus } from '@shared/types/dashboard';

interface HealthIndicatorProps {
    agents: AgentStatus[];
}

export function HealthIndicator({ agents }: HealthIndicatorProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="glass-card p-6 h-full"
        >
            <h3 className="text-lg font-semibold text-cream-100 mb-6 tracking-wide">
                Estado de la Red
            </h3>

            <div className="space-y-4">
                {agents.map((agent, i) => {
                    const isActive = agent.status === 'OPERATIVO';

                    return (
                        <motion.div
                            key={agent.name}
                            initial={{ opacity: 0, x: -16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + i * 0.08, duration: 0.35 }}
                            className="flex items-center justify-between py-1 group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 text-panel-300 font-mono text-sm">
                                    <span>[</span>
                                    <motion.span
                                        className={`w-3 h-3 rounded-full inline-block
                                        ${isActive
                                                ? 'bg-leaf-400 led-pulse'
                                                : 'bg-red-400 led-pulse-red'
                                            }`}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 400,
                                            damping: 10,
                                            delay: 0.7 + i * 0.1,
                                        }}
                                    />
                                    <span>]</span>
                                </div>

                                <span className="text-cream-100 font-semibold text-sm
                                           group-hover:text-sand-300 transition-colors duration-200">
                                    {agent.name}
                                </span>
                            </div>

                            <motion.span
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.8 + i * 0.1 }}
                                className={`text-xs font-bold tracking-widest px-2.5 py-1 rounded-md
                                ${isActive
                                        ? 'text-leaf-400 bg-leaf-400/10'
                                        : 'text-red-400 bg-red-400/10'
                                    }`}
                            >
                                {agent.status}
                            </motion.span>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}
