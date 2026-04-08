'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Eye, EyeOff, LogIn, XCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Logo from '@/app/components/Logo'

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.8 12.23c0-.76-.07-1.49-.2-2.19H12v4.15h5.49a4.7 4.7 0 0 1-2.04 3.08v2.56h3.3c1.93-1.78 3.05-4.39 3.05-7.6Z"
      />
      <path
        fill="currentColor"
        d="M12 22c2.76 0 5.07-.91 6.76-2.47l-3.3-2.56c-.91.61-2.08.98-3.46.98-2.66 0-4.92-1.8-5.72-4.22H2.87v2.64A10 10 0 0 0 12 22Z"
      />
      <path
        fill="currentColor"
        d="M6.28 13.73A5.99 5.99 0 0 1 6 12c0-.6.1-1.17.28-1.73V7.63H2.87A10 10 0 0 0 2 12c0 1.61.39 3.14 1.09 4.37l3.19-2.64Z"
      />
      <path
        fill="currentColor"
        d="M12 6.05c1.5 0 2.84.52 3.9 1.54l2.92-2.92C17.06 3.03 14.75 2 12 2A10 10 0 0 0 2.87 7.63l3.41 2.64c.8-2.42 3.06-4.22 5.72-4.22Z"
      />
    </svg>
  )
}

export default function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const authError = searchParams.get('error')

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    try {
      await signIn(formData.email, formData.password)
      router.push('/dashboard')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid email or password'
      if (error instanceof Error && error.message.toLowerCase().includes('password')) {
        setErrors({ password: errorMessage })
      } else {
        setErrors({ email: errorMessage })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Google sign-in failed'
      setErrors({ email: errorMessage })
      setGoogleLoading(false)
    }
  }

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="min-h-screen bg-[#07140f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.24),transparent_26%),radial-gradient(circle_at_80%_0%,rgba(125,211,252,0.18),transparent_24%)]" />

      <nav className="relative z-20 border-b border-white/8 bg-[#07140f]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo size="md" />
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-96px)] max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid w-full gap-10 lg:grid-cols-[0.95fr_500px] lg:items-center">
          <section>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-200/75">
              Welcome back
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
              Step back into your golf community.
            </h1>
          </section>

          <section className="overflow-hidden rounded-[2.2rem] border border-white/8 bg-[linear-gradient(160deg,rgba(14,35,29,0.95),rgba(8,20,15,0.98))] shadow-2xl shadow-black/25">
            <div className="border-b border-white/8 px-8 py-8">
              <h2 className="text-3xl font-semibold text-white">Sign in</h2>
              <p className="mt-2 text-white/60">Use Google for a fast start or sign in with email.</p>
            </div>

            <div className="p-8">
              {authError && (
                <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  Authentication could not be completed. Please try again.
                </div>
              )}

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-4 text-base font-semibold text-slate-950 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <GoogleIcon />
                <span className="ml-3">{googleLoading ? 'Redirecting…' : 'Continue with Google'}</span>
              </button>

              <div className="my-6 flex items-center gap-3 text-sm text-white/40">
                <div className="h-px flex-1 bg-white/10" />
                <span>or use email</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/80">Email address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full rounded-2xl border bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-300 ${
                      errors.email ? 'border-red-400/60' : 'border-white/10'
                    }`}
                    placeholder="you@example.com"
                  />
                  {errors.email && (
                    <p className="mt-2 flex items-center text-sm text-red-200">
                      <XCircle className="mr-2 h-4 w-4" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/80">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`w-full rounded-2xl border bg-white/5 px-4 py-3 pr-12 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-300 ${
                        errors.password ? 'border-red-400/60' : 'border-white/10'
                      }`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/45 transition hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 flex items-center text-sm text-red-200">
                      <XCircle className="mr-2 h-4 w-4" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-300 via-cyan-200 to-sky-200 px-5 py-4 text-base font-semibold text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-b-2 border-slate-900" />
                  ) : (
                    <>
                      <LogIn className="mr-2 h-5 w-5" />
                      Sign In
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-white/55">
                Don&apos;t have an account?{' '}
                <Link href="/auth/signup" className="font-semibold text-emerald-200 transition hover:text-white">
                  Create one here
                </Link>
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
