import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../utils/currency';

interface ExpenseRevealProps {
    expenses: number;
    year: number;
    trigger: boolean;
}

const ExpenseReveal: React.FC<ExpenseRevealProps> = ({ expenses, year, trigger }) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (trigger && year > 0) {
            setShow(true);
            const timer = setTimeout(() => setShow(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [trigger, year]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 0, scale: 0.8 }}
                    animate={{ opacity: 1, y: -100, scale: 1.2 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    style={{
                        position: 'absolute',
                        left: '20%', // Usually near Bucket 1
                        top: '40%',
                        color: 'var(--color-danger)',
                        fontWeight: 'bold',
                        fontSize: '1.5rem',
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        zIndex: 100,
                        pointerEvents: 'none'
                    }}
                >
                    -{formatCurrency(expenses)}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ExpenseReveal;
