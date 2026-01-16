import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MilestoneCelebrationProps {
    year: number;
    survivalYears: number;
}

const MilestoneCelebration: React.FC<MilestoneCelebrationProps> = ({ year, survivalYears }) => {
    const [show, setShow] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (year > 0 && year % 5 === 0) {
            setMessage(`🎉 Amazing! You've survived ${year} years!`);
            setShow(true);
            const timer = setTimeout(() => setShow(false), 4000);
            return () => clearTimeout(timer);
        } else if (year === survivalYears) {
            setMessage(`🏆 VICTORY! You made it to ${year} years!`);
            setShow(true);
            // Don't auto hide victory
        } else {
            setShow(false);
        }
    }, [year, survivalYears]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ scale: 0.5, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: -50 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    style={{
                        position: 'fixed',
                        top: '10%', // Move to top instead of center
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                        padding: '0.75rem 1.5rem', // Much smaller padding
                        borderRadius: '30px', // Pill shape
                        boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
                        zIndex: 2000,
                        textAlign: 'center',
                        color: 'black',
                        fontWeight: 'bold',
                        fontSize: '1rem', // Smaller text
                        border: '2px solid white', // Thinner border
                        whiteSpace: 'nowrap'
                    }}
                >
                    {message}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MilestoneCelebration;
