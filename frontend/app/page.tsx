'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Circle } from 'lucide-react';

export default function SplashPage() {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exit = setTimeout(() => setExiting(true), 2000);
    const nav = setTimeout(() => router.push('/home'), 2500);
    return () => {
      clearTimeout(exit);
      clearTimeout(nav);
    };
  }, [router]);

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="splash"
          className="fixed inset-0 flex flex-col items-center justify-center"
          style={{ backgroundColor: '#0d0d0d' }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          {/* Outer pulse ring */}
          <motion.div
            className="absolute rounded-full border border-white/10"
            initial={{ width: 80, height: 80, opacity: 0.6 }}
            animate={{ width: 160, height: 160, opacity: 0 }}
            transition={{ duration: 2, ease: 'easeOut', repeat: Infinity }}
          />

          {/* Logo mark */}
          <motion.div
            className="relative flex flex-col items-center gap-4"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="flex items-center justify-center w-14 h-14 rounded-full border border-white/20 bg-white/5">
              <Circle className="w-6 h-6 fill-white text-white" />
            </div>

            <div className="text-center">
              <p className="text-2xl font-semibold tracking-widest text-white">FHI</p>
              <p className="text-xs tracking-[0.25em] text-white/40 uppercase mt-1">
                Flourish High International
              </p>
            </div>
          </motion.div>

          {/* Loading bar */}
          <motion.div
            className="absolute bottom-16 w-24 h-px bg-white/10 overflow-hidden rounded-full"
          >
            <motion.div
              className="h-full bg-white/50 rounded-full"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.8, ease: 'easeInOut' }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
