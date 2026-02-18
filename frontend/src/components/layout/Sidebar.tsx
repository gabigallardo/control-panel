import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
    {
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
            </svg>
        ),
        label: 'Dashboard',
        active: true,
    },
    {
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
        label: 'Analytics',
        active: false,
    },
    {
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
        ),
        label: 'Logs',
        active: false,
    },
    {
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
        label: 'Documentos',
        active: false,
    },
    {
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
        label: 'Config',
        active: false,
    },
];

function NavTooltip({ label, show }: { label: string; show: boolean }) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, x: -8, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -4, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute left-full ml-3 px-3 py-1.5 rounded-lg
                           bg-panel-800 text-cream-100 text-xs font-medium
                           border border-sand-300/10 shadow-lg shadow-panel-950/40
                           whitespace-nowrap z-50 pointer-events-none"
                >
                    {label}
                    <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2
                              w-2 h-2 rotate-45 bg-panel-800 border-l border-b border-sand-300/10" />
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export function Sidebar() {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <motion.aside
            initial={{ x: -64, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="w-16 min-h-screen bg-panel-900/90 backdrop-blur-md
                      border-r border-panel-500/15
                      flex flex-col items-center py-6 gap-2"
        >
            {/* Logo */}
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-leaf-400 to-leaf-500
                      flex items-center justify-center mb-6 shadow-lg shadow-leaf-400/20"
            >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </motion.div>

            {/* Nav items */}
            <nav className="flex flex-col items-center gap-1 flex-1">
                {navItems.map((item, i) => (
                    <motion.div
                        key={item.label}
                        className="relative"
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.06, duration: 0.3 }}
                    >
                        <button
                            title={item.label}
                            className={`relative w-10 h-10 rounded-xl flex items-center justify-center
                            transition-all duration-200
                            ${item.active
                                    ? 'text-leaf-400'
                                    : 'text-panel-300 hover:text-cream-100 hover:bg-panel-700/50'
                                }`}
                        >
                            {item.active && (
                                <motion.div
                                    layoutId="activeNav"
                                    className="absolute inset-0 rounded-xl bg-leaf-400/12
                                         shadow-sm shadow-leaf-400/8"
                                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                />
                            )}
                            <span className="relative z-10">{item.icon}</span>
                        </button>

                        <NavTooltip label={item.label} show={hoveredIndex === i} />
                    </motion.div>
                ))}
            </nav>
        </motion.aside>
    );
}
