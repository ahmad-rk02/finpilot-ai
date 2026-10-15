"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    BarChart3,
    CreditCard,
    Goal,
    LayoutDashboard,
    Loader2,
    Menu,
    Settings,
    Sparkles,
    Target,
    TrendingUp,
    Wallet,
    X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import AuthGuard from "@/app/components/AuthGuard";
import { useRealtimeSync } from "@/lib/useRealtimeSync";

type Transaction = {
    id: string;
    type: "income" | "expense";
    amount: number;
    description: string;
    category: string;
    transaction_date: string;
};

type Budget = {
    id: string;
    category: string;
    amount: number;
};

type Confidence = "low" | "medium" | "high";

export default function ForecastPage() {
    return (
        <AuthGuard>
            <ForecastContent />
        </AuthGuard>
    );
}

function ForecastContent() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [previousMonthTransactions, setPreviousMonthTransactions] = useState<
        Transaction[]
    >([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    /* =====================================================
       DATE INFORMATION
    ===================================================== */

    const dateInfo = useMemo(() => {
        const now = new Date();

        const year = now.getFullYear();
        const month = now.getMonth();

        const firstDay = new Date(year, month, 1);
        const nextMonth = new Date(year, month + 1, 1);
        const previousMonth = new Date(year, month - 1, 1);
        const previousMonthEnd = new Date(year, month, 0);

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysElapsed = now.getDate();

        const daysRemaining = Math.max(daysInMonth - daysElapsed, 0);

        function formatDate(date: Date) {
            return `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        }

        return {
            year,
            month,
            firstDay,
            nextMonth,
            previousMonth,
            previousMonthEnd,
            daysInMonth,
            daysElapsed,
            daysRemaining,
            currentMonthStart: formatDate(firstDay),
            nextMonthStart: formatDate(nextMonth),
            previousMonthStart: formatDate(previousMonth),
            previousMonthEndDate: formatDate(previousMonthEnd),
            monthName: now.toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
            }),
        };
    }, []);

    /* =====================================================
       LOAD DATA
    ===================================================== */

    const loadData = useCallback(async () => {
        setLoading(true);

        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) {
                throw userError;
            }

            if (!user) {
                return;
            }

            setUserId(user.id);

            const [
                currentTransactionsResponse,
                previousTransactionsResponse,
                budgetResponse,
            ] = await Promise.all([
                supabase
                    .from("transactions")
                    .select(
                        "id, type, amount, description, category, transaction_date"
                    )
                    .eq("user_id", user.id)
                    .gte("transaction_date", dateInfo.currentMonthStart)
                    .lt("transaction_date", dateInfo.nextMonthStart)
                    .order("transaction_date", {
                        ascending: true,
                    }),

                supabase
                    .from("transactions")
                    .select(
                        "id, type, amount, description, category, transaction_date"
                    )
                    .eq("user_id", user.id)
                    .gte("transaction_date", dateInfo.previousMonthStart)
                    .lte("transaction_date", dateInfo.previousMonthEndDate)
                    .order("transaction_date", {
                        ascending: true,
                    }),

                supabase
                    .from("budgets")
                    .select("id, category, amount")
                    .eq("user_id", user.id)
                    .eq("month", dateInfo.currentMonthStart),
            ]);

            if (currentTransactionsResponse.error) {
                console.error(
                    "Current transaction error:",
                    currentTransactionsResponse.error
                );
            }

            if (previousTransactionsResponse.error) {
                console.error(
                    "Previous transaction error:",
                    previousTransactionsResponse.error
                );
            }

            if (budgetResponse.error) {
                console.error("Budget error:", budgetResponse.error);
            }

            setTransactions(
                (currentTransactionsResponse.data || []) as Transaction[]
            );

            setPreviousMonthTransactions(
                (previousTransactionsResponse.data || []) as Transaction[]
            );

            setBudgets((budgetResponse.data || []) as Budget[]);
        } catch (error) {
            console.error("Forecast data loading error:", error);

            setTransactions([]);
            setPreviousMonthTransactions([]);
            setBudgets([]);
        } finally {
            setLoading(false);
        }
    }, [dateInfo]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Keep in sync across tabs
    useRealtimeSync({
        userId,
        tables: ["transactions", "budgets"],
        onRefresh: loadData,
    });

    /* =====================================================
       CURRENT MONTH INCOME
    ===================================================== */

    const income = useMemo(() => {
        return transactions
            .filter((transaction) => transaction.type === "income")
            .reduce(
                (total, transaction) => total + Number(transaction.amount),
                0
            );
    }, [transactions]);

    /* =====================================================
       CURRENT MONTH EXPENSES
    ===================================================== */

    const expenses = useMemo(() => {
        return transactions
            .filter((transaction) => transaction.type === "expense")
            .reduce(
                (total, transaction) => total + Number(transaction.amount),
                0
            );
    }, [transactions]);

    /* =====================================================
       PREVIOUS MONTH EXPENSES
    ===================================================== */

    const previousMonthExpenses = useMemo(() => {
        return previousMonthTransactions
            .filter((transaction) => transaction.type === "expense")
            .reduce(
                (total, transaction) => total + Number(transaction.amount),
                0
            );
    }, [previousMonthTransactions]);

    /* =====================================================
       BALANCE
    ===================================================== */

    const balance = income - expenses;

    /* =====================================================
       DAILY AVERAGE
    ===================================================== */

    const dailyAverage =
        dateInfo.daysElapsed > 0 ? expenses / dateInfo.daysElapsed : 0;

    /* =====================================================
       CURRENT-PACE PROJECTION
    ===================================================== */

    const currentPaceProjection = dailyAverage * dateInfo.daysInMonth;

    /* =====================================================
       PREVIOUS MONTH BASELINE
    ===================================================== */

    const previousMonthBaseline =
        previousMonthExpenses > 0 ? previousMonthExpenses : null;

    /* =====================================================
       BLENDED FORECAST
    ===================================================== */

    const forecast = useMemo(() => {
        if (previousMonthBaseline !== null) {
            return currentPaceProjection * 0.6 + previousMonthBaseline * 0.4;
        }

        return currentPaceProjection;
    }, [currentPaceProjection, previousMonthBaseline]);

    /* =====================================================
       CONFIDENCE
    ===================================================== */

    const confidence: Confidence =
        dateInfo.daysElapsed <= 3
            ? "low"
            : dateInfo.daysElapsed <= 10
                ? "medium"
                : "high";

    const confidenceText = {
        low: "Low confidence",
        medium: "Medium confidence",
        high: "High confidence",
    }[confidence];

    const confidenceDescription = {
        low: "Only a few days of current-month data are available. The forecast may change significantly.",
        medium:
            "There is enough current-month data to provide a useful estimate, but spending patterns can still change.",
        high:
            "Most of the month has passed, so the current forecast is based on a stronger spending pattern.",
    }[confidence];

    /* =====================================================
       BUDGET
    ===================================================== */

    const totalBudget = budgets.reduce(
        (total, budget) => total + Number(budget.amount),
        0
    );

    const currentBudgetUsage =
        totalBudget > 0 ? (expenses / totalBudget) * 100 : 0;

    const projectedBudgetUsage =
        totalBudget > 0 ? (forecast / totalBudget) * 100 : 0;

    const budgetDifference = totalBudget - forecast;

    /* =====================================================
       CATEGORY SPENDING
    ===================================================== */

    const categorySpending = useMemo(() => {
        const map: Record<string, number> = {};

        transactions
            .filter((transaction) => transaction.type === "expense")
            .forEach((transaction) => {
                const category = transaction.category || "Other";

                map[category] =
                    (map[category] || 0) + Number(transaction.amount);
            });

        return Object.entries(map)
            .map(([category, amount]) => ({
                category,
                amount,
            }))
            .sort((a, b) => b.amount - a.amount);
    }, [transactions]);

    /* =====================================================
       FORECAST STATUS
    ===================================================== */

    let forecastStatus = "On track";

    let forecastDescription =
        "Your projected spending is currently within your monthly budget.";

    if (totalBudget > 0 && forecast > totalBudget) {
        forecastStatus = "Budget risk";

        forecastDescription =
            "Your current spending pattern suggests that you may exceed your monthly budget.";
    } else if (totalBudget > 0 && projectedBudgetUsage >= 80) {
        forecastStatus = "Watch spending";

        forecastDescription =
            "Your projected spending is getting close to your monthly budget.";
    } else if (income > 0 && forecast > income) {
        forecastStatus = "Cash-flow risk";

        forecastDescription =
            "Your projected expenses are higher than your recorded income for this month.";
    }

    /* =====================================================
       NAVIGATION
    ===================================================== */

    const navigation = [
        {
            href: "/",
            icon: <LayoutDashboard size={18} />,
            label: "Dashboard",
        },
        {
            href: "/transactions",
            icon: <CreditCard size={18} />,
            label: "Transactions",
        },
        {
            href: "/budgets",
            icon: <Target size={18} />,
            label: "Budgets",
        },
        {
            href: "/goals",
            icon: <Goal size={18} />,
            label: "Goals",
        },
        {
            href: "/forecast",
            icon: <TrendingUp size={18} />,
            label: "Forecast",
            active: true,
        },
        {
            href: "/ai-coach",
            icon: <Sparkles size={18} />,
            label: "AI Coach",
        },
    ];

    return (
        <main className="min-h-[100dvh] overflow-x-hidden bg-slate-950 text-white">
            <div className="flex min-h-[100dvh]">
                {/* =====================================================
            DESKTOP SIDEBAR
        ===================================================== */}

                <aside className="hidden min-h-[100dvh] w-64 shrink-0 border-r border-white/10 bg-slate-950 p-5 md:block">
                    <div className="mb-10 flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500">
                            <Wallet size={21} />
                        </div>

                        <div className="min-w-0">
                            <h1 className="font-bold">FinPilot</h1>

                            <p className="truncate text-xs text-slate-500">
                                AI Finance Assistant
                            </p>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        {navigation.map((item) => (
                            <NavItem
                                key={item.href}
                                href={item.href}
                                icon={item.icon}
                                label={item.label}
                                active={item.active}
                            />
                        ))}
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
                            <Sparkles size={18} className="text-indigo-400" />
                        </div>

                        <p className="text-sm font-semibold">FinPilot AI</p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                            Smarter control over your money.
                        </p>
                    </div>
                </aside>

                {/* =====================================================
            MOBILE MENU
        ===================================================== */}

                {mobileMenuOpen && (
                    <>
                        <button
                            type="button"
                            aria-label="Close navigation"
                            onClick={() => setMobileMenuOpen(false)}
                            className="fixed inset-0 z-40 bg-black/70 md:hidden"
                        />

                        <aside className="fixed inset-y-0 left-0 z-50 flex w-[min(18rem,calc(100vw-1rem))] flex-col overflow-y-auto border-r border-white/10 bg-slate-950 p-4 shadow-2xl md:hidden">
                            <div className="mb-7 flex items-center justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500">
                                        <Wallet size={21} />
                                    </div>

                                    <div className="min-w-0">
                                        <h1 className="font-bold">FinPilot</h1>

                                        <p className="truncate text-xs text-slate-500">
                                            AI Finance Assistant
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    aria-label="Close menu"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/5 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <nav className="space-y-2">
                                {navigation.map((item) => (
                                    <NavItem
                                        key={item.href}
                                        href={item.href}
                                        icon={item.icon}
                                        label={item.label}
                                        active={item.active}
                                        onClick={() => setMobileMenuOpen(false)}
                                    />
                                ))}
                            </nav>

                            <div className="mt-8 border-t border-white/10 pt-5">
                                <NavItem
                                    href="/settings"
                                    icon={<Settings size={18} />}
                                    label="Settings"
                                    onClick={() => setMobileMenuOpen(false)}
                                />
                            </div>

                            <div className="mt-8 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4">
                                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20">
                                    <Sparkles size={18} className="text-indigo-400" />
                                </div>

                                <p className="text-sm font-semibold">FinPilot AI</p>

                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    Smarter control over your money.
                                </p>
                            </div>
                        </aside>
                    </>
                )}

                {/* =====================================================
            MAIN CONTENT
        ===================================================== */}

                <section className="min-w-0 flex-1">
                    <div className="mx-auto w-full max-w-7xl px-3 py-4 pb-8 sm:px-6 sm:py-6 sm:pb-10 lg:px-8 lg:py-8">
                        {/* MOBILE HEADER */}

                        <div className="mb-5 flex items-center justify-between gap-3 md:hidden">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500">
                                    <Wallet size={20} />
                                </div>

                                <div className="min-w-0">
                                    <p className="font-bold">FinPilot</p>
                                    <p className="truncate text-xs text-slate-500">
                                        Financial Forecast
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                aria-label="Open navigation menu"
                                aria-expanded={mobileMenuOpen}
                                onClick={() => setMobileMenuOpen(true)}
                                className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 transition hover:bg-white/5 hover:text-white"
                            >
                                <Menu size={21} />
                            </button>
                        </div>

                        {/* HEADER */}

                        <div className="mb-6 sm:mb-8">
                            <p className="text-sm text-slate-500">
                                Financial outlook
                            </p>

                            <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
                                Forecast
                            </h2>

                            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                                Understand where your money is heading this month.
                            </p>
                        </div>

                        {/* MONTH */}

                        <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:mb-6 sm:p-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
                                    <BarChart3
                                        size={21}
                                        className="text-indigo-400"
                                    />
                                </div>

                                <div className="min-w-0">
                                    <p className="text-sm text-slate-500">
                                        Current forecast
                                    </p>

                                    <h3 className="break-words font-semibold">
                                        {dateInfo.monthName}
                                    </h3>
                                </div>
                            </div>
                        </div>

                        {/* LOADING */}

                        {loading ? (
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-20 text-center">
                                <Loader2
                                    size={30}
                                    className="mx-auto animate-spin text-indigo-400"
                                />

                                <p className="mt-3 text-sm text-slate-500">
                                    Analyzing your finances...
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* =====================================================
                    OVERVIEW
                ===================================================== */}

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                    <StatCard
                                        title="Income"
                                        value={`₹${income.toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                        })}`}
                                        subtitle="This month"
                                        icon={
                                            <ArrowUpRight
                                                size={20}
                                                className="text-emerald-400"
                                            />
                                        }
                                    />

                                    <StatCard
                                        title="Spent"
                                        value={`₹${expenses.toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                        })}`}
                                        subtitle={`₹${dailyAverage.toFixed(2)} per day`}
                                        icon={
                                            <ArrowDownRight
                                                size={20}
                                                className="text-red-400"
                                            />
                                        }
                                    />

                                    <StatCard
                                        title="Current Balance"
                                        value={`₹${balance.toLocaleString("en-IN", {
                                            minimumFractionDigits: 2,
                                        })}`}
                                        subtitle="Income minus expenses"
                                        icon={
                                            <Wallet
                                                size={20}
                                                className="text-indigo-400"
                                            />
                                        }
                                    />

                                    <StatCard
                                        title="Forecast"
                                        value={`₹${forecast.toLocaleString("en-IN", {
                                            maximumFractionDigits: 0,
                                        })}`}
                                        subtitle="Estimated month-end"
                                        icon={
                                            <TrendingUp
                                                size={20}
                                                className="text-amber-400"
                                            />
                                        }
                                    />
                                </div>

                                {/* =====================================================
                    CONFIDENCE
                ===================================================== */}

                                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:mt-6 sm:p-5">
                                    <div className="flex items-start gap-3 sm:gap-4">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
                                            <Sparkles
                                                size={20}
                                                className="text-indigo-400"
                                            />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                                <h3 className="font-semibold">
                                                    Forecast confidence
                                                </h3>

                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-medium ${confidence === "low"
                                                        ? "bg-amber-500/10 text-amber-400"
                                                        : confidence === "medium"
                                                            ? "bg-indigo-500/10 text-indigo-300"
                                                            : "bg-emerald-500/10 text-emerald-400"
                                                        }`}
                                                >
                                                    {confidenceText}
                                                </span>
                                            </div>

                                            <p className="mt-2 text-sm leading-6 text-slate-400">
                                                {confidenceDescription}
                                            </p>

                                            <p className="mt-3 text-xs text-slate-600">
                                                Based on {dateInfo.daysElapsed} day
                                                {dateInfo.daysElapsed !== 1 ? "s" : ""} of
                                                current-month data.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* =====================================================
                    STATUS
                ===================================================== */}

                                <div className="mt-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 sm:mt-6 sm:p-5">
                                    <div className="flex items-start gap-3 sm:gap-4">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
                                            {forecastStatus === "Budget risk" ||
                                                forecastStatus === "Cash-flow risk" ? (
                                                <AlertTriangle
                                                    size={21}
                                                    className="text-red-400"
                                                />
                                            ) : (
                                                <Sparkles
                                                    size={21}
                                                    className="text-indigo-400"
                                                />
                                            )}
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-xs uppercase tracking-wide text-slate-500">
                                                FinPilot Forecast
                                            </p>

                                            <h3 className="mt-1 font-semibold">
                                                {forecastStatus}
                                            </h3>

                                            <p className="mt-1 text-sm leading-6 text-slate-400">
                                                {forecastDescription}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* =====================================================
                    FORECAST DETAILS
                ===================================================== */}

                                <div className="mt-5 grid gap-5 sm:mt-6 lg:grid-cols-2 lg:gap-6">
                                    {/* PROJECTION */}

                                    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <h3 className="font-semibold">
                                                    Month-end projection
                                                </h3>

                                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                                    Based on current spending and available
                                                    history
                                                </p>
                                            </div>

                                            <TrendingUp
                                                size={20}
                                                className="shrink-0 text-indigo-400"
                                            />
                                        </div>

                                        <div className="mt-7">
                                            <p className="text-sm text-slate-500">
                                                Estimated expenses
                                            </p>

                                            <p className="mt-1 break-words text-3xl font-bold">
                                                ₹
                                                {forecast.toLocaleString("en-IN", {
                                                    maximumFractionDigits: 0,
                                                })}
                                            </p>
                                        </div>

                                        <div className="mt-6 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
                                            <MiniStat
                                                label="Current daily pace"
                                                value={`₹${dailyAverage.toFixed(2)}`}
                                            />

                                            <MiniStat
                                                label="Days remaining"
                                                value={`${dateInfo.daysRemaining}`}
                                            />
                                        </div>

                                        {previousMonthBaseline !== null && (
                                            <div className="mt-4 rounded-xl bg-white/[0.03] p-4">
                                                <p className="text-xs text-slate-500">
                                                    Previous month spending
                                                </p>

                                                <p className="mt-1 break-words font-semibold">
                                                    ₹
                                                    {previousMonthBaseline.toLocaleString(
                                                        "en-IN",
                                                        {
                                                            minimumFractionDigits: 2,
                                                        }
                                                    )}
                                                </p>
                                            </div>
                                        )}

                                        <div className="mt-4 rounded-xl bg-white/[0.03] p-4">
                                            <p className="text-xs text-slate-500">
                                                Projected balance
                                            </p>

                                            <p
                                                className={`mt-1 break-words text-lg font-semibold ${income - forecast >= 0
                                                    ? "text-emerald-400"
                                                    : "text-red-400"
                                                    }`}
                                            >
                                                ₹
                                                {(income - forecast).toLocaleString(
                                                    "en-IN",
                                                    {
                                                        maximumFractionDigits: 0,
                                                    }
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {/* BUDGET */}

                                    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <h3 className="font-semibold">
                                                    Budget forecast
                                                </h3>

                                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                                    Projected spending vs monthly budget
                                                </p>
                                            </div>

                                            <Target
                                                size={20}
                                                className="shrink-0 text-indigo-400"
                                            />
                                        </div>

                                        {totalBudget > 0 ? (
                                            <>
                                                <div className="mt-7 grid grid-cols-1 gap-5 min-[400px]:grid-cols-2">
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-slate-500">
                                                            Total budget
                                                        </p>

                                                        <p className="mt-1 break-words text-2xl font-bold">
                                                            ₹
                                                            {totalBudget.toLocaleString(
                                                                "en-IN",
                                                                {
                                                                    minimumFractionDigits: 2,
                                                                }
                                                            )}
                                                        </p>
                                                    </div>

                                                    <div className="min-w-0 min-[400px]:text-right">
                                                        <p className="text-xs text-slate-500">
                                                            Forecast
                                                        </p>

                                                        <p
                                                            className={`mt-1 break-words text-lg font-semibold ${forecast > totalBudget
                                                                ? "text-red-400"
                                                                : "text-emerald-400"
                                                                }`}
                                                        >
                                                            ₹
                                                            {forecast.toLocaleString("en-IN", {
                                                                maximumFractionDigits: 0,
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/5">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${forecast > totalBudget
                                                            ? "bg-red-500"
                                                            : projectedBudgetUsage >= 80
                                                                ? "bg-amber-500"
                                                                : "bg-indigo-500"
                                                            }`}
                                                        style={{
                                                            width: `${Math.min(
                                                                Math.max(projectedBudgetUsage, 0),
                                                                100
                                                            )}%`,
                                                        }}
                                                    />
                                                </div>

                                                <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs">
                                                    <span className="text-slate-500">
                                                        Current: {currentBudgetUsage.toFixed(0)}%
                                                    </span>

                                                    <span className="text-slate-500">
                                                        Forecast: {projectedBudgetUsage.toFixed(0)}%
                                                    </span>
                                                </div>

                                                <div className="mt-5 rounded-xl bg-white/[0.03] p-4">
                                                    <p className="text-xs text-slate-500">
                                                        Forecast result
                                                    </p>

                                                    <p
                                                        className={`mt-1 break-words font-medium ${budgetDifference < 0
                                                            ? "text-red-400"
                                                            : "text-emerald-400"
                                                            }`}
                                                    >
                                                        {budgetDifference < 0
                                                            ? `₹${Math.abs(
                                                                budgetDifference
                                                            ).toFixed(0)} over budget`
                                                            : `₹${budgetDifference.toFixed(
                                                                0
                                                            )} budget remaining`}
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="mt-7 rounded-xl border border-dashed border-white/10 p-6 text-center">
                                                <Target
                                                    size={25}
                                                    className="mx-auto text-slate-600"
                                                />

                                                <p className="mt-3 text-sm text-slate-400">
                                                    No budget created for this month.
                                                </p>

                                                <Link
                                                    href="/budgets"
                                                    className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-indigo-500 px-4 py-2 text-xs font-medium transition hover:bg-indigo-400"
                                                >
                                                    Create Budget
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* =====================================================
                    CATEGORY SPENDING
                ===================================================== */}

                                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:mt-6 sm:p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <h3 className="font-semibold">
                                                Spending by Category
                                            </h3>

                                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                                Where your money is going this month
                                            </p>
                                        </div>

                                        <BarChart3
                                            size={20}
                                            className="shrink-0 text-indigo-400"
                                        />
                                    </div>

                                    {categorySpending.length === 0 ? (
                                        <div className="py-12 text-center">
                                            <p className="text-sm text-slate-500">
                                                No expenses recorded this month.
                                            </p>
                                        </div>
                                    ) : (
                                        <div
                                            className={`mt-6 min-h-0 space-y-5 ${categorySpending.length > 6
                                                ? "max-h-[45vh] overflow-y-auto overscroll-contain pr-2 [scrollbar-color:rgb(71_85_105)_transparent] [scrollbar-width:thin] sm:max-h-[50vh] lg:max-h-[360px]"
                                                : ""
                                                }`}
                                        >
                                            {categorySpending.map((item) => {
                                                const percentage =
                                                    expenses > 0
                                                        ? (item.amount / expenses) * 100
                                                        : 0;

                                                return (
                                                    <div
                                                        key={item.category}
                                                        className="min-w-0"
                                                    >
                                                        <div className="mb-2 flex flex-col gap-2 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between">
                                                            <div className="flex min-w-0 items-center gap-3">
                                                                <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-400" />

                                                                <span className="min-w-0 break-words text-sm text-slate-300">
                                                                    {item.category}
                                                                </span>
                                                            </div>

                                                            <div className="shrink-0 text-left min-[480px]:text-right">
                                                                <span className="text-sm font-medium">
                                                                    ₹
                                                                    {item.amount.toLocaleString(
                                                                        "en-IN",
                                                                        {
                                                                            minimumFractionDigits: 2,
                                                                        }
                                                                    )}
                                                                </span>

                                                                <span className="ml-2 text-xs text-slate-600">
                                                                    {percentage.toFixed(0)}%
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="h-2 overflow-hidden rounded-full bg-white/5">
                                                            <div
                                                                className="h-full rounded-full bg-indigo-500 transition-all"
                                                                style={{
                                                                    width: `${Math.min(
                                                                        Math.max(percentage, 0),
                                                                        100
                                                                    )}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* =====================================================
                    EXPLANATION
                ===================================================== */}

                                <div className="mt-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 sm:mt-6 sm:p-5">
                                    <div className="flex items-start gap-3 sm:gap-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
                                            <Sparkles
                                                size={19}
                                                className="text-indigo-400"
                                            />
                                        </div>

                                        <div className="min-w-0">
                                            <h3 className="font-semibold">
                                                How Forecast V2 works
                                            </h3>

                                            <p className="mt-2 text-sm leading-6 text-slate-400">
                                                FinPilot considers your current-month spending
                                                pace and, when available, your previous month's
                                                spending. The forecast is blended from these
                                                signals instead of relying only on the first
                                                few days of the current month.
                                            </p>

                                            <p className="mt-2 text-xs leading-5 text-slate-500">
                                                Forecast confidence increases as more
                                                current-month transactions are recorded.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}

/* =========================================================
   NAV ITEM
========================================================= */

function NavItem({
    href,
    icon,
    label,
    active = false,
    badge,
    onClick,
}: {
    href: string;
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    badge?: string;
    onClick?: () => void;
}) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active
                ? "bg-indigo-500/10 text-indigo-300"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
        >
            {icon}

            <span className="min-w-0 flex-1 truncate">{label}</span>

            {badge && (
                <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-slate-600">
                    {badge}
                </span>
            )}
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

            <p className="mt-5 break-words text-2xl font-bold">
                {value}
            </p>

            <p className="mt-1 break-words text-xs text-slate-500">
                {subtitle}
            </p>
        </div>
    );
}

/* =========================================================
   MINI STAT
========================================================= */

function MiniStat({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="min-w-0 rounded-xl bg-white/[0.03] p-4">
            <p className="text-xs text-slate-500">{label}</p>

            <p className="mt-1 break-words font-semibold text-white">
                {value}
            </p>
        </div>
    );
}