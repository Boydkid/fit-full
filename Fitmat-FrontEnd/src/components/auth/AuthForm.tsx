import React from 'react';
import Link from 'next/link';
import { Input, Button } from '../common';

interface AuthFormProps {
  title: string;
  subtitle: string;
  isLogin: boolean;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  confirmPassword?: string;
  setConfirmPassword?: (password: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  showConfirmPassword?: boolean;
  setShowConfirmPassword?: (show: boolean) => void;
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  linkText: string;
  linkHref: string;
  linkLabel: string;
}

export default function AuthForm({
  title,
  subtitle,
  isLogin,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  loading,
  error,
  onSubmit,
  linkText,
  linkHref,
  linkLabel,
}: AuthFormProps) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-2xl flex flex-col items-center gap-6">
        <div className="text-center">
          <div className="text-4xl font-extrabold">
            <span className="text-red-600">F</span>
            <span className="text-slate-800">ITMATE</span>
          </div>
          <p className="text-slate-500 font-semibold tracking-wide mt-2">
            {subtitle}
          </p>
        </div>
        
        <form onSubmit={onSubmit} className="w-full space-y-5">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            autoComplete="email"
            error={error && error.includes('email') ? error : undefined}
          />
          
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder={isLogin ? "••••••••" : "Enter password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={isLogin ? "current-password" : "new-password"}
            showPasswordToggle
            onTogglePassword={() => setShowPassword(!showPassword)}
            showPassword={showPassword}
            error={error && error.includes('password') ? error : undefined}
          />
          
          {!isLogin && confirmPassword !== undefined && setConfirmPassword && (
            <Input
              label="Confirm password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              showPasswordToggle
              onTogglePassword={() => setShowConfirmPassword?.(!showConfirmPassword)}
              showPassword={showConfirmPassword}
              error={error && error.includes('match') ? error : undefined}
            />
          )}
          
          {error && !error.includes('email') && !error.includes('password') && !error.includes('match') && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-2 text-sm text-center">
              {error}
            </div>
          )}
          
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            loading={loading}
            className="w-full"
          >
            {loading ? (isLogin ? "Signing in..." : "Creating account...") : title}
          </Button>
        </form>
        
        <div className="w-full flex justify-between text-sm text-slate-600">
          <Link href={linkHref} className="font-semibold text-blue-700 hover:underline">
            {linkText}
          </Link>
          {isLogin && (
          <Link href="/forgotpass" className="font-semibold text-blue-700 hover:underline">
            Forgot password?
          </Link>
          )}
        </div>
      </div>
    </main>
  );
}
