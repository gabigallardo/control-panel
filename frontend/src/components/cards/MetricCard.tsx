import { motion } from 'framer-motion';
import { AnimatedCounter } from '../ui/AnimatedCounter';

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    prefix?: string;
    icon?: React.ReactNode;
    index?: number;
}

export function MetricCard({ title, value, subtitle, prefix, icon, index = 0 }: MetricCardProps) {
    const isNumericValue = typeof value === 'number';

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="group relative glass-card glow-border p-6 overflow-hidden cursor-default"
        >
            {/* Ambient glow on hover */}
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full
                      bg-leaf-400/0 group-hover:bg-leaf-400/8
                      transition-all duration-700 blur-2xl" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-panel-300 tracking-wide">
                        {title}
                    </p>
                    {icon && (
                        <motion.div
                            className="text-panel-400 group-hover:text-leaf-400 transition-colors duration-300"
                            whileHover={{ scale: 1.15, rotate: 8 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                        >
                            {icon}
                        </motion.div>
                    )}
                </div>

                <h3 className="text-3xl lg:text-4xl font-bold text-cream-100 tracking-tight">
                    {prefix && <span className="text-2xl lg:text-3xl text-leaf-400">{prefix}</span>}
                    {isNumericValue ? (
                        <AnimatedCounter value={value as number} duration={1400} />
                    ) : (
                        <motion.span
                            key={String(value)}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {value}
                        </motion.span>
                    )}
                </h3>

                {subtitle && (
                    <p className="text-xs text-panel-400 mt-2 font-medium">
                        {subtitle}
                    </p>
                )}
            </div>
        </motion.div>
    );
}
