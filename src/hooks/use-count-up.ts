"use client";

import { useEffect, useState } from "react";
import { animate } from "framer-motion";

/**
 * A hook to smoothly increment a number from 0 to the target value.
 * Perfect for dashboard metric counters.
 */
export function useCountUp(
    targetValue: number,
    options: { duration?: number; delay?: number } = {}
) {
    const { duration = 0.8, delay = 0 } = options;
    const [count, setCount] = useState(0);

    useEffect(() => {
        // We defer the animation start if there's a delay, 
        // useful to wait for page load staggers.
        const timeoutId = setTimeout(() => {
            const controls = animate(0, targetValue, {
                duration,
                ease: "easeOut",
                onUpdate: (value) => {
                    // We round to 1 decimal place if the target is a float (like 4.2), 
                    // or whole number if it's an integer.
                    const isInt = Number.isInteger(targetValue);
                    if (isInt) {
                        setCount(Math.round(value));
                    } else {
                        // Keep one decimal precision
                        setCount(Number(value.toFixed(1)));
                    }
                }
            });

            return controls.stop;
        }, delay * 1000);

        return () => clearTimeout(timeoutId);
    }, [targetValue, duration, delay]);

    return count;
}
