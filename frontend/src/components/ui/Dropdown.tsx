import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DropdownOption {
    key: string;
    label: string;
}

interface DropdownProps {
    options: DropdownOption[];
    value: string;
    onChange: (key: string) => void;
}

export function Dropdown({ options, value, onChange }: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selectedLabel = options.find((o) => o.key === value)?.label ?? value;

    return (
        <div ref={ref} className="relative inline-block text-left">
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                   glass-card text-cream-100
                   hover:border-sand-300/20 transition-colors text-sm font-medium
                   focus:outline-none focus:ring-2 focus:ring-leaf-400/30"
            >
                <span className="w-2 h-2 rounded-full bg-leaf-400 led-pulse" />
                <span>{selectedLabel}</span>
                <motion.svg
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="w-4 h-4 text-panel-300"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className="absolute right-0 mt-2 w-44 rounded-xl shadow-2xl shadow-panel-950/40
                            glass-card z-50 overflow-hidden"
                    >
                        {options.map((opt, i) => (
                            <motion.button
                                key={opt.key}
                                onClick={() => { onChange(opt.key); setIsOpen(false); }}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04, duration: 0.2 }}
                                className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5
                                  transition-all duration-150
                                  ${opt.key === value
                                        ? 'bg-leaf-400/10 text-sand-300'
                                        : 'text-cream-200 hover:bg-panel-800/40 hover:text-sand-300'
                                    }`}
                            >
                                {opt.key === value && (
                                    <motion.span
                                        layoutId="activeRange"
                                        className="w-1.5 h-1.5 rounded-full bg-leaf-400"
                                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                    />
                                )}
                                {opt.label}
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
