'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function WelcomeScreen() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Check if we've already shown the welcome screen in this session
        const hasShown = sessionStorage.getItem('hasShownWelcome');
        if (hasShown) {
            setIsVisible(false);
            return;
        }

        // Show for 2.5 seconds then hide
        const timer = setTimeout(() => {
            setIsVisible(false);
            sessionStorage.setItem('hasShownWelcome', 'true');
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background text-foreground"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-center"
                    >
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                            Dekaiah Dash
                        </h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            className="mt-4 text-lg text-muted-foreground"
                        >
                            Your private ride awaits
                        </motion.p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
