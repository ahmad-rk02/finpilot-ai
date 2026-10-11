"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    AlertTriangle,
    ArrowDownRight,
    CheckCircle2,
    ChevronDown,
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

type Budget = {
    id: string;
    user_id: string;
    category: string;
    amount: number;
    month: string;
    created_at: string;
};

type Transaction = {
    id: string;
    user_id: string;
    type: "income" | "expense";
    amount: number;
    description: string;
    category: string;
    transaction_date: string;
    created_at: string;
};

const categories = [
    "Food",
    "Transport",
    "Shopping",
    "Bills",
    "Entertainment",
    "Health",
    "Education",
    "Travel",
    "Other",
];

export default function BudgetsPage() {
    return (
        <AuthGuard>
            <BudgetsContent />
        </AuthGuard>
    );
}

function BudgetsContent() {
    const [userId, setUserId] = useState<string | null>(null);

    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    const [loading, setLoading] = useState(true);

    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    /* =====================================================
       CURRENT MONTH
    ===================================================== */

    const currentMonth = useMemo(() => {
        const now = new Date();

        return `${now.getFullYear()}-${String(
            now.getMonth() + 1
        ).padStart(2, "0")}-01`;
    }, []);

    const currentMonthLabel = useMemo(() => {
        return new Date(`${currentMonth}T00:00:00`).toLocaleDateString(
            "en-IN",
            {
                month: "long",
                year: "numeric",
            }
        );
    }, [currentMonth]);

    /* =====================================================
       GET CURRENT USER
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
       LOAD DATA
    ===================================================== */

    async function loadData(activeUserId = userId) {
        if (!activeUserId) return;

        setLoading(true);

        try {
            const [budgetsResponse, transactionsResponse] =
                await Promise.all([
                    supabase
                        .from("budgets")
                        .select(
                            "id, user_id, category, amount, month, created_at"
                        )
                        .eq("user_id", activeUserId)
                        .eq("month", currentMonth)
                        .order("created_at", {
                            ascending: false,
                        }),

                    supabase
                        .from("transactions")
                        .select(
                            "id, user_id, type, amount, description, category, transaction_date, created_at"
                        )
                        .eq("user_id", activeUserId)
                        .eq("type", "expense")
                        .gte("transaction_date", currentMonth)
                        .lt(
                            "transaction_date",
                            getNextMonth(currentMonth)
                        )
                        .order("transaction_date", {
                            ascending: false,
                        }),
                ]);

            if (budgetsResponse.error) {
                console.error(
                    "Budget loading error:",
                    budgetsResponse.error
                );
            }

            if (transactionsResponse.error) {
                console.error(
                    "Transaction loading error:",
                    transactionsResponse.error
                );
            }

            setBudgets(
                (budgetsResponse.data || []) as Budget[]
            );

            setTransactions(
                (transactionsResponse.data || []) as Transaction[]
            );
        } catch (error) {
            console.error(
                "Budget data loading error:",
                error
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (userId) {
            loadData(userId);
        }
    }, [userId, currentMonth]);

    /* =====================================================
       SPENDING BY CATEGORY
    ===================================================== */

    function getCategorySpending(category: string) {
        return transactions
            .filter(
                (transaction) =>
                    transaction.category === category
            )
            .reduce(
                (total, transaction) =>
                    total + Number(transaction.amount),
                0
            );
    }

    /* =====================================================
       TOTALS
    ===================================================== */

    const totalBudget = useMemo(() => {
        return budgets.reduce(
            (total, budget) =>
                total + Number(budget.amount),
            0
        );
    }, [budgets]);

    const totalSpent = useMemo(() => {
        return transactions.reduce(
            (total, transaction) =>
                total + Number(transaction.amount),
            0
        );
    }, [transactions]);

    const totalRemaining = totalBudget - totalSpent;

    const overallPercentage =
        totalBudget > 0
            ? (totalSpent / totalBudget) * 100
            : 0;

    /* =====================================================
       CREATE / UPDATE BUDGET
    ===================================================== */

    async function handleBudgetSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (!userId) return;

        const formData = new FormData(
            event.currentTarget
        );

        const category = String(
            formData.get("category") || ""
        );

        const amount = Number(
            formData.get("amount")
        );

        if (!category || !amount || amount <= 0) {
            alert(
                "Please enter a valid category and budget amount."
            );
            return;
        }

        /* UPDATE */

        if (editingBudget) {
            const { data, error } = await supabase
                .from("budgets")
                .update({
                    category,
                    amount,
                })
                .eq("id", editingBudget.id)
                .eq("user_id", userId)
                .select()
                .single();

            if (error) {
                console.error(
                    "Budget update error:",
                    error
                );

                alert("Unable to update budget.");
                return;
            }

            setBudgets((current) =>
                current.map((budget) =>
                    budget.id === editingBudget.id
                        ? (data as Budget)
                        : budget
                )
            );

            setEditingBudget(null);
            setShowBudgetModal(false);

            return;
        }

        /* CREATE */

        const { data, error } = await supabase
            .from("budgets")
            .insert({
                user_id: userId,
                category,
                amount,
                month: currentMonth,
            })
            .select()
            .single();

        if (error) {
            console.error(
                "Budget creation error:",
                error
            );

            alert("Unable to create budget.");
            return;
        }

        setBudgets((current) => [
            data as Budget,
            ...current,
        ]);

        setShowBudgetModal(false);
    }

    /* =====================================================
       DELETE BUDGET
    ===================================================== */

    async function handleDeleteBudget() {
        if (!deleteId || !userId) return;

        setDeleting(true);

        const { error } = await supabase
            .from("budgets")
            .delete()
            .eq("id", deleteId)
            .eq("user_id", userId);

        if (error) {
            console.error(
                "Budget delete error:",
                error
            );

            alert("Unable to delete budget.");

            setDeleting(false);
            return;
        }

        setBudgets((current) =>
            current.filter(
                (budget) => budget.id !== deleteId
            )
        );

        setDeleteId(null);
        setDeleting(false);
    }

    /* =====================================================
       OPEN CREATE MODAL
    ===================================================== */

    function openCreateBudget() {
        setEditingBudget(null);
        setShowBudgetModal(true);
        setMobileMenuOpen(false);
    }

    /* =====================================================
       MAIN UI
    ===================================================== */

    return (
        <main className="min-h-[100dvh] overflow-x-hidden bg-slate-950 text-white">
            <div className="flex min-h-[100dvh]">
                {/* =================================================
            DESKTOP SIDEBAR
        ================================================= */}

                <aside className="hidden min-h-[100dvh] w-64 shrink-0 border-r border-white/10 bg-slate-950 p-5 md:block">
                    <SidebarContent />
                </aside>

                {/* =================================================
            MOBILE DRAWER
        ================================================= */}

                {mobileMenuOpen && (
                    <>
                        <button
                            type="button"
                            aria-label="Close navigation"
                            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
                            onClick={() => setMobileMenuOpen(false)}
                        />

                        <aside className="fixed inset-y-0 left-0 z-50 flex w-[min(18rem,calc(100vw-1rem))] flex-col overflow-y-auto border-r border-white/10 bg-slate-950 p-5 shadow-2xl md:hidden">
                            <div className="mb-6 flex items-center justify-between">
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
                                    className="flex min-h-10 min-w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/5 hover:text-white"
                                    aria-label="Close menu"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <MobileSidebarNav
                                closeMenu={() =>
                                    setMobileMenuOpen(false)
                                }
                            />
                        </aside>
                    </>
                )}

                {/* =================================================
            MAIN CONTENT
        ================================================= */}

                <section className="min-w-0 flex-1">
                    {/* MOBILE HEADER */}

                    <div className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/95 px-4 py-3 backdrop-blur md:hidden">
                        <div className="flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    setMobileMenuOpen(true)
                                }
                                className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 transition hover:bg-white/5 hover:text-white"
                                aria-label="Open navigation"
                                aria-expanded={mobileMenuOpen}
                            >
                                <Menu size={20} />
                            </button>

                            <div className="min-w-0 text-center">
                                <p className="truncate text-sm font-semibold">
                                    FinPilot
                                </p>

                                <p className="truncate text-[11px] text-slate-500">
                                    Budgets
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={openCreateBudget}
                                className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-indigo-500 text-white transition hover:bg-indigo-400"
                                aria-label="Create budget"
                            >
                                <Plus size={19} />
                            </button>
                        </div>
                    </div>

                    <div className="mx-auto w-full max-w-7xl px-4 py-5 pb-8 sm:px-6 sm:py-6 sm:pb-10 lg:px-8 lg:py-8">
                        {/* HEADER */}

                        <div className="mb-6 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                                <p className="text-sm text-slate-500">
                                    Monthly planning
                                </p>

                                <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
                                    Budgets
                                </h2>

                                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                                    Control your spending with
                                    category-based budgets.
                                </p>
                            </div>

                            <button
                                onClick={openCreateBudget}
                                className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-400 sm:w-auto"
                            >
                                <Plus size={18} />
                                Create Budget
                            </button>
                        </div>

                        {/* MONTH */}

                        <div className="mb-5 sm:mb-6">
                            <div className="inline-flex max-w-full items-center rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
                                <div className="min-w-0">
                                    <p className="text-xs text-slate-500">
                                        Current month
                                    </p>

                                    <p className="mt-0.5 truncate text-sm font-medium text-white">
                                        {currentMonthLabel}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* OVERVIEW CARDS */}

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            <StatCard
                                title="Total Budget"
                                value={`₹${totalBudget.toLocaleString(
                                    "en-IN",
                                    {
                                        minimumFractionDigits: 2,
                                    }
                                )}`}
                                subtitle={`${budgets.length} active budget${budgets.length !== 1
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
                                title="Total Spent"
                                value={`₹${totalSpent.toLocaleString(
                                    "en-IN",
                                    {
                                        minimumFractionDigits: 2,
                                    }
                                )}`}
                                subtitle={`${overallPercentage.toFixed(
                                    0
                                )}% of total budget used`}
                                icon={
                                    <ArrowDownRight
                                        size={20}
                                        className="text-red-400"
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
                                subtitle={
                                    totalRemaining >= 0
                                        ? "Available within budget"
                                        : "You are over budget"
                                }
                                icon={
                                    totalRemaining >= 0 ? (
                                        <CheckCircle2
                                            size={20}
                                            className="text-emerald-400"
                                        />
                                    ) : (
                                        <AlertTriangle
                                            size={20}
                                            className="text-red-400"
                                        />
                                    )
                                }
                            />
                        </div>

                        {/* OVERALL PROGRESS */}

                        {totalBudget > 0 && (
                            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:mt-6 sm:p-5">
                                <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-white">
                                            Monthly Budget Progress
                                        </h3>

                                        <p className="mt-1 text-sm text-slate-500">
                                            {currentMonthLabel}
                                        </p>
                                    </div>

                                    <p
                                        className={`shrink-0 font-semibold ${overallPercentage > 100
                                                ? "text-red-400"
                                                : overallPercentage >= 80
                                                    ? "text-amber-400"
                                                    : "text-emerald-400"
                                            }`}
                                    >
                                        {overallPercentage.toFixed(0)}%
                                    </p>
                                </div>

                                <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/5">
                                    <div
                                        className={`h-full rounded-full transition-all ${overallPercentage > 100
                                                ? "bg-red-500"
                                                : overallPercentage >= 80
                                                    ? "bg-amber-500"
                                                    : "bg-indigo-500"
                                            }`}
                                        style={{
                                            width: `${Math.min(
                                                Math.max(
                                                    overallPercentage,
                                                    0
                                                ),
                                                100
                                            )}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* BUDGET LIST */}

                        <div className="mt-5 sm:mt-6">
                            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                                <div className="min-w-0">
                                    <h3 className="text-lg font-semibold">
                                        Category Budgets
                                    </h3>

                                    <p className="mt-1 text-sm leading-5 text-slate-500">
                                        Track your spending limits by
                                        category.
                                    </p>
                                </div>

                                {budgets.length > 4 && (
                                    <p className="shrink-0 text-xs text-slate-600">
                                        Scroll to view more budgets
                                    </p>
                                )}
                            </div>

                            {loading ? (
                                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-16 text-center">
                                    <Loader2
                                        size={30}
                                        className="mx-auto animate-spin text-indigo-400"
                                    />

                                    <p className="mt-3 text-sm text-slate-500">
                                        Loading budgets...
                                    </p>
                                </div>
                            ) : budgets.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-14 text-center sm:px-5 sm:py-16">
                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10">
                                        <Target
                                            size={25}
                                            className="text-indigo-400"
                                        />
                                    </div>

                                    <h3 className="mt-5 font-semibold text-white">
                                        No budgets yet
                                    </h3>

                                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                                        Create your first category
                                        budget and FinPilot will
                                        automatically compare it with
                                        your actual spending.
                                    </p>

                                    <button
                                        onClick={openCreateBudget}
                                        className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-medium transition hover:bg-indigo-400 sm:w-auto"
                                    >
                                        <Plus size={17} />
                                        Create Your First Budget
                                    </button>
                                </div>
                            ) : budgets.length > 4 ? (
                                /*
                                 * Only the potentially unbounded budget
                                 * list gets an internal scrollbar.
                                 *
                                 * The rest of the page remains naturally
                                 * scrollable and accessible.
                                 */
                                <div
                                    className="max-h-[52vh] min-h-0 overflow-y-auto overscroll-contain pr-1 sm:max-h-[58vh] lg:max-h-[calc(100dvh-25rem)]"
                                    style={{
                                        scrollbarGutter: "stable",
                                    }}
                                >
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {budgets.map((budget) => {
                                            const spent =
                                                getCategorySpending(
                                                    budget.category
                                                );

                                            const budgetAmount = Number(
                                                budget.amount
                                            );

                                            const remaining =
                                                budgetAmount - spent;

                                            const percentage =
                                                budgetAmount > 0
                                                    ? (spent /
                                                        budgetAmount) *
                                                    100
                                                    : 0;

                                            const isOver =
                                                percentage > 100;

                                            const isWarning =
                                                percentage >= 80 &&
                                                percentage <= 100;

                                            return (
                                                <BudgetCard
                                                    key={budget.id}
                                                    budget={budget}
                                                    spent={spent}
                                                    remaining={remaining}
                                                    percentage={percentage}
                                                    isOver={isOver}
                                                    isWarning={isWarning}
                                                    onEdit={() => {
                                                        setEditingBudget(
                                                            budget
                                                        );
                                                        setShowBudgetModal(
                                                            true
                                                        );
                                                    }}
                                                    onDelete={() =>
                                                        setDeleteId(
                                                            budget.id
                                                        )
                                                    }
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {budgets.map((budget) => {
                                        const spent =
                                            getCategorySpending(
                                                budget.category
                                            );

                                        const budgetAmount = Number(
                                            budget.amount
                                        );

                                        const remaining =
                                            budgetAmount - spent;

                                        const percentage =
                                            budgetAmount > 0
                                                ? (spent /
                                                    budgetAmount) *
                                                100
                                                : 0;

                                        const isOver =
                                            percentage > 100;

                                        const isWarning =
                                            percentage >= 80 &&
                                            percentage <= 100;

                                        return (
                                            <BudgetCard
                                                key={budget.id}
                                                budget={budget}
                                                spent={spent}
                                                remaining={remaining}
                                                percentage={percentage}
                                                isOver={isOver}
                                                isWarning={isWarning}
                                                onEdit={() => {
                                                    setEditingBudget(
                                                        budget
                                                    );
                                                    setShowBudgetModal(
                                                        true
                                                    );
                                                }}
                                                onDelete={() =>
                                                    setDeleteId(
                                                        budget.id
                                                    )
                                                }
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>

            {/* =================================================
          CREATE / EDIT BUDGET MODAL
      ================================================= */}

            {showBudgetModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-4"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            setShowBudgetModal(false);
                            setEditingBudget(null);
                        }
                    }}
                >
                    <div className="my-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl sm:max-h-[calc(100dvh-2rem)]">
                        {/* HEADER */}

                        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 p-4 sm:p-6">
                            <div className="min-w-0">
                                <h2 className="text-lg font-bold text-white sm:text-xl">
                                    {editingBudget
                                        ? "Edit Budget"
                                        : "Create Budget"}
                                </h2>

                                <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                                    Set your spending limit for a
                                    category.
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    setShowBudgetModal(false);
                                    setEditingBudget(null);
                                }}
                                className="flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/5 hover:text-white"
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* FORM */}

                        <form
                            onSubmit={handleBudgetSubmit}
                            className="min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6"
                        >
                            <div className="space-y-5">
                                {/* CATEGORY */}

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-300">
                                        Category
                                    </label>

                                    <div className="relative">
                                        <select
                                            name="category"
                                            defaultValue={
                                                editingBudget?.category ||
                                                ""
                                            }
                                            required
                                            className="min-h-11 w-full appearance-none rounded-xl border border-white/10 bg-slate-900 px-4 py-3 pr-10 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                        >
                                            <option
                                                value=""
                                                disabled
                                            >
                                                Select category
                                            </option>

                                            {categories.map(
                                                (category) => (
                                                    <option
                                                        key={category}
                                                        value={category}
                                                    >
                                                        {category}
                                                    </option>
                                                )
                                            )}
                                        </select>

                                        <ChevronDown
                                            size={17}
                                            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                                        />
                                    </div>
                                </div>

                                {/* AMOUNT */}

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-300">
                                        Monthly Budget
                                    </label>

                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                            ₹
                                        </span>

                                        <input
                                            name="amount"
                                            type="number"
                                            inputMode="decimal"
                                            min="1"
                                            step="0.01"
                                            defaultValue={
                                                editingBudget?.amount ||
                                                ""
                                            }
                                            placeholder="5000"
                                            required
                                            className="min-h-11 w-full rounded-xl border border-white/10 bg-slate-900 py-3 pl-9 pr-4 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                {/* MONTH */}

                                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
                                            <Target
                                                size={18}
                                                className="text-indigo-400"
                                            />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-white">
                                                Budget period
                                            </p>

                                            <p className="truncate text-xs text-slate-500">
                                                {currentMonthLabel}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* BUTTONS */}

                                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowBudgetModal(false);
                                            setEditingBudget(null);
                                        }}
                                        className="min-h-11 flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="min-h-11 flex-1 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-400"
                                    >
                                        {editingBudget
                                            ? "Save Changes"
                                            : "Create Budget"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =================================================
          DELETE MODAL
      ================================================= */}

            {deleteId && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-4"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            if (!deleting) {
                                setDeleteId(null);
                            }
                        }
                    }}
                >
                    <div className="my-auto w-full max-w-sm rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-2xl sm:p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                            <Trash2
                                size={22}
                                className="text-red-400"
                            />
                        </div>

                        <h2 className="mt-4 text-xl font-bold text-white">
                            Delete budget?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            This budget will be permanently
                            removed. Your transactions will not be
                            affected.
                        </p>

                        <div className="mt-6 flex flex-col-reverse gap-3 min-[420px]:flex-row">
                            <button
                                onClick={() =>
                                    setDeleteId(null)
                                }
                                disabled={deleting}
                                className="min-h-11 flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleDeleteBudget}
                                disabled={deleting}
                                className="min-h-11 flex-1 rounded-xl bg-red-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-red-400 disabled:opacity-60"
                            >
                                {deleting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2
                                            size={16}
                                            className="animate-spin"
                                        />
                                        Deleting...
                                    </span>
                                ) : (
                                    "Delete"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

/* =========================================================
   SIDEBAR CONTENT
========================================================= */

function SidebarContent() {
    return (
        <>
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
                    icon={
                        <LayoutDashboard size={18} />
                    }
                    label="Dashboard"
                />

                <NavItem
                    href="/transactions"
                    icon={
                        <CreditCard size={18} />
                    }
                    label="Transactions"
                />

                <NavItem
                    href="/budgets"
                    icon={
                        <Target size={18} />
                    }
                    label="Budgets"
                    active
                />

                <NavItem
                    href="/goals"
                    icon={
                        <Goal size={18} />
                    }
                    label="Goals"
                />

                <NavItem
                    href="/forecast"
                    icon={
                        <TrendingUp size={18} />
                    }
                    label="Forecast"
                />

                <NavItem
                    href="/ai-coach"
                    icon={
                        <Sparkles size={18} />
                    }
                    label="AI Coach"
                />
            </nav>

            <div className="mt-10 border-t border-white/10 pt-5">
                <NavItem
                    href="/settings"
                    icon={
                        <Settings size={18} />
                    }
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
        </>
    );
}

/* =========================================================
   MOBILE SIDEBAR NAV
========================================================= */

function MobileSidebarNav({
    closeMenu,
}: {
    closeMenu: () => void;
}) {
    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <nav className="space-y-2">
                <MobileNavItem
                    href="/"
                    icon={
                        <LayoutDashboard size={18} />
                    }
                    label="Dashboard"
                    closeMenu={closeMenu}
                />

                <MobileNavItem
                    href="/transactions"
                    icon={
                        <CreditCard size={18} />
                    }
                    label="Transactions"
                    closeMenu={closeMenu}
                />

                <MobileNavItem
                    href="/budgets"
                    icon={
                        <Target size={18} />
                    }
                    label="Budgets"
                    active
                    closeMenu={closeMenu}
                />

                <MobileNavItem
                    href="/goals"
                    icon={
                        <Goal size={18} />
                    }
                    label="Goals"
                    closeMenu={closeMenu}
                />

                <MobileNavItem
                    href="/forecast"
                    icon={
                        <TrendingUp size={18} />
                    }
                    label="Forecast"
                    closeMenu={closeMenu}
                />

                <MobileNavItem
                    href="/ai-coach"
                    icon={
                        <Sparkles size={18} />
                    }
                    label="AI Coach"
                    closeMenu={closeMenu}
                />
            </nav>

            <div className="mt-8 border-t border-white/10 pt-5">
                <MobileNavItem
                    href="/settings"
                    icon={
                        <Settings size={18} />
                    }
                    label="Settings"
                    closeMenu={closeMenu}
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
        </div>
    );
}

/* =========================================================
   MOBILE NAV ITEM
========================================================= */

function MobileNavItem({
    href,
    icon,
    label,
    active = false,
    closeMenu,
}: NavItemProps & {
    closeMenu: () => void;
}) {
    return (
        <Link
            href={href}
            onClick={closeMenu}
            className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active
                    ? "bg-indigo-500/10 text-indigo-300"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
        >
            {icon}

            <span className="min-w-0 flex-1 truncate">
                {label}
            </span>
        </Link>
    );
}

/* =========================================================
   BUDGET CARD
========================================================= */

type BudgetCardProps = {
    budget: Budget;
    spent: number;
    remaining: number;
    percentage: number;
    isOver: boolean;
    isWarning: boolean;
    onEdit: () => void;
    onDelete: () => void;
};

function BudgetCard({
    budget,
    spent,
    remaining,
    percentage,
    isOver,
    isWarning,
    onEdit,
    onDelete,
}: BudgetCardProps) {
    const progressWidth = Math.min(
        Math.max(percentage, 0),
        100
    );

    return (
        <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/15 sm:p-5">
            {/* TOP */}

            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isOver
                                ? "bg-red-500/10"
                                : isWarning
                                    ? "bg-amber-500/10"
                                    : "bg-indigo-500/10"
                            }`}
                    >
                        {isOver ? (
                            <AlertTriangle
                                size={20}
                                className="text-red-400"
                            />
                        ) : isWarning ? (
                            <AlertTriangle
                                size={20}
                                className="text-amber-400"
                            />
                        ) : (
                            <Target
                                size={20}
                                className="text-indigo-400"
                            />
                        )}
                    </div>

                    <div className="min-w-0">
                        <h4 className="break-words font-semibold text-white">
                            {budget.category}
                        </h4>

                        <p className="mt-0.5 text-xs text-slate-500">
                            Monthly budget
                        </p>
                    </div>
                </div>

                {/* ACTIONS */}

                <div className="flex shrink-0 gap-1">
                    <button
                        onClick={onEdit}
                        className="flex min-h-10 min-w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-indigo-500/10 hover:text-indigo-400"
                        title="Edit budget"
                        aria-label="Edit budget"
                    >
                        <Edit3 size={16} />
                    </button>

                    <button
                        onClick={onDelete}
                        className="flex min-h-10 min-w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                        title="Delete budget"
                        aria-label="Delete budget"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* AMOUNTS */}

            <div className="mt-6 grid grid-cols-1 gap-4 min-[400px]:grid-cols-2">
                <div className="min-w-0">
                    <p className="text-xs text-slate-500">
                        Spent
                    </p>

                    <p className="mt-1 break-words text-xl font-bold text-white">
                        ₹
                        {spent.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                        })}
                    </p>
                </div>

                <div className="min-w-0 min-[400px]:text-right">
                    <p className="text-xs text-slate-500">
                        Budget
                    </p>

                    <p className="mt-1 break-words text-sm font-medium text-slate-300">
                        ₹
                        {Number(
                            budget.amount
                        ).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                        })}
                    </p>
                </div>
            </div>

            {/* PROGRESS */}

            <div className="mt-5">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                        className={`h-full rounded-full transition-all ${isOver
                                ? "bg-red-500"
                                : isWarning
                                    ? "bg-amber-500"
                                    : "bg-indigo-500"
                            }`}
                        style={{
                            width: `${progressWidth}%`,
                        }}
                    />
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <span
                        className={`text-xs font-medium ${isOver
                                ? "text-red-400"
                                : isWarning
                                    ? "text-amber-400"
                                    : "text-slate-500"
                            }`}
                    >
                        {percentage.toFixed(0)}% used
                    </span>

                    <span
                        className={`break-words text-right text-xs ${remaining < 0
                                ? "text-red-400"
                                : "text-slate-500"
                            }`}
                    >
                        {remaining >= 0
                            ? `₹${remaining.toLocaleString(
                                "en-IN",
                                {
                                    minimumFractionDigits: 2,
                                }
                            )} left`
                            : `₹${Math.abs(
                                remaining
                            ).toLocaleString(
                                "en-IN",
                                {
                                    minimumFractionDigits: 2,
                                }
                            )} over`}
                    </span>
                </div>
            </div>

            {/* STATUS */}

            <div className="mt-5">
                {isOver ? (
                    <div className="flex items-start gap-2 rounded-xl bg-red-500/10 px-3 py-2.5 text-xs leading-5 text-red-400">
                        <AlertTriangle
                            size={15}
                            className="mt-0.5 shrink-0"
                        />

                        <span>
                            You have exceeded this budget.
                        </span>
                    </div>
                ) : isWarning ? (
                    <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2.5 text-xs leading-5 text-amber-400">
                        <AlertTriangle
                            size={15}
                            className="mt-0.5 shrink-0"
                        />

                        <span>
                            You're getting close to your limit.
                        </span>
                    </div>
                ) : (
                    <div className="flex items-start gap-2 rounded-xl bg-emerald-500/10 px-3 py-2.5 text-xs leading-5 text-emerald-400">
                        <CheckCircle2
                            size={15}
                            className="mt-0.5 shrink-0"
                        />

                        <span>
                            You're within your budget.
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

/* =========================================================
   NAV ITEM
========================================================= */

type NavItemProps = {
    href: string;
    icon: React.ReactNode;
    label: string;
    active?: boolean;
};

function NavItem({
    href,
    icon,
    label,
    active = false,
}: NavItemProps) {
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
        </Link>
    );
}

/* =========================================================
   STAT CARD
========================================================= */

type StatCardProps = {
    title: string;
    value: string;
    subtitle: string;
    icon: React.ReactNode;
};

function StatCard({
    title,
    value,
    subtitle,
    icon,
}: StatCardProps) {
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

            <p className="mt-5 break-words text-2xl font-bold text-white">
                {value}
            </p>

            <p className="mt-1 break-words text-xs text-slate-500">
                {subtitle}
            </p>
        </div>
    );
}

/* =========================================================
   NEXT MONTH HELPER
========================================================= */

function getNextMonth(month: string) {
    const date = new Date(
        `${month}T00:00:00`
    );

    date.setMonth(
        date.getMonth() + 1
    );

    return `${date.getFullYear()}-${String(
        date.getMonth() + 1
    ).padStart(2, "0")}-01`;
}