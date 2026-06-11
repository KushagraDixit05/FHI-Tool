'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, TrendingUp, Globe, FileText } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import type { Metadata } from 'next';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

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
      // Set cookie for middleware
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
    <div className="space-y-8">
      {/* Logo & Brand */}
      <div className="text-center">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
          style={{ background: 'var(--fhi-navy)' }}
        >
          <Globe className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Flourish High International</h1>
        <p className="text-slate-500 text-sm mt-1">Export Trade Calculator Platform</p>
      </div>

      {/* Login Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-6">Sign in to your account</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
              style={{ '--tw-ring-color': 'var(--fhi-navy)' } as React.CSSProperties}
              placeholder="you@flourishhigh.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                {...register('password')}
                className="w-full px-4 py-2.5 pr-11 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
            style={{ background: 'var(--fhi-navy)' }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in…
              </span>
            ) : (
              'Sign in'
            )}
          </button>
        </form>
      </div>

      {/* Feature pills */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {[
          { icon: TrendingUp, label: 'Costing Engine' },
          { icon: FileText, label: 'PDF Quotations' },
          { icon: Globe, label: 'Multi-currency' },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 text-xs text-slate-500 bg-white/80 border border-slate-200 px-3 py-1.5 rounded-full shadow-sm"
          >
            <Icon className="w-3 h-3" />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
