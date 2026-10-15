"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    AlertTriangle,
    CheckCircle2,
    CreditCard,
    Edit3,
    Goal,
    LayoutDashboard,
    Loader2,
    Menu,
    Plus,
    Settings,
    Sparkles,
    Target,
    Trash2,
    TrendingUp,
    Wallet,
    X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import AuthGuard from "@/app/components/AuthGuard";
import { useRealtimeSync } from "@/lib/useRealtimeSync";

type GoalType = {
    id: string;
    user_id: string;
    name: string;
    target_amount: number;
    saved_amount: number;
    target_date: string | null;
    created_at: string;
};

export default function GoalsPage() {
    return (
        <AuthGuard>
            <GoalsContent />
        </AuthGuard>
    );
}

function GoalsContent() {
    const [userId, setUserId] = useState<string | null>(null);

    const [goals, setGoals] = useState<GoalType[]>([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [editingGoal, setEditingGoal] = useState<GoalType | null>(null);

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [saving, setSaving] = useState(false);

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    /* =====================================================
       CURRENT USER
    ===================================================== */

    useEffect(() => {
        let mounted = true;

        async function getCurrentUser() {
            const {
                data: { user },
                error,
            } = await supabase.auth.getUser();

            if (error) {
                console.error("Unable to get current user:", error);
                if (mounted) setLoading(false);
                return;
            }

            if (!mounted) return;

            setUserId(user?.id ?? null);
        }

        getCurrentUser();

        return () => {
            mounted = false;
        };
    }, []);

    /* =====================================================
       LOAD GOALS
    ===================================================== */

    const loadGoals = useCallback(async (activeUserId: string) => {
        setLoading(true);

        const { data, error } = await supabase
            .from("goals")
            .select(
                "id, user_id, name, target_amount, saved_amount, target_date, created_at"
            )
            .eq("user_id", activeUserId)
            .order("created_at", {
                ascending: false,
            });

        if (error) {
            console.error("Goals loading error:", error);
            setGoals([]);
            setLoading(false);
            return;
        }

        setGoals((data || []) as GoalType[]);
        setLoading(false);
    }, []);

    useEffect(() => {
        if (userId) {
            loadGoals(userId);
        }
    }, [userId, loadGoals]);

    // Keep in sync across tabs
    useRealtimeSync({
        userId,
        tables: ["goals"],
        onRefresh: () => { if (userId) loadGoals(userId); },
    });

    /* =====================================================
       SUMMARY
    ===================================================== */

    const totalTarget = useMemo(() => {
        return goals.reduce(
            (total, goal) => total + Number(goal.target_amount),
            0
        );
    }, [goals]);

    const totalSaved = useMemo(() => {
        return goals.reduce(
            (total, goal) => total + Number(goal.saved_amount),
            0
        );
    }, [goals]);

    const totalRemaining = Math.max(totalTarget - totalSaved, 0);

    /* =====================================================
       MODALS
    ===================================================== */

    function openCreateModal() {
        setEditingGoal(null);
        setShowModal(true);
        setMobileMenuOpen(false);
    }

    function openEditModal(goal: GoalType) {
        setEditingGoal(goal);
        setShowModal(true);
    }

    function closeGoalModal() {
        if (saving) return;

        setShowModal(false);
        setEditingGoal(null);
    }

    /* =====================================================
       CREATE / UPDATE
    ===================================================== */

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (!userId || saving) return;

        const formData = new FormData(event.currentTarget);

        const name = String(formData.get("name") || "").trim();

        const targetAmount = Number(
            formData.get("target_amount")
        );

        const savedAmount = Number(
            formData.get("saved_amount") || 0
        );

        const targetDateValue = String(
            formData.get("target_date") || ""
        );

        if (
            !name ||
            !Number.isFinite(targetAmount) ||
            targetAmount <= 0
        ) {
            alert("Please enter a goal name and valid target amount.");
            return;
        }

        if (
            !Number.isFinite(savedAmount) ||
            savedAmount < 0
        ) {
            alert("Saved amount cannot be negative.");
            return;
        }

        if (savedAmount > targetAmount) {
            alert(
                "Saved amount cannot be greater than the target amount."
            );
            return;
        }

        setSaving(true);

        try {
            if (editingGoal) {
                const { data, error } = await supabase
                    .from("goals")
                    .update({
                        name,
                        target_amount: targetAmount,
                        saved_amount: savedAmount,
                        target_date: targetDateValue || null,
                    })
                    .eq("id", editingGoal.id)
                    .eq("user_id", userId)
                    .select()
                    .single();

                if (error) {
                    console.error("Goal update error:", error);
                    alert("Unable to update goal.");
                    return;
                }

                setGoals((current) =>
                    current.map((goal) =>
                        goal.id === editingGoal.id
                            ? (data as GoalType)
                            : goal
                    )
                );

                setEditingGoal(null);
                setShowModal(false);

                return;
            }

            const { data, error } = await supabase
                .from("goals")
                .insert({
                    user_id: userId,
                    name,
                    target_amount: targetAmount,
                    saved_amount: savedAmount,
                    target_date: targetDateValue || null,
                })
                .select()
                .single();

            if (error) {
                console.error("Goal creation error:", error);
                alert("Unable to create goal.");
                return;
            }

            setGoals((current) => [
                data as GoalType,
                ...current,
            ]);

            setShowModal(false);
        } finally {
            setSaving(false);
        }
    }

    /* =====================================================
       DELETE
    ===================================================== */

    async function handleDelete() {
        if (!deleteId || !userId || deleting) return;

        setDeleting(true);

        try {
            const { error } = await supabase
                .from("goals")
                .delete()
                .eq("id", deleteId)
                .eq("user_id", userId);

            if (error) {
                console.error("Goal delete error:", error);
                alert("Unable to delete goal.");
                return;
            }

            setGoals((current) =>
                current.filter(
                    (goal) => goal.id !== deleteId
                )
            );

            setDeleteId(null);
        } finally {
            setDeleting(false);
        }
    }

    /* =====================================================
       UI
    ===================================================== */

    return (
        <main className="min-h-[100dvh] overflow-x-hidden bg-slate-950 text-white">
            <div className="flex min-h-[100dvh]">
                {/* =================================================
                    DESKTOP SIDEBAR
                ================================================= */}

                <aside className="hidden min-h-[100dvh] w-64 shrink-0 border-r border-white/10 bg-slate-950 p-5 md:block">
                    <div className="mb-10 flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500">
                            <Wallet size={21} />
                        </div>

                        <div className="min-w-0">
                            <h1 className="font-bold">
                                FinPilot
                            </h1>

                            <p className="truncate text-xs text-slate-500">
                                AI Finance Assistant
                            </p>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        <NavItem
                            href="/"
                            icon={<LayoutDashboard size={18} />}
                            label="Dashboard"
                        />

                        <NavItem
                            href="/transactions"
                            icon={<CreditCard size={18} />}
                            label="Transactions"
                        />

                        <NavItem
                            href="/budgets"
                            icon={<Target size={18} />}
                            label="Budgets"
                        />

                        <NavItem
                            href="/goals"
                            icon={<Goal size={18} />}
                            label="Goals"
                            active
                        />

                        <NavItem
                            href="/forecast"
                            icon={<TrendingUp size={18} />}
                            label="Forecast"
                        />

                        <NavItem
                            href="/ai-coach"
                            icon={<Sparkles size={18} />}
                            label="AI Coach"
                        />
                    </nav>

                    <div className="mt-10 border-t border-white/10 pt-5">
                        <NavItem
                            href="/settings"
                            icon={<Settings size={18} />}
                            label="Settings"
                        />
                    </div>

                    <div className="mt-8 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4">
                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20">
                            <Sparkles
                                size={18}
                                className="text-indigo-400"
                            />
                        </div>

                        <p className="text-sm font-semibold">
                            FinPilot AI
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                            Smarter control over your money.
                        </p>
                    </div>
                </aside>

                {/* =================================================
                    MAIN CONTENT
                ================================================= */}

                <section className="min-w-0 flex-1">
                    {/* MOBILE HEADER */}

                    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-slate-950/95 px-4 py-3 backdrop-blur md:hidden">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500">
                                <Wallet size={19} />
                            </div>

                            <div className="min-w-0">
                                <p className="truncate text-sm font-bold">
                                    FinPilot
                                </p>

                                <p className="truncate text-[11px] text-slate-500">
                                    Financial Goals
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setMobileMenuOpen(true)
                            }
                            aria-label="Open navigation menu"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10"
                        >
                            <Menu size={20} />
                        </button>
                    </header>

                    <div className="p-4 sm:p-5 md:p-8">
                        <div className="mx-auto max-w-7xl">
                            {/* HEADER */}

                            <div className="mb-7 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-center md:justify-between">
                                <div className="min-w-0">
                                    <p className="text-sm text-slate-500">
                                        Financial goals
                                    </p>

                                    <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
                                        Goals
                                    </h2>

                                    <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                                        Turn your plans into measurable
                                        financial targets.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={openCreateModal}
                                    className="flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-medium transition hover:bg-indigo-400 sm:w-auto"
                                >
                                    <Plus size={18} />
                                    Create Goal
                                </button>
                            </div>

                            {/* SUMMARY */}

                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <StatCard
                                    title="Total Target"
                                    value={`₹${totalTarget.toLocaleString(
                                        "en-IN",
                                        {
                                            minimumFractionDigits: 2,
                                        }
                                    )}`}
                                    subtitle={`${goals.length} active goal${goals.length !== 1
                                        ? "s"
                                        : ""
                                        }`}
                                    icon={
                                        <Target
                                            size={20}
                                            className="text-indigo-400"
                                        />
                                    }
                                />

                                <StatCard
                                    title="Total Saved"
                                    value={`₹${totalSaved.toLocaleString(
                                        "en-IN",
                                        {
                                            minimumFractionDigits: 2,
                                        }
                                    )}`}
                                    subtitle="Across all goals"
                                    icon={
                                        <CheckCircle2
                                            size={20}
                                            className="text-emerald-400"
                                        />
                                    }
                                />

                                <StatCard
                                    title="Remaining"
                                    value={`₹${totalRemaining.toLocaleString(
                                        "en-IN",
                                        {
                                            minimumFractionDigits: 2,
                                        }
                                    )}`}
                                    subtitle="Still needed to reach targets"
                                    icon={
                                        <TrendingUp
                                            size={20}
                                            className="text-indigo-400"
                                        />
                                    }
                                />
                            </div>

                            {/* GOALS */}

                            <div className="mt-8">
                                <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold">
                                            Your Goals
                                        </h3>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Track your progress toward the
                                            things that matter.
                                        </p>
                                    </div>

                                    {goals.length > 0 && (
                                        <p className="text-xs text-slate-600">
                                            {goals.length} goal
                                            {goals.length !== 1
                                                ? "s"
                                                : ""}
                                        </p>
                                    )}
                                </div>

                                {loading ? (
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] py-16 text-center">
                                        <Loader2
                                            size={30}
                                            className="mx-auto animate-spin text-indigo-400"
                                        />

                                        <p className="mt-3 text-sm text-slate-500">
                                            Loading goals...
                                        </p>
                                    </div>
                                ) : goals.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-16 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10">
                                            <Goal
                                                size={26}
                                                className="text-indigo-400"
                                            />
                                        </div>

                                        <h3 className="mt-5 font-semibold">
                                            No goals yet
                                        </h3>

                                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                                            Create a financial goal such as
                                            a laptop, emergency fund, trip,
                                            or new phone.
                                        </p>

                                        <button
                                            type="button"
                                            onClick={openCreateModal}
                                            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-medium hover:bg-indigo-400"
                                        >
                                            <Plus size={17} />
                                            Create Your First Goal
                                        </button>
                                    </div>
                                ) : (
                                    /*
                                     * IMPORTANT:
                                     * The goal list gets its own vertical
                                     * scrollbar so adding many goals does
                                     * not make the entire page extremely
                                     * long.
                                     */
                                    <div className="max-h-[55vh] overflow-y-auto overscroll-contain pr-1 [scrollbar-color:rgb(71_85_105)_transparent] [scrollbar-width:thin] sm:max-h-[60vh] lg:max-h-[calc(100dvh-24rem)]">
                                        <div className="grid gap-4 pb-1 lg:grid-cols-2">
                                            {goals.map((goal) => {
                                                const target = Number(
                                                    goal.target_amount
                                                );

                                                const saved = Number(
                                                    goal.saved_amount
                                                );

                                                const remaining = Math.max(
                                                    target - saved,
                                                    0
                                                );

                                                const percentage =
                                                    target > 0
                                                        ? Math.min(
                                                            (saved /
                                                                target) *
                                                            100,
                                                            100
                                                        )
                                                        : 0;

                                                return (
                                                    <div
                                                        key={goal.id}
                                                        className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/15 sm:p-5"
                                                    >
                                                        {/* GOAL HEADER */}

                                                        <div className="flex min-w-0 items-start justify-between gap-3">
                                                            <div className="flex min-w-0 items-center gap-3">
                                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
                                                                    <Goal
                                                                        size={
                                                                            20
                                                                        }
                                                                        className="text-indigo-400"
                                                                    />
                                                                </div>

                                                                <div className="min-w-0">
                                                                    <h4
                                                                        className="break-words font-semibold"
                                                                        title={
                                                                            goal.name
                                                                        }
                                                                    >
                                                                        {
                                                                            goal.name
                                                                        }
                                                                    </h4>

                                                                    {goal.target_date && (
                                                                        <p className="mt-1 text-xs text-slate-500">
                                                                            Target:{" "}
                                                                            {formatDate(
                                                                                goal.target_date
                                                                            )}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="flex shrink-0 gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        openEditModal(
                                                                            goal
                                                                        )
                                                                    }
                                                                    aria-label={`Edit ${goal.name}`}
                                                                    className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-indigo-500/10 hover:text-indigo-400"
                                                                >
                                                                    <Edit3
                                                                        size={
                                                                            16
                                                                        }
                                                                    />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setDeleteId(
                                                                            goal.id
                                                                        )
                                                                    }
                                                                    aria-label={`Delete ${goal.name}`}
                                                                    className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-red-500/10 hover:text-red-400"
                                                                >
                                                                    <Trash2
                                                                        size={
                                                                            16
                                                                        }
                                                                    />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* AMOUNTS */}

                                                        <div className="mt-6 grid grid-cols-2 gap-4">
                                                            <div className="min-w-0">
                                                                <p className="text-xs text-slate-500">
                                                                    Saved
                                                                </p>

                                                                <p className="mt-1 truncate text-xl font-bold sm:text-2xl">
                                                                    ₹
                                                                    {saved.toLocaleString(
                                                                        "en-IN",
                                                                        {
                                                                            minimumFractionDigits: 2,
                                                                        }
                                                                    )}
                                                                </p>
                                                            </div>

                                                            <div className="min-w-0 text-right">
                                                                <p className="text-xs text-slate-500">
                                                                    Target
                                                                </p>

                                                                <p className="mt-1 truncate text-base font-medium text-slate-300 sm:text-lg">
                                                                    ₹
                                                                    {target.toLocaleString(
                                                                        "en-IN",
                                                                        {
                                                                            minimumFractionDigits: 2,
                                                                        }
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* PROGRESS */}

                                                        <div className="mt-5">
                                                            <div className="h-3 overflow-hidden rounded-full bg-white/5">
                                                                <div
                                                                    className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                                                                    style={{
                                                                        width: `${percentage}%`,
                                                                    }}
                                                                />
                                                            </div>

                                                            <div className="mt-2 flex items-start justify-between gap-3">
                                                                <span className="text-xs font-medium text-indigo-400">
                                                                    {percentage.toFixed(
                                                                        0
                                                                    )}
                                                                    % complete
                                                                </span>

                                                                <span className="max-w-[55%] text-right text-xs text-slate-500">
                                                                    ₹
                                                                    {remaining.toLocaleString(
                                                                        "en-IN",
                                                                        {
                                                                            minimumFractionDigits: 2,
                                                                        }
                                                                    )}{" "}
                                                                    remaining
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* COMPLETED */}

                                                        {percentage >=
                                                            100 && (
                                                                <div className="mt-5 flex items-start gap-2 rounded-xl bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-400">
                                                                    <CheckCircle2
                                                                        size={15}
                                                                        className="mt-0.5 shrink-0"
                                                                    />

                                                                    <span>
                                                                        Goal
                                                                        completed!
                                                                    </span>
                                                                </div>
                                                            )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* =================================================
                MOBILE DRAWER
            ================================================= */}

            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <button
                        type="button"
                        aria-label="Close navigation"
                        onClick={() =>
                            setMobileMenuOpen(false)
                        }
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    />

                    <aside className="relative flex h-[100dvh] w-[min(18rem,calc(100vw-1rem))] flex-col overflow-y-auto border-r border-white/10 bg-slate-950 p-5 shadow-2xl">
                        <div className="mb-8 flex items-center justify-between">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500">
                                    <Wallet size={21} />
                                </div>

                                <div className="min-w-0">
                                    <h1 className="font-bold">
                                        FinPilot
                                    </h1>

                                    <p className="truncate text-xs text-slate-500">
                                        AI Finance Assistant
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setMobileMenuOpen(false)
                                }
                                aria-label="Close menu"
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <nav className="space-y-2">
                            <MobileNavItem
                                href="/"
                                icon={
                                    <LayoutDashboard size={18} />
                                }
                                label="Dashboard"
                                onClick={() =>
                                    setMobileMenuOpen(false)
                                }
                            />

                            <MobileNavItem
                                href="/transactions"
                                icon={
                                    <CreditCard size={18} />
                                }
                                label="Transactions"
                                onClick={() =>
                                    setMobileMenuOpen(false)
                                }
                            />

                            <MobileNavItem
                                href="/budgets"
                                icon={<Target size={18} />}
                                label="Budgets"
                                onClick={() =>
                                    setMobileMenuOpen(false)
                                }
                            />

                            <MobileNavItem
                                href="/goals"
                                icon={<Goal size={18} />}
                                label="Goals"
                                active
                                onClick={() =>
                                    setMobileMenuOpen(false)
                                }
                            />

                            <MobileNavItem
                                href="/forecast"
                                icon={
                                    <TrendingUp size={18} />
                                }
                                label="Forecast"
                                onClick={() =>
                                    setMobileMenuOpen(false)
                                }
                            />

                            <MobileNavItem
                                href="/ai-coach"
                                icon={<Sparkles size={18} />}
                                label="AI Coach"
                                onClick={() =>
                                    setMobileMenuOpen(false)
                                }
                            />
                        </nav>

                        <div className="mt-8 border-t border-white/10 pt-5">
                            <MobileNavItem
                                href="/settings"
                                icon={<Settings size={18} />}
                                label="Settings"
                                onClick={() =>
                                    setMobileMenuOpen(false)
                                }
                            />
                        </div>

                        <div className="mt-auto pt-8">
                            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4">
                                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20">
                                    <Sparkles
                                        size={18}
                                        className="text-indigo-400"
                                    />
                                </div>

                                <p className="text-sm font-semibold">
                                    FinPilot AI
                                </p>

                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    Smarter control over your money.
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            )}

            {/* =================================================
                CREATE / EDIT MODAL
            ================================================= */}

            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-4">
                    <div className="my-3 flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl sm:my-4 sm:max-h-[calc(100dvh-2rem)]">
                        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 p-4 sm:p-6">
                            <div className="min-w-0">
                                <h2 className="text-lg font-bold sm:text-xl">
                                    {editingGoal
                                        ? "Edit Goal"
                                        : "Create Goal"}
                                </h2>

                                <p className="mt-1 text-sm leading-5 text-slate-500">
                                    Set a target and track your progress.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeGoalModal}
                                disabled={saving}
                                aria-label="Close modal"
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-50"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="min-h-0 space-y-5 overflow-y-auto overscroll-contain p-4 [scrollbar-color:rgb(71_85_105)_transparent] [scrollbar-width:thin] sm:p-6"
                        >
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-300">
                                    Goal Name
                                </label>

                                <input
                                    name="name"
                                    type="text"
                                    defaultValue={
                                        editingGoal?.name || ""
                                    }
                                    placeholder="Laptop"
                                    maxLength={100}
                                    required
                                    disabled={saving}
                                    className="min-h-11 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-indigo-500 disabled:opacity-60"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-300">
                                    Target Amount
                                </label>

                                <div className="relative">
                                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                        ₹
                                    </span>

                                    <input
                                        name="target_amount"
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        inputMode="decimal"
                                        defaultValue={
                                            editingGoal?.target_amount ||
                                            ""
                                        }
                                        placeholder="60000"
                                        required
                                        disabled={saving}
                                        className="min-h-11 w-full rounded-xl border border-white/10 bg-slate-900 py-3 pl-9 pr-4 text-white outline-none placeholder:text-slate-600 focus:border-indigo-500 disabled:opacity-60"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-300">
                                    Already Saved
                                </label>

                                <div className="relative">
                                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                        ₹
                                    </span>

                                    <input
                                        name="saved_amount"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        inputMode="decimal"
                                        defaultValue={
                                            editingGoal?.saved_amount ||
                                            0
                                        }
                                        placeholder="15000"
                                        disabled={saving}
                                        className="min-h-11 w-full rounded-xl border border-white/10 bg-slate-900 py-3 pl-9 pr-4 text-white outline-none placeholder:text-slate-600 focus:border-indigo-500 disabled:opacity-60"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-300">
                                    Target Date
                                </label>

                                <input
                                    name="target_date"
                                    type="date"
                                    defaultValue={
                                        editingGoal?.target_date || ""
                                    }
                                    disabled={saving}
                                    className="min-h-11 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-indigo-500 disabled:opacity-60"
                                />
                            </div>

                            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
                                <div className="flex items-start gap-3">
                                    <Sparkles
                                        size={18}
                                        className="mt-0.5 shrink-0 text-indigo-400"
                                    />

                                    <p className="text-xs leading-5 text-slate-400">
                                        FinPilot will use this information
                                        later to calculate how much you
                                        should save each month to reach
                                        your goal.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col-reverse gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={closeGoalModal}
                                    disabled={saving}
                                    className="min-h-11 flex-1 rounded-xl border border-white/10 px-4 py-3 font-medium text-slate-300 hover:bg-white/5 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 font-medium hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving && (
                                        <Loader2
                                            size={17}
                                            className="animate-spin"
                                        />
                                    )}

                                    {saving
                                        ? editingGoal
                                            ? "Saving..."
                                            : "Creating..."
                                        : editingGoal
                                            ? "Save Changes"
                                            : "Create Goal"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =================================================
                DELETE MODAL
            ================================================= */}

            {deleteId && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-4">
                    <div className="my-4 w-full max-w-sm rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-2xl sm:p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                            <AlertTriangle
                                size={22}
                                className="text-red-400"
                            />
                        </div>

                        <h2 className="mt-4 text-xl font-bold">
                            Delete goal?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            This will permanently remove the goal.
                        </p>

                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={() =>
                                    setDeleteId(null)
                                }
                                disabled={deleting}
                                className="min-h-11 flex-1 rounded-xl border border-white/10 px-4 py-3 font-medium text-slate-300 hover:bg-white/5 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 font-medium hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {deleting && (
                                    <Loader2
                                        size={17}
                                        className="animate-spin"
                                    />
                                )}

                                {deleting
                                    ? "Deleting..."
                                    : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

/* =========================================================
   DESKTOP NAVIGATION
========================================================= */

function NavItem({
    href,
    icon,
    label,
    active = false,
    badge,
}: {
    href: string;
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    badge?: string;
}) {
    return (
        <Link
            href={href}
            className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active
                ? "bg-indigo-500/10 text-indigo-300"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
        >
            {icon}

            <span className="min-w-0 flex-1 truncate">
                {label}
            </span>

            {badge && (
                <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-slate-600">
                    {badge}
                </span>
            )}
        </Link>
    );
}

/* =========================================================
   MOBILE NAVIGATION
========================================================= */

function MobileNavItem({
    href,
    icon,
    label,
    active = false,
    onClick,
}: {
    href: string;
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick: () => void;
}) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${active
                ? "bg-indigo-500/10 text-indigo-300"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
        >
            {icon}
            <span>{label}</span>
        </Link>
    );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
    title,
    value,
    subtitle,
    icon,
}: {
    title: string;
    value: string;
    subtitle: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm text-slate-400">
                    {title}
                </p>

                <div className="shrink-0 rounded-lg bg-white/5 p-2">
                    {icon}
                </div>
            </div>

            <p className="mt-5 truncate text-xl font-bold sm:text-2xl">
                {value}
            </p>

            <p className="mt-1 truncate text-xs text-slate-500">
                {subtitle}
            </p>
        </div>
    );
}

/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(date: string) {
    return new Date(`${date}T00:00:00`).toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );
}