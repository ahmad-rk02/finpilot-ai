"use client";

import { useState } from "react";
import {
    ArrowRight,
    BarChart3,
    Bot,
    CheckCircle2,
    Menu,
    PiggyBank,
    Receipt,
    Shield,
    ShieldCheck,
    Sparkles,
    Star,
    Target,
    TrendingUp,
    Wallet,
    X,
    Zap,
    ChevronRight,
    LineChart,
    BrainCircuit,
} from "lucide-react";
import Auth from "@/app/components/Auth";

/* ─────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────── */

const features = [
    {
        icon: Receipt,
        accent: "indigo",
        title: "Transaction Tracking",
        description:
            "Log every rupee in and out. Categorise instantly and build a complete picture of where your money goes.",
    },
    {
        icon: Target,
        accent: "violet",
        title: "Smart Budgets",
        description:
            "Set category-level budgets, get real-time progress bars, and receive alerts before you overspend.",
    },
    {
        icon: LineChart,
        accent: "emerald",
        title: "Cash Flow Forecast",
        description:
            "See a rolling prediction of your month-end balance powered by your actual spending patterns.",
    },
    {
        icon: PiggyBank,
        accent: "rose",
        title: "Savings Goals",
        description:
            "Create goals for anything — vacation, gadget, emergency fund — and watch your progress grow.",
    },
    {
        icon: BarChart3,
        accent: "amber",
        title: "Spending Insights",
        description:
            "Visual breakdowns reveal your top categories so you can spot leaks and cut waste fast.",
    },
    {
        icon: BrainCircuit,
        accent: "indigo",
        title: "AI Financial Coach",
        description:
            "Ask anything in plain English. Get instant, personalised answers based on your real data.",
    },
];

const steps = [
    {
        number: "01",
        title: "Create your account",
        body: "Sign up in seconds with email, Google, or GitHub — no credit card, no commitments.",
    },
    {
        number: "02",
        title: "Log your transactions",
        body: "Add income and expenses manually. FinPilot auto-categorises them to save you time.",
    },
    {
        number: "03",
        title: "Set budgets & goals",
        body: "Define your monthly spending limits and savings targets in just a few taps.",
    },
    {
        number: "04",
        title: "Get AI-driven insights",
        body: "Chat with your personal finance AI to understand your habits and plan smarter.",
    },
];

const testimonials = [
    {
        quote:
            "FinPilot showed me I was spending ₹8,000 a month on food deliveries. Seeing it in one dashboard changed how I think about money.",
        name: "Arjun M.",
        role: "Software Engineer, Bangalore",
        initial: "A",
        color: "indigo",
    },
    {
        quote:
            "The AI coach is like having a CA in my pocket. I asked if I could afford a new laptop and it gave me a clear, data-backed answer.",
        name: "Priya S.",
        role: "Freelance Designer, Mumbai",
        initial: "P",
        color: "violet",
    },
    {
        quote:
            "I hit my emergency fund goal three months ahead of schedule. The progress bar kept me motivated every single day.",
        name: "Rahul K.",
        role: "Product Manager, Hyderabad",
        initial: "R",
        color: "emerald",
    },
];

const stats = [
    { value: "100%", label: "Free forever" },
    { value: "AI", label: "Powered coaching" },
    { value: "₹INR", label: "India-first" },
    { value: "0", label: "Hidden fees" },
];

/* ─────────────────────────────────────────────────────────
   ACCENT MAP
───────────────────────────────────────────────────────── */

const accentIcon: Record<string, string> = {
    indigo: "bg-indigo-500/10 text-indigo-400",
    violet: "bg-violet-500/10 text-violet-400",
    emerald: "bg-emerald-500/10 text-emerald-400",
    rose: "bg-rose-500/10 text-rose-400",
    amber: "bg-amber-500/10 text-amber-400",
};

const accentBorder: Record<string, string> = {
    indigo: "border-indigo-500/20 group-hover:border-indigo-500/40",
    violet: "border-violet-500/20 group-hover:border-violet-500/40",
    emerald: "border-emerald-500/20 group-hover:border-emerald-500/40",
    rose: "border-rose-500/20 group-hover:border-rose-500/40",
    amber: "border-amber-500/20 group-hover:border-amber-500/40",
};

const accentAvatar: Record<string, string> = {
    indigo: "bg-indigo-500",
    violet: "bg-violet-500",
    emerald: "bg-emerald-500",
};

/* ─────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────── */

export default function LandingPage() {
    const [showAuth, setShowAuth] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    if (showAuth) return <Auth />;

    function openAuth() {
        setMobileNavOpen(false);
        setShowAuth(true);
    }

    return (
        <div className="min-h-[100dvh] overflow-x-hidden bg-slate-950 text-white">

            {/* ══════════════════════════════════════════════════
          NAVIGATION
      ══════════════════════════════════════════════════ */}
            <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-slate-950/75 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

                    {/* Logo */}
                    <a href="#" className="flex items-center gap-2.5 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 rounded-lg">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500 shadow-lg shadow-indigo-500/40">
                            <Wallet size={16} aria-hidden="true" />
                        </div>
                        <span className="text-[15px] font-bold tracking-tight">FinPilot</span>
                    </a>

                    {/* Desktop links */}
                    <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
                        {["Features", "How it works", "Testimonials"].map((label) => (
                            <a
                                key={label}
                                href={`#${label.toLowerCase().replace(/ /g, "-")}`}
                                className="text-sm text-slate-400 transition hover:text-white"
                            >
                                {label}
                            </a>
                        ))}
                    </nav>

                    {/* Desktop CTAs */}
                    <div className="hidden items-center gap-3 md:flex">
                        <button
                            onClick={openAuth}
                            className="text-sm font-medium text-slate-300 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 rounded-md px-2 py-1"
                        >
                            Sign in
                        </button>
                        <button
                            onClick={openAuth}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-indigo-500 px-4 text-sm font-semibold shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        >
                            Get started free
                            <ArrowRight size={14} aria-hidden="true" />
                        </button>
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        type="button"
                        onClick={() => setMobileNavOpen((v) => !v)}
                        aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
                        aria-expanded={mobileNavOpen}
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/5 hover:text-white md:hidden"
                    >
                        {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* Mobile drawer */}
                {mobileNavOpen && (
                    <div className="border-t border-white/[0.06] bg-slate-950 px-4 py-4 md:hidden">
                        <nav className="flex flex-col gap-1" aria-label="Mobile primary">
                            {["Features", "How it works", "Testimonials"].map((label) => (
                                <a
                                    key={label}
                                    href={`#${label.toLowerCase().replace(/ /g, "-")}`}
                                    onClick={() => setMobileNavOpen(false)}
                                    className="rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                                >
                                    {label}
                                </a>
                            ))}
                        </nav>
                        <div className="mt-4 flex flex-col gap-2.5">
                            <button
                                onClick={openAuth}
                                className="min-h-11 w-full rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white transition hover:bg-white/10"
                            >
                                Sign in
                            </button>
                            <button
                                onClick={openAuth}
                                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 text-sm font-semibold shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400"
                            >
                                Get started free
                                <ArrowRight size={15} aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
            <section className="relative isolate overflow-hidden px-4 pb-24 pt-20 sm:px-6 sm:pb-32 sm:pt-28 lg:px-8">

                {/* Background glows */}
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute left-1/2 top-0 h-[700px] w-[1100px] -translate-x-1/2 rounded-full bg-indigo-700/10 blur-[130px]" />
                    <div className="absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full bg-violet-700/10 blur-[100px]" />
                    {/* Grid overlay */}
                    <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage:
                                "linear-gradient(to right, #6366f1 1px, transparent 1px), linear-gradient(to bottom, #6366f1 1px, transparent 1px)",
                            backgroundSize: "64px 64px",
                        }}
                    />
                </div>

                <div className="mx-auto max-w-4xl text-center">

                    {/* Badge */}
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-300">
                        <Sparkles size={11} aria-hidden="true" />
                        AI-Powered · India-First · Free Forever
                    </div>

                    <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-[3.75rem] lg:leading-[1.1]">
                        Take control of your{" "}
                        <span className="relative whitespace-nowrap">
                            <span className="relative bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent">
                                financial future
                            </span>
                        </span>
                    </h1>

                    <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
                        FinPilot combines smart transaction tracking, budget alerts, savings goals, and an AI coach — all in one clean dashboard designed for India.
                    </p>

                    {/* CTAs */}
                    <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
                        <button
                            onClick={openAuth}
                            className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-7 text-sm font-semibold shadow-xl shadow-indigo-500/30 transition hover:bg-indigo-400 sm:w-auto"
                        >
                            Start for free — no card needed
                            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                        </button>
                        <a
                            href="#features"
                            className="inline-flex min-h-12 w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-6 text-sm font-medium text-slate-300 transition hover:bg-white/[0.08] hover:text-white sm:w-auto"
                        >
                            Explore features
                            <ChevronRight size={15} aria-hidden="true" />
                        </a>
                    </div>

                    {/* Trust line */}
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-600">
                        {["No credit card required", "Free forever", "Data secured by Supabase"].map((item) => (
                            <span key={item} className="flex items-center gap-1.5">
                                <CheckCircle2 size={11} className="text-emerald-600" aria-hidden="true" />
                                {item}
                            </span>
                        ))}
                    </div>
                </div>

                {/* ── HERO DASHBOARD MOCK ── */}
                <div className="mx-auto mt-20 max-w-3xl">
                    <div className="relative">
                        {/* Glow under card */}
                        <div aria-hidden="true" className="pointer-events-none absolute -inset-x-10 -bottom-10 h-40 bg-indigo-600/10 blur-3xl" />

                        {/* Card frame */}
                        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/50">

                            {/* Window chrome */}
                            <div className="flex items-center gap-1.5 border-b border-white/[0.06] bg-slate-950/60 px-4 py-3">
                                <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                                <div className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
                                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
                                <div className="mx-auto flex items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-[11px] text-slate-600">
                                    <ShieldCheck size={10} aria-hidden="true" />
                                    app.finpilot.in/dashboard
                                </div>
                            </div>

                            {/* Dashboard content */}
                            <div className="p-5 sm:p-6">
                                {/* Greeting row */}
                                <div className="mb-5 flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-xs text-indigo-400">Your financial dashboard</p>
                                        <h2 className="mt-0.5 text-lg font-bold text-white">Good morning, Arjun 👋</h2>
                                    </div>
                                    <button className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-indigo-500 px-3.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/20">
                                        + Add transaction
                                    </button>
                                </div>

                                {/* Stat cards */}
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    {[
                                        { label: "Balance", value: "₹1,24,580", sub: "Current", color: "text-white", icon: "💰" },
                                        { label: "Income", value: "₹85,000", sub: "This month", color: "text-emerald-400", icon: "📈" },
                                        { label: "Expenses", value: "₹41,200", sub: "This month", color: "text-rose-400", icon: "📉" },
                                        { label: "Income spent", value: "48.5%", sub: "Expense ratio", color: "text-violet-400", icon: "📊" },
                                    ].map((card) => (
                                        <div key={card.label} className="min-w-0 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5">
                                            <div className="mb-2 flex items-center justify-between gap-1">
                                                <span className="text-sm">{card.icon}</span>
                                                <span className="text-[10px] text-slate-600">{card.sub}</span>
                                            </div>
                                            <p className="text-[11px] text-slate-500">{card.label}</p>
                                            <p className={`mt-0.5 text-base font-bold ${card.color}`}>{card.value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Bottom row */}
                                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                    {/* Spending bars */}
                                    <div className="sm:col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                                        <p className="mb-3 text-xs font-semibold text-white">Spending overview</p>
                                        <div className="space-y-3">
                                            {[
                                                { cat: "🍔 Food & Dining", pct: 72, amt: "₹14,400" },
                                                { cat: "🛍️ Shopping", pct: 45, amt: "₹9,000" },
                                                { cat: "🚗 Transport", pct: 30, amt: "₹6,000" },
                                                { cat: "💡 Bills & Utilities", pct: 58, amt: "₹11,600" },
                                            ].map((row) => (
                                                <div key={row.cat}>
                                                    <div className="mb-1 flex items-center justify-between gap-2">
                                                        <span className="text-[11px] text-slate-300">{row.cat}</span>
                                                        <span className="shrink-0 text-[11px] font-medium text-white">{row.amt}</span>
                                                    </div>
                                                    <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                                                        <div
                                                            className="h-full rounded-full bg-indigo-500"
                                                            style={{ width: `${row.pct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* AI chat bubble */}
                                    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.07] p-4">
                                        <div className="mb-3 flex items-center gap-2">
                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20">
                                                <Bot size={13} className="text-indigo-400" aria-hidden="true" />
                                            </div>
                                            <span className="text-xs font-semibold text-white">FinPilot AI</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="rounded-lg bg-white/5 px-3 py-2.5 text-[11px] leading-relaxed text-slate-300">
                                                You've spent <span className="text-white font-medium">48%</span> of this month's budget. You're on track to save <span className="text-emerald-400 font-medium">₹22,000</span> this month 🎉
                                            </div>
                                            <div className="rounded-lg bg-indigo-500/10 px-3 py-2 text-[10px] text-slate-500 italic">
                                                "Can I afford a ₹50k laptop?"
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
          STATS BAND
      ══════════════════════════════════════════════════ */}
            <section className="border-y border-white/[0.06] bg-white/[0.02] py-10" aria-label="Key metrics">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <ul className="grid grid-cols-2 gap-8 md:grid-cols-4">
                        {stats.map((s) => (
                            <li key={s.label} className="text-center">
                                <p className="text-3xl font-extrabold text-white sm:text-4xl">{s.value}</p>
                                <p className="mt-1.5 text-sm text-slate-500">{s.label}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════ */}
            <section id="features" className="px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
                <div className="mx-auto max-w-6xl">

                    <div className="mb-16 text-center">
                        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-400">Everything you need</p>
                        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                            Your complete finance toolkit
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400">
                            From day-to-day tracking to long-term planning, every tool you need lives in one clean dashboard.
                        </p>
                    </div>

                    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((f) => {
                            const Icon = f.icon;
                            return (
                                <li
                                    key={f.title}
                                    className={`group relative overflow-hidden rounded-2xl border bg-white/[0.02] p-6 transition hover:bg-white/[0.05] ${accentBorder[f.accent]}`}
                                >
                                    {/* Hover glow */}
                                    <div aria-hidden="true" className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-current opacity-0 blur-2xl transition group-hover:opacity-[0.04]" />

                                    <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${accentIcon[f.accent]}`}>
                                        <Icon size={20} aria-hidden="true" />
                                    </div>
                                    <h3 className="mb-2 font-semibold text-white">{f.title}</h3>
                                    <p className="text-sm leading-6 text-slate-400">{f.description}</p>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════ */}
            <section id="how-it-works" className="border-t border-white/[0.06] bg-white/[0.015] px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
                <div className="mx-auto max-w-5xl">

                    <div className="mb-16 text-center">
                        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-400">Simple onboarding</p>
                        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                            Up and running in minutes
                        </h2>
                    </div>

                    <ol className="relative grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Connecting line on desktop */}
                        <div aria-hidden="true" className="pointer-events-none absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-white/10 to-transparent lg:block" />

                        {steps.map((step, i) => (
                            <li key={step.number} className="relative flex flex-col items-start">
                                {/* Step badge */}
                                <div className="relative mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/10 text-sm font-bold text-indigo-400">
                                    {step.number}
                                    {/* Connector dot */}
                                    {i < steps.length - 1 && (
                                        <span aria-hidden="true" className="absolute -right-6 top-1/2 hidden h-2 w-2 -translate-y-1/2 rounded-full bg-indigo-500/30 lg:block" />
                                    )}
                                </div>
                                <h3 className="mb-2 font-semibold text-white">{step.title}</h3>
                                <p className="text-sm leading-6 text-slate-400">{step.body}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
          AI CALLOUT
      ══════════════════════════════════════════════════ */}
            <section className="border-t border-white/[0.06] px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
                <div className="mx-auto max-w-5xl">
                    <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-slate-900 to-slate-950 p-8 shadow-2xl shadow-indigo-900/20 sm:p-12">

                        {/* Background decoration */}
                        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-600/20 blur-[90px]" />
                        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-violet-600/10 blur-[90px]" />

                        <div className="relative flex flex-col gap-10 lg:flex-row lg:items-center">
                            {/* Text */}
                            <div className="min-w-0 flex-1">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-3.5 py-1.5 text-xs font-medium text-indigo-300">
                                    <Zap size={11} aria-hidden="true" />
                                    Powered by Gemini AI
                                </div>

                                <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
                                    Meet your AI Financial Coach
                                </h2>

                                <p className="mt-3 max-w-lg text-sm leading-7 text-slate-300">
                                    Ask FinPilot anything in plain English — <em className="not-italic text-white">"Can I afford a ₹50,000 laptop?", "Where am I overspending?", "How long to hit my savings goal?"</em> — and get instant, personalised answers drawn from your real transactions.
                                </p>

                                <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                                    {[
                                        "Spending pattern analysis",
                                        "Affordability checks",
                                        "Budget optimisation tips",
                                        "Future cash flow projections",
                                        "Goal timeline estimates",
                                        "Category-level breakdown",
                                    ].map((item) => (
                                        <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                                            <CheckCircle2 size={14} className="shrink-0 text-indigo-400" aria-hidden="true" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={openAuth}
                                    className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-500 px-6 text-sm font-semibold shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400"
                                >
                                    Try the AI Coach
                                    <ArrowRight size={15} aria-hidden="true" />
                                </button>
                            </div>

                            {/* Chat demo card */}
                            <div className="w-full shrink-0 lg:w-72">
                                <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 shadow-xl">
                                    <div className="mb-4 flex items-center gap-2.5">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20">
                                            <Bot size={15} className="text-indigo-400" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-white">FinPilot AI</p>
                                            <p className="text-[10px] text-emerald-400">● Online</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {/* User message */}
                                        <div className="flex justify-end">
                                            <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-indigo-500/20 px-3 py-2.5 text-[12px] leading-relaxed text-white">
                                                Can I afford a ₹50k laptop?
                                            </div>
                                        </div>
                                        {/* AI response */}
                                        <div className="flex justify-start">
                                            <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-white/[0.05] px-3 py-2.5 text-[12px] leading-relaxed text-slate-200">
                                                Based on your <span className="text-white font-medium">₹38,000 savings buffer</span> and stable income, yes — you can afford it without impacting your emergency fund. 💡
                                            </div>
                                        </div>
                                        {/* User message */}
                                        <div className="flex justify-end">
                                            <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-indigo-500/20 px-3 py-2.5 text-[12px] leading-relaxed text-white">
                                                Why did I overspend in July?
                                            </div>
                                        </div>
                                        {/* AI response */}
                                        <div className="flex justify-start">
                                            <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-white/[0.05] px-3 py-2.5 text-[12px] leading-relaxed text-slate-200">
                                                Dining out was <span className="text-rose-400 font-medium">2.4× your usual average</span>, adding ₹11,200 above budget. Consider a meal-plan.
                                            </div>
                                        </div>
                                    </div>

                                    {/* Input bar */}
                                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2">
                                        <span className="flex-1 text-[11px] text-slate-600">Ask anything about your finances…</span>
                                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/50">
                                            <ArrowRight size={10} className="text-white" aria-hidden="true" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════ */}
            <section id="testimonials" className="border-t border-white/[0.06] bg-white/[0.015] px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
                <div className="mx-auto max-w-6xl">

                    <div className="mb-14 text-center">
                        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-400">Real users. Real results.</p>
                        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                            Loved by people who take money seriously
                        </h2>
                    </div>

                    <ul className="grid gap-6 sm:grid-cols-3">
                        {testimonials.map((t) => (
                            <li
                                key={t.name}
                                className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/20 hover:bg-white/[0.05]"
                            >
                                {/* Stars */}
                                <div className="mb-4 flex gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} size={13} className="fill-amber-400 text-amber-400" aria-hidden="true" />
                                    ))}
                                </div>

                                <blockquote className="flex-1 text-sm leading-7 text-slate-300">
                                    "{t.quote}"
                                </blockquote>

                                <div className="mt-5 flex items-center gap-3">
                                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${accentAvatar[t.color]}`}>
                                        {t.initial}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-white">{t.name}</p>
                                        <p className="truncate text-xs text-slate-500">{t.role}</p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════ */}
            <section className="border-t border-white/[0.06] px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
                <div className="mx-auto max-w-3xl text-center">

                    {/* Icon */}
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500 shadow-2xl shadow-indigo-500/40">
                        <Wallet size={28} aria-hidden="true" />
                    </div>

                    <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                        Ready to pilot your finances?
                    </h2>

                    <p className="mx-auto mt-5 max-w-xl text-base text-slate-400 sm:text-lg">
                        Join thousands of people who use FinPilot to spend smarter, save faster, and stress less about money.
                    </p>

                    <button
                        onClick={openAuth}
                        className="group mt-10 inline-flex min-h-13 items-center gap-2 rounded-xl bg-indigo-500 px-8 py-3.5 text-sm font-semibold shadow-xl shadow-indigo-500/30 transition hover:bg-indigo-400"
                    >
                        Get started for free
                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </button>

                    <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-600">
                        {["No credit card required", "Cancel anytime", "Free forever"].map((item) => (
                            <span key={item} className="flex items-center gap-1.5">
                                <CheckCircle2 size={11} className="text-emerald-700" aria-hidden="true" />
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════ */}
            <footer className="border-t border-white/[0.06] bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">

                    <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
                        {/* Brand */}
                        <div>
                            <div className="flex items-center gap-2.5 mb-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400">
                                    <Wallet size={14} aria-hidden="true" />
                                </div>
                                <span className="text-sm font-bold text-white">FinPilot</span>
                            </div>
                            <p className="text-xs text-slate-600 max-w-xs">Personal finance, made simple. Built for India.</p>
                        </div>

                        {/* Links */}
                        <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
                            {["Features", "How it works", "Testimonials"].map((label) => (
                                <a
                                    key={label}
                                    href={`#${label.toLowerCase().replace(/ /g, "-")}`}
                                    className="text-xs text-slate-500 transition hover:text-slate-300"
                                >
                                    {label}
                                </a>
                            ))}
                            <button
                                onClick={openAuth}
                                className="text-xs text-slate-500 transition hover:text-slate-300"
                            >
                                Sign in
                            </button>
                        </nav>
                    </div>

                    <div className="mt-8 flex flex-col items-start gap-3 border-t border-white/[0.06] pt-8 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-700">
                            © {new Date().getFullYear()} FinPilot. All rights reserved.
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-700">
                            <ShieldCheck size={12} className="shrink-0 text-slate-700" aria-hidden="true" />
                            Secured by Supabase · Data stays yours
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
