'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { Circle, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName:  z.string().min(1, 'Last name is required'),
  email:     z.string().email('Enter a valid email'),
  password:  z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterForm = z.infer<typeof registerSchema>;

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

function StepItem({
  number,
  text,
  active = false,
}: {
  number: number;
  text: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${active
        ? 'border border-white bg-white text-black'
        : 'bg-brand-gray border-none text-white'
        }`}
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold leading-none ${active ? 'bg-black text-white' : 'bg-white/10 text-white/40'
          }`}
      >
        {number}
      </span>
      {text}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
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

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerAction, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterForm) => {
    try {
      const name = `${data.firstName} ${data.lastName}`.trim();
      await registerAction(name, data.email, data.password);
      document.cookie = `fhi_token=${useAuthStore.getState().token}; path=/; max-age=${7 * 24 * 3600}`;
      toast.success('Account created! Welcome to FHI.');
      router.push('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
      const msg =
        axiosErr?.response?.data?.error ||
        axiosErr?.message ||
        'Registration failed. Please try again.';
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
              Join Flourish High International
            </h1>
            <p className="px-4 text-sm leading-relaxed text-white/60">
              Follow these 3 quick phases to activate your space.
            </p>
          </motion.div>

          {/* Steps */}
          <motion.div variants={heroItem} className="space-y-2">
            <StepItem number={1} text="Create your account" active />
            <StepItem number={2} text="Set up your trade workspace" />
            <StepItem number={3} text="Launch your first quotation" />
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
            <h2 className="text-3xl font-medium tracking-tight">Create New Profile</h2>
            <p className="text-sm text-white/40">
              Input your basic details to begin the journey.
            </p>
          </div>

          {/* Social Buttons */}
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-black px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/5 active:scale-[0.98]"
          >
            <GoogleIcon />
            Continue with Google
          </button>

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
            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="firstName" className="text-sm font-medium text-white">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  placeholder="Jane"
                  {...registerField('firstName')}
                  className="h-11 w-full rounded-xl bg-brand-gray px-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
                {errors.firstName && (
                  <p className="text-xs text-red-400">{errors.firstName.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="lastName" className="text-sm font-medium text-white">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  {...registerField('lastName')}
                  className="h-11 w-full rounded-xl bg-brand-gray px-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
                {errors.lastName && (
                  <p className="text-xs text-red-400">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-white">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="jane@example.com"
                {...registerField('email')}
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
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...registerField('password')}
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
              {errors.password ? (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              ) : (
                <p className="text-xs text-white/30">Requires at least 8 characters.</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 h-14 w-full rounded-xl bg-white font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          {/* Footer link */}
          <p className="text-center text-sm text-white/40">
            Member of the team?{' '}
            <Link
              href="/login"
              className="font-medium text-white underline-offset-2 hover:underline"
            >
              Log in
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
