import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Mail,
  MessageSquareText,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Scope Creep — AI Scope Management Middleware",
  description:
    "Protect your time and profit margin. Scope Creep sits between client emails and your work to extract tasks, establish SOW baselines, flag scope drift, and draft professional responses.",
};

const problemItems = [
  "Client requests arrive as casual emails, voice notes, and hidden requirements.",
  "Scope blurs before anyone formally agrees on what is included in the SOW.",
  "Unpaid work accumulates as small feature additions creep in quietly.",
];

const workflowSteps = [
  { step: "01", name: "Client Request", desc: "Raw email or chat pasted into middleware" },
  { step: "02", name: "AI Extraction", desc: "Structured deliverable breakdown" },
  { step: "03", name: "Review & Stage", desc: "Validate effort, category & complexity" },
  { step: "04", name: "SOW Baseline", desc: "Lock baseline deliverables & exclusions" },
  { step: "05", name: "Scope Check", desc: "Semantic compliance diffing" },
  { step: "06", name: "Pushback Email", desc: "Polite Change Order response" },
];

const featureCards = [
  {
    title: "Requirement Extraction",
    description: "Turn raw client messages into structured, actionable tasks automatically.",
    icon: MessageSquareText,
    badge: "Phase 1",
  },
  {
    title: "SOW Baseline Lock",
    description: "Store agreed deliverables, explicit exclusions, and assumptions in database.",
    icon: FileText,
    badge: "Phase 2",
  },
  {
    title: "Scope Drift Detection",
    description: "AI semantically checks new requests against baseline boundaries.",
    icon: ShieldAlert,
    badge: "Phase 2",
  },
  {
    title: "Professional Email Drafts",
    description: "Generates collaborative Change Order & timeline deferral pushback emails.",
    icon: Mail,
    badge: "Phase 2",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-purple-600 selection:text-white">
      {/* ── Navbar — MedNexus minimal style + Deep Violet ── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-purple-500/20">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-lg shadow-purple-600/30 transition-transform group-hover:scale-105">
              <Sparkles className="h-4 w-4" />
            </div>
            <span
              className="text-lg font-bold text-foreground tracking-tight"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Scope Creep
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#problem" className="hover:text-purple-400 transition-colors">
              The Problem
            </a>
            <a href="#workflow" className="hover:text-purple-400 transition-colors">
              Workflow
            </a>
            <a href="#features" className="hover:text-purple-400 transition-colors">
              Features
            </a>
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-purple-500/40 px-4 py-1.5 text-sm font-medium text-purple-300 hover:border-purple-400 hover:bg-purple-500/10 transition-all"
            >
              Login <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-500 transition-all shadow-md shadow-purple-600/30"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero — Moody Deep Violet + Electric Purple ── */}
        <section className="relative overflow-hidden bg-gradient-hero pt-20 pb-28 lg:pt-28 lg:pb-36">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] items-center">
              <div className="space-y-8">
                {/* Pill badge */}
                <div>
                  <span className="badge-pill">AI-Powered Scope Management</span>
                </div>

                {/* Ultra-bold heading — MedNexus style + Electric Purple gradient */}
                <h1
                  className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-7xl leading-[1.05]"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  The Future
                  <br />
                  of Scope
                  <br />
                  <span className="text-gradient">Protection.</span>
                </h1>

                <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Scope Creep uses AI to streamline every part of your client workflow — from
                  requirement extraction to SOW baseline locking to professional pushback emails.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-1">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-7 py-3.5 text-base font-semibold text-white hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/30"
                  >
                    Get Started Free
                  </Link>
                  <a
                    href="#workflow"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/5 px-7 py-3.5 text-base font-semibold text-purple-200 hover:bg-purple-500/10 transition-all"
                  >
                    See How It Works
                  </a>
                </div>

                <div className="flex items-center gap-6 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-purple-400" /> Free signup
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-purple-400" /> Powered by Gemini AI
                  </span>
                </div>
              </div>

              {/* Mock App Window with Purple Glow */}
              <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
                <div className="rounded-3xl border border-purple-500/30 bg-card/90 p-5 shadow-float backdrop-blur-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                      <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                      <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className="text-xs font-semibold text-purple-300/80">
                      Scope Creep · Middleware Demo
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-2xl border border-purple-500/20 bg-purple-950/30 p-3.5 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">
                        Incoming Client Email
                      </span>
                      <p className="text-xs text-foreground italic">
                        &ldquo;Hey! Can we also add custom CSV exports and redesign the billing tab by tomorrow?&rdquo;
                      </p>
                    </div>

                    <div className="rounded-2xl border border-rose-500/40 bg-rose-950/40 p-3.5 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-rose-400">
                        <span className="flex items-center gap-1.5">
                          <ShieldAlert className="h-4 w-4" /> Scope Expansion Flagged!
                        </span>
                        <span>~6 Hours Extra</span>
                      </div>
                      <p className="text-[11px] text-rose-300/80">
                        CSV export is excluded under agreed SOW deliverable #2.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-purple-500/30 bg-card p-3.5 flex items-center justify-between text-xs font-semibold">
                      <span className="text-foreground">Pushback Email Ready</span>
                      <span className="text-purple-400 flex items-center gap-1">
                        Option A: Change Order ($450) <Zap className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Problem Section ── */}
        <section id="problem" className="py-24 border-t border-purple-500/20 bg-card/50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="max-w-2xl space-y-3 mb-14">
              <span className="badge-pill">The Problem</span>
              <h2
                className="text-4xl font-extrabold tracking-tight text-foreground mt-4"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                Small messages create large unpaid work.
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Without explicit scope boundaries, informal client requests silently eat into your
                profit margins and project deadlines.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-6 space-y-4">
                <h3 className="text-base font-bold text-rose-400">
                  ❌ Without Scope Creep
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                  {problemItems.map((item, idx) => (
                    <li key={idx} className="flex gap-2.5 items-start">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-6 space-y-4">
                <h3 className="text-base font-bold text-purple-300">
                  ✅ With Scope Creep
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                  <li className="flex gap-2.5 items-start">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400 mt-2 shrink-0" />
                    <span>Raw text automatically structured into reviewable tasks.</span>
                  </li>
                  <li className="flex gap-2.5 items-start">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400 mt-2 shrink-0" />
                    <span>Baseline SOW deliverables locked in database reference.</span>
                  </li>
                  <li className="flex gap-2.5 items-start">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400 mt-2 shrink-0" />
                    <span>AI semantic compliance flags scope drift and drafts polite pushbacks.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Workflow Steps Section ── */}
        <section id="workflow" className="py-24 border-t border-purple-500/20 bg-gradient-hero">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="max-w-2xl space-y-4 mb-14">
              <span className="badge-pill">Linear Workflow</span>
              <h2
                className="text-4xl font-extrabold tracking-tight text-foreground mt-4"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                6 simple steps from request to pushback.
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {workflowSteps.map((s) => (
                <div
                  key={s.step}
                  className="rounded-2xl border border-purple-500/20 bg-card/60 backdrop-blur-md p-6 space-y-3 hover:border-purple-500/50 hover:shadow-float-sm transition-all duration-200"
                >
                  <span
                    className="text-3xl font-extrabold text-purple-400/40 block"
                    style={{ fontFamily: "var(--font-syne)" }}
                  >
                    {s.step}
                  </span>
                  <h3 className="text-sm font-bold text-foreground">{s.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features Section ── */}
        <section id="features" className="py-24 border-t border-purple-500/20 bg-card/50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="max-w-2xl space-y-4 mb-14">
              <span className="badge-pill">Core Capabilities</span>
              <h2
                className="text-4xl font-extrabold tracking-tight text-foreground mt-4"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                Designed for focus and clear boundaries.
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featureCards.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="rounded-2xl border border-purple-500/20 bg-card/80 p-6 space-y-4 hover:border-purple-500/50 hover:shadow-float-sm transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-950/60 border border-purple-500/20 px-2 py-0.5 rounded-full text-purple-300">
                        {f.badge}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-foreground">{f.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="py-24 border-t border-purple-500/20 bg-gradient-hero">
          <div className="mx-auto max-w-3xl px-6 text-center space-y-8">
            <span className="badge-pill">Start for free</span>
            <h2
              className="text-5xl font-extrabold tracking-tight text-foreground mt-4"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Stop losing money to scope creep.
            </h2>
            <p className="text-base text-muted-foreground">
              Join freelancers and agencies who use AI to protect their time, profit, and client
              relationships — all in one middleware tool.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-8 py-4 text-base font-semibold text-white hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/30"
            >
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-purple-500/20 py-10 bg-card">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-purple-600 text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="font-semibold text-foreground">Scope Creep</span>
            <span>— Protect your work.</span>
          </div>
          <div>© 2026 Scope Creep. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
