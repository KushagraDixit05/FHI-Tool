'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { Circle, Eye, EyeOff, Globe, Network, FileCheck, Code2 } from 'lucide-react';
import type { ElementType } from 'react';
import { useAuthStore } from '@/store/auth.store';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

function FeaturePill({ icon: Icon, label }: { icon: ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white">
      <Icon className="h-4 w-4 text-white/60" />
      {label}
    </div>
  );
}

function SocialButton({ icon: Icon, label }: { icon: ElementType; label: string }) {
  return (
    <button
      type="button"
      className="flex items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-black px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/5 active:scale-[0.98]"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

/* ─────────────────────────────────────────────
   Animation helpers
───────────────────────────────────────────── */

const heroContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const heroItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
      document.cookie = `fhi_token=${useAuthStore.getState().token}; path=/; max-age=${7 * 24 * 3600}`;
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Invalid credentials';
      toast.error(msg);
    }
  };

  return (
    <main className="flex min-h-screen w-full bg-black p-2 text-white selection:bg-white/30 transition-all duration-500 lg:h-screen lg:overflow-hidden lg:p-4">

      {/* ── Left Column (Hero) ─────────────────── */}
      <div className="relative hidden h-full w-[52%] flex-col items-center justify-center overflow-hidden rounded-3xl px-12 shadow-2xl lg:flex">

        {/* Background Video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_081238_406ed0e3-5d83-436e-a512-0bbff7ec5b95.mp4"
            type="video/mp4"
          />
        </video>

        {/* Hero Content */}
        <motion.div
          className="relative z-10 w-full max-w-xs space-y-8"
          variants={heroContainer}
          initial="hidden"
          animate="show"
        >
          {/* Brand */}
          <motion.div variants={heroItem} className="flex items-center gap-2">
            <Circle className="h-5 w-5 fill-white text-white" />
            <span className="text-xl font-semibold tracking-tight">FHI</span>
          </motion.div>

          {/* Heading Block */}
          <motion.div variants={heroItem} className="space-y-2">
            <h1 className="text-4xl font-medium tracking-tight whitespace-nowrap">
              Welcome back
            </h1>
            <p className="px-4 text-sm leading-relaxed text-white/60">
              Log in to access your trade workspace and tools.
            </p>
          </motion.div>

          {/* Feature pills */}
          <motion.div variants={heroItem} className="space-y-2">
            <FeaturePill icon={FileCheck} label="Export-Ready Quotes" />
            <FeaturePill icon={Globe} label="Global Currencies" />
            <FeaturePill icon={Network} label="Supplier Network" />
          </motion.div>
        </motion.div>
      </div>

      {/* ── Right Column (Form) ────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-12 sm:px-12 lg:overflow-hidden lg:px-16 lg:py-6 xl:px-24">
        <motion.div
          className="w-full max-w-xl space-y-8 sm:space-y-10 lg:space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {/* Header */}
          <div className="space-y-1">
            <h2 className="text-3xl font-medium tracking-tight">Log In</h2>
            <p className="text-sm text-white/40">
              Enter your credentials to continue.
            </p>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <SocialButton icon={Globe} label="Google" />
            <SocialButton icon={Code2} label="Github" />
          </div>

          {/* Divider */}
          <div className="relative flex items-center">
            <div className="flex-1 border-t border-white/10" />
            <span className="bg-black px-4 text-xs font-medium uppercase tracking-widest text-white/40">
              Or
            </span>
            <div className="flex-1 border-t border-white/10" />
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-white">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@flourishhigh.com"
                {...register('email')}
                className="h-11 w-full rounded-xl bg-brand-gray px-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-white">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className="h-11 w-full rounded-xl bg-brand-gray px-4 pr-12 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/70"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 h-14 w-full rounded-xl bg-white font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          {/* Footer link */}
          <p className="text-center text-sm text-white/40">
            New to FHI?{' '}
            <Link
              href="/register"
              className="font-medium text-white underline-offset-2 hover:underline"
            >
              Create account
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
