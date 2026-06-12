'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { Circle, FileCheck, Globe, Network, ArrowRight, ChevronRight } from 'lucide-react';

const features = [
  {
    icon: FileCheck,
    title: 'Export-Ready Quotes',
    description: 'Generate professional, structured quotations ready for international buyers in minutes.',
  },
  {
    icon: Globe,
    title: 'Global Currencies',
    description: 'Price in any currency with live FX rates, buffers, and multi-currency cost breakdowns.',
  },
  {
    icon: Network,
    title: 'Supplier Network',
    description: 'Manage your supplier relationships, certifications, and export capabilities in one place.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: 'easeOut' },
  }),
};

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0d0d0d', color: '#f5f5f5' }}>

      {/* Navbar */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/8">
        <Link href="/" className="flex items-center gap-2">
          <Circle className="h-5 w-5 fill-white text-white" />
          <span className="text-lg font-semibold tracking-tight">FHI</span>
        </Link>

        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
          >
            Get Started <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <motion.div
          className="max-w-2xl mx-auto space-y-8"
          initial="hidden"
          animate="show"
        >
          {/* Eyebrow */}
          <motion.p
            custom={0}
            variants={fadeUp}
            className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-white/40 border border-white/10 rounded-full px-4 py-1.5"
          >
            <Circle className="w-1.5 h-1.5 fill-white/40" />
            Export Trade Platform
          </motion.p>

          {/* Headline */}
          <motion.h1
            custom={1}
            variants={fadeUp}
            className="text-5xl sm:text-6xl font-semibold tracking-tight leading-tight"
          >
            Trade smarter.
            <br />
            <span className="text-white/40">Quote faster.</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            custom={2}
            variants={fadeUp}
            className="text-base text-white/50 leading-relaxed max-w-md mx-auto"
          >
            Flourish High International — a unified platform for export costing,
            quotation management, and buyer–supplier CRM.
          </motion.p>

          {/* CTAs */}
          <motion.div
            custom={3}
            variants={fadeUp}
            className="flex items-center justify-center gap-4 pt-2"
          >
            <Link
              href="/register"
              className="flex items-center gap-2 px-6 py-3 text-sm font-medium bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
            >
              Start for free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 text-sm text-white/60 hover:text-white border border-white/10 rounded-lg hover:border-white/20 transition-colors"
            >
              Sign in
            </Link>
          </motion.div>
        </motion.div>

        {/* Feature cards */}
        <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full mx-auto px-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i + 4}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-3 p-6 rounded-xl border border-white/8 bg-white/3 text-left hover:border-white/15 transition-colors"
            >
              <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/8">
                <f.icon className="w-4 h-4 text-white/70" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{f.title}</p>
                <p className="text-xs text-white/40 mt-1 leading-relaxed">{f.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-6 border-t border-white/8 flex items-center justify-between">
        <p className="text-xs text-white/25">
          © {new Date().getFullYear()} Flourish High International
        </p>
        <p className="text-xs text-white/20 tracking-widest uppercase">
          Export · Quote · Grow
        </p>
      </footer>
    </div>
  );
}
