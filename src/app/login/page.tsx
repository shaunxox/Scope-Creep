'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Check, Layers3, ShieldAlert } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-2">
        <aside className="flex items-center border-b border-border/70 bg-muted/30 px-6 py-12 lg:border-b-0 lg:border-r lg:px-10 xl:px-16">
          <div className="mx-auto max-w-xl space-y-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-primary text-primary-foreground shadow-sm">
                <Layers3 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight">Scope Creep</p>
                <p className="text-sm text-muted-foreground">AI Scope Management Middleware</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-600">Scope clarity for client work</p>
              <h1 className="max-w-md text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Transform client requests into structured, reviewable scope before work begins.
              </h1>
              <p className="max-w-lg text-sm leading-7 text-muted-foreground sm:text-base">
                A calm workspace for freelancers, agencies, and small teams to extract requirements, detect scope creep, and draft professional responses.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                'Extract requirements',
                'Detect scope creep',
                'Draft professional responses',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-sm leading-6 text-foreground">{item}</p>
                </div>
              ))}
            </div>

            <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
              <ShieldAlert className="h-3.5 w-3.5 text-indigo-600" />
              <span>Designed for focus, trust, and clear client communication.</span>
            </div>
          </div>
        </aside>

        <main className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-[460px] rounded-3xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-8"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted text-foreground">
                <Layers3 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">
                  Secure workspace access
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                  Welcome back
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Sign in to continue to your workspace.
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-foreground text-background hover:bg-zinc-800"
                disabled={loading}
              >
                {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Sign up'}
              </Button>

              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  or
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="w-full text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}