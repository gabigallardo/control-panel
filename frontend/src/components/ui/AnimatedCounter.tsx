import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
    value: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
    locale?: string;
    className?: string;
}

export function AnimatedCounter({
    value,
    duration = 1200,
    prefix = '',
    suffix = '',
    locale = 'es-AR',
    className = '',
}: AnimatedCounterProps) {
    const [displayValue, setDisplayValue] = useState(0);
    const prevValue = useRef(0);
    const rafId = useRef<number>(0);

    useEffect(() => {
        const startValue = prevValue.current;
        const diff = value - startValue;
        const startTime = performance.now();

        const easeOutExpo = (t: number) =>
            t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutExpo(progress);

            const current = Math.round(startValue + diff * easedProgress);
            setDisplayValue(current);

            if (progress < 1) {
                rafId.current = requestAnimationFrame(animate);
            } else {
                prevValue.current = value;
            }
        };

        rafId.current = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(rafId.current);
    }, [value, duration]);

    return (
        <span className={className}>
            {prefix}{displayValue.toLocaleString(locale)}{suffix}
        </span>
    );
}
