import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  FileText,
  Layers3,
  Mail,
  MessageSquareText,
  ShieldAlert,
  Sparkles,
  Workflow,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Scope Creep",
  description:
    "AI-powered scope management middleware for freelancers, agencies, and small teams.",
};

const problemItems = [
  "Client messages arrive as scattered notes, voice-of-the-moment edits, and hidden requirements.",
  "Scope gets blurred before anyone agrees what is actually included.",
  "Unpaid work starts to accumulate because the change is not captured early enough.",
];

const workflowSteps = [
  "Client Request",
  "AI Extraction",
  "Review",
  "Baseline",
  "Scope Check",
  "Professional Email",
];

const featureCards = [
  {
    title: "Requirement Extraction",
    description: "Turn raw client messages into structured, actionable tasks.",
    icon: MessageSquareText,
  },
  {
    title: "Project Baseline",
    description:
      "Capture the original scope so future requests can be compared against it.",
    icon: FileText,
  },
  {
    title: "Scope Detection",
    description: "Identify when a new request moves beyond the agreed work.",
    icon: ShieldAlert,
  },
  {
    title: "Professional Email",
    description: "Draft a calm, client-ready response when scope expands.",
    icon: Mail,
  },
];

const benefitCards = [
  {
    title: "Save Time",
    description: "Reduce back-and-forth by structuring requests immediately.",
  },
  {
    title: "Protect Scope",
    description: "Make expansion visible before it becomes unpaid work.",
  },
  {
    title: "Communicate Clearly",
    description: "Keep client conversations professional, calm, and precise.",
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">
        {eyebrow}
      </p>
      <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h2>
      <p className="text-sm leading-7 text-muted-foreground sm:text-base">
        {description}
      </p>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-ring/40 hover:shadow-sm">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted text-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </article>
  );
}

function BenefitCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-ring/40 hover:shadow-sm">
      <CheckCircle2 className="mb-4 h-5 w-5 text-emerald-600" />
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </article>
  );
}

function WorkflowStep({
  label,
  index,
  isLast = false,
}: {
  label: string;
  index: number;
  isLast?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-semibold text-foreground">
        {String(index + 1).padStart(2, "0")}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
      </div>
      {!isLast ? <Workflow className="h-4 w-4 text-muted-foreground" /> : null}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-foreground">
                Scope Creep
              </div>
              <div className="text-xs text-muted-foreground">
                Scope management middleware
              </div>
            </div>
          </Link>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-6 md:flex"
          >
            <a
              href="#problem"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              Problem
            </a>
            <a
              href="#workflow"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              Workflow
            </a>
            <a
              href="#features"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              Features
            </a>
            <a
              href="#benefits"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              Benefits
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
              >
                Login
              </Button>
            </Link>

            <Link href="/login">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <div className="max-w-2xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground">
              <BadgeCheck className="h-3.5 w-3.5 text-indigo-600" />
              Built for client work that keeps changing
            </div>

            <div className="space-y-5">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Turn messy client requests into clear scope.
              </h1>
              <p className="max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
                Scope Creep helps freelancers, agencies, and small teams extract
                tasks, establish a baseline, detect scope creep, and draft
                professional emails before unpaid work spreads.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/login">
                <Button size="lg" className="h-11 px-5">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#workflow">
                <Button variant="outline" size="lg" className="h-11 px-5">
                  See how it works
                </Button>
              </a>
            </div>

            <p className="text-sm text-muted-foreground">
              Used to keep requirements organized, scope visible, and client
              communication professional.
            </p>
          </div>

          <div className="lg:pt-2">
            <article className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Project workspace
                  </p>
                  <p className="text-xs text-muted-foreground">
                    A calm view of scope, tasks, and client requests
                  </p>
                </div>
                <div className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                  Ready
                </div>
              </div>

              <div className="mt-4 grid gap-4">
                <div className="rounded-2xl border border-border bg-muted/40 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <MessageSquareText className="h-4 w-4 text-indigo-600" />
                    Client request
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    "Can we also add payment support and update the dashboard
                    layout?"
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border bg-background p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Extracted
                    </p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      3 tasks
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-background p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Baseline
                    </p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      Set
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-background p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Scope
                    </p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      Needs review
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                    Scope note
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    The product keeps the request visible, structured, and ready
                    for a professional response.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section id="problem" className="border-t border-border/60 bg-muted/20">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <SectionHeading
              eyebrow="Problem"
              title="Scope drift starts with small messages and ends with unpaid work."
              description="Most client communication is unstructured. Requirements hide inside casual messages, scope becomes unclear, and teams lose time reconciling what was said versus what was agreed."
            />

            <div className="mt-10 grid gap-4 lg:grid-cols-2">
              <article className="rounded-2xl border border-border bg-card p-6">
                <p className="text-sm font-semibold text-foreground">
                  Without Scope Creep
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                  {problemItems.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="rounded-2xl border border-border bg-card p-6">
                <p className="text-sm font-semibold text-foreground">
                  With Scope Creep
                </p>
                <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                  <div className="rounded-xl border border-border bg-muted/35 p-4">
                    Requirements are extracted into tasks.
                  </div>
                  <div className="rounded-xl border border-border bg-muted/35 p-4">
                    A baseline keeps original scope visible.
                  </div>
                  <div className="rounded-xl border border-border bg-muted/35 p-4">
                    New requests are checked before work expands.
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeading
            eyebrow="Solution"
            title="Scope Creep turns informal requests into a structured workflow."
            description="The product sits between the message and the work, helping users review tasks, preserve the baseline, and respond clearly when requests expand."
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <article className="rounded-2xl border border-border bg-card p-6">
              <p className="text-sm font-semibold text-foreground">Before</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Free-form client messages, hidden assumptions, and no clear
                point of comparison for new requests.
              </p>
            </article>
            <article className="rounded-2xl border border-border bg-card p-6">
              <p className="text-sm font-semibold text-foreground">After</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Structured tasks, a defined baseline, a scope verdict, and a
                professional email ready to send.
              </p>
            </article>
          </div>
        </section>

        <section
          id="workflow"
          className="border-y border-border/60 bg-muted/20"
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <SectionHeading
              eyebrow="Workflow"
              title="A simple sequence from request to response."
              description="The workflow is intentionally linear so it stays easy to understand, easy to remember, and easy to use under pressure."
            />

            <div className="mt-8 grid gap-3">
              {workflowSteps.map((step, index) => (
                <WorkflowStep
                  key={step}
                  label={step}
                  index={index}
                  isLast={index === workflowSteps.length - 1}
                />
              ))}
            </div>
          </div>
        </section>

        <section
          id="features"
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
        >
          <SectionHeading
            eyebrow="Features"
            title="The core capabilities, without clutter."
            description="Each feature supports a single part of the workflow and is designed to stay understandable on its own."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map((feature) => (
              <FeatureCard
                key={feature.title}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
              />
            ))}
          </div>
        </section>

        <section
          id="benefits"
          className="border-t border-border/60 bg-muted/20"
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <SectionHeading
              eyebrow="Benefits"
              title="The outcome is less noise, less guesswork, and more control."
              description="The product is useful because it reduces effort, protects scope, and keeps communication professional."
            />

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {benefitCards.map((benefit) => (
                <BenefitCard
                  key={benefit.title}
                  title={benefit.title}
                  description={benefit.description}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <article className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">
                  Call to action
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Create your first project and start managing scope with
                  clarity.
                </h2>
                <p className="text-sm leading-7 text-muted-foreground sm:text-base">
                  Set up a workspace, paste a request, and see how Scope Creep
                  structures the conversation before work expands.
                </p>
              </div>

              <Link href="/login">
  <Button size="lg" className="h-11 px-6">
    Get Started
    <ArrowRight className="h-4 w-4" />
  </Button>
</Link>
            </div>
          </article>
        </section>
      </main>

      <footer className="border-t border-border/70 bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-2 text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted">
              <Layers3 className="h-4 w-4" />
            </div>
            <span className="font-medium">Scope Creep</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href="#problem"
              className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              Problem
            </a>
            <a
              href="#workflow"
              className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              Workflow
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              GitHub
            </a>
          </div>

          <p>© 2026 Scope Creep. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
