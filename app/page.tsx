"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CalendarDays,
  ChevronRight,
  CreditCard,
  DollarSign,
  Goal,
  LayoutDashboard,
  Menu,
  Plus,
  Receipt,
  Settings,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import LandingPage from "@/app/components/LandingPage";

type User = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
  };
};

type Transaction = {
  id: string;
  description: string;
  category: string;
  amount: number;
  type: "income" | "expense";
  transaction_date: string;
};

type Goal = {
  id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  target_date: string | null;
};

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Transactions",
    href: "/transactions",
    icon: Receipt,
  },
  {
    name: "Budgets",
    href: "/budgets",
    icon: Target,
  },
  {
    name: "Goals",
    href: "/goals",
    icon: Goal,
  },
  {
    name: "Forecast",
    href: "/forecast",
    icon: TrendingUp,
  },
  {
    name: "AI Coach",
    href: "/ai-coach",
    icon: Bot,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return "Good morning";
  }

  if (hour >= 12 && hour < 17) {
    return "Good afternoon";
  }

  if (hour >= 17 && hour < 21) {
    return "Good evening";
  }

  return "Good night";
}

function getCategoryIcon(category: string) {
  const normalized = category.toLowerCase();

  if (normalized.includes("food")) {
    return "🍔";
  }

  if (
    normalized.includes("transport") ||
    normalized.includes("travel") ||
    normalized.includes("petrol")
  ) {
    return "🚗";
  }

  if (normalized.includes("shopping")) {
    return "🛍️";
  }

  if (
    normalized.includes("bill") ||
    normalized.includes("utility")
  ) {
    return "💡";
  }

  if (normalized.includes("health")) {
    return "❤️";
  }

  if (normalized.includes("education")) {
    return "📚";
  }

  if (normalized.includes("entertainment")) {
    return "🎬";
  }

  if (
    normalized.includes("salary") ||
    normalized.includes("income")
  ) {
    return "💰";
  }

  return "💳";
}

function Sidebar({
  mobile = false,
  onClose,
}: {
  mobile?: boolean;
  onClose?: () => void;
}) {
  return (
    <aside
      className={
        mobile
          ? "fixed inset-y-0 left-0 z-50 flex w-[min(18rem,calc(100vw-1rem))] md:hidden"
          : "hidden md:flex md:w-64 md:shrink-0 md:flex-col"
      }
    >
      <div className="flex h-full min-h-0 flex-col border-r border-white/10 bg-slate-950">
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-5 sm:px-6">
          <Link
            href="/"
            onClick={onClose}
            className="flex min-w-0 items-center gap-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
              <Wallet size={20} />
            </div>

            <div className="min-w-0">
              <h1 className="text-lg font-bold text-white">
                FinPilot
              </h1>

              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                Personal Finance
              </p>
            </div>
          </Link>

          {mobile && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation menu"
              className="ml-2 shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = item.href === "/";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${active
                    ? "bg-indigo-500/15 text-indigo-400"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="shrink-0 border-t border-white/10 p-4">
          <Link
            href="/ai-coach"
            onClick={onClose}
            className="block rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4 transition hover:bg-indigo-500/15"
          >
            <div className="mb-2 flex items-center gap-2">
              <Bot
                size={17}
                className="shrink-0 text-indigo-400"
              />

              <span className="text-sm font-semibold text-white">
                AI Financial Coach
              </span>
            </div>

            <p className="text-xs leading-5 text-slate-400">
              Get personalized insights about your spending and
              budget.
            </p>

            <div className="mt-3 flex items-center gap-1 text-xs font-medium text-indigo-400">
              Open AI Coach
              <ArrowRight size={13} />
            </div>
          </Link>
        </div>
      </div>
    </aside>
  );
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>(
    []
  );
  const [goals, setGoals] = useState<Goal[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setUser(session?.user ? (session.user as User) : null);
        setLoading(false);
      } catch (error) {
        console.error("Session check failed:", error);

        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      setUser(session?.user ? (session.user as User) : null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setGoals([]);
      return;
    }

    const loadDashboardData = async () => {
      setDataLoading(true);

      try {
        const [transactionsResult, goalsResult] =
          await Promise.all([
            supabase
              .from("transactions")
              .select(
                "id, description, category, amount, type, transaction_date"
              )
              .eq("user_id", user.id)
              .order("transaction_date", { ascending: false })
              .order("created_at", { ascending: false })
              .limit(100),

            supabase
              .from("goals")
              .select(
                "id, name, target_amount, saved_amount, target_date"
              )
              .eq("user_id", user.id)
              .order("created_at", { ascending: false }),
          ]);

        if (transactionsResult.error) {
          console.error(
            "Failed to load transactions:",
            transactionsResult.error
          );
        } else {
          setTransactions(
            (transactionsResult.data || []) as Transaction[]
          );
        }

        if (goalsResult.error) {
          console.error(
            "Failed to load goals:",
            goalsResult.error
          );
          setGoals([]);
        } else {
          setGoals((goalsResult.data || []) as Goal[]);
        }
      } catch (error) {
        console.error(
          "Dashboard data loading failed:",
          error
        );
      } finally {
        setDataLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  const financialSummary = useMemo(() => {
    const income = transactions
      .filter((transaction) => transaction.type === "income")
      .reduce(
        (sum, transaction) => sum + Number(transaction.amount),
        0
      );

    const expenses = transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce(
        (sum, transaction) => sum + Number(transaction.amount),
        0
      );

    return {
      income,
      expenses,
      balance: income - expenses,
    };
  }, [transactions]);

  const currentMonthSummary = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const currentMonthTransactions = transactions.filter(
      (transaction) => {
        const date = new Date(transaction.transaction_date);

        return (
          date.getFullYear() === currentYear &&
          date.getMonth() === currentMonth
        );
      }
    );

    const income = currentMonthTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce(
        (sum, transaction) => sum + Number(transaction.amount),
        0
      );

    const expenses = currentMonthTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce(
        (sum, transaction) => sum + Number(transaction.amount),
        0
      );

    return {
      income,
      expenses,
      balance: income - expenses,
    };
  }, [transactions]);

  const primaryGoal = goals[0] || null;

  const goalProgress = primaryGoal
    ? Math.min(
      100,
      Math.max(
        0,
        (Number(primaryGoal.saved_amount) /
          Number(primaryGoal.target_amount)) *
        100
      )
    )
    : 0;

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "there";

  const greeting = getGreeting();

  const expensePercentage =
    currentMonthSummary.income > 0
      ? (currentMonthSummary.expenses /
        currentMonthSummary.income) *
      100
      : 0;

  const recentTransactions = transactions.slice(0, 5);

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};

    transactions
      .filter((transaction) => transaction.type === "expense")
      .forEach((transaction) => {
        const category = transaction.category || "Other";

        totals[category] =
          (totals[category] || 0) +
          Number(transaction.amount);
      });

    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [transactions]);

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center overflow-hidden bg-slate-950 px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15">
            <Wallet
              className="animate-pulse text-indigo-400"
              size={24}
            />
          </div>

          <p className="text-sm text-slate-400">
            Loading FinPilot...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-slate-950 text-white">
      <div className="flex min-h-[100dvh]">
        <Sidebar />

        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] md:hidden"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />

            <Sidebar
              mobile
              onClose={() => setMobileMenuOpen(false)}
            />
          </>
        )}

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/90 backdrop-blur">
            <div className="flex min-h-16 items-center justify-between px-4 py-3 sm:min-h-20 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="Open navigation menu"
                  aria-expanded={mobileMenuOpen}
                  aria-controls="mobile-navigation"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/5 hover:text-white md:hidden"
                >
                  <Menu size={22} />
                </button>

                <div className="min-w-0 md:hidden">
                  <p className="truncate font-semibold text-white">
                    FinPilot
                  </p>

                  <p className="text-[10px] text-slate-500">
                    Personal Finance
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-sm font-semibold text-indigo-400">
                  {displayName.charAt(0).toUpperCase()}
                </div>

                <div className="hidden max-w-[220px] text-right lg:block">
                  <p className="truncate text-sm font-medium text-white">
                    {displayName}
                  </p>

                  <p className="truncate text-xs text-slate-500">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-7xl px-4 pb-8 pt-6 sm:px-6 sm:pb-10 sm:pt-8 lg:px-8">
            <section className="mb-7 sm:mb-8">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div className="min-w-0">
                  <p className="mb-2 text-sm font-medium text-indigo-400">
                    Your financial dashboard
                  </p>

                  <h2 className="break-words text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    {greeting}, {displayName} 👋
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                    Here's what your finances look like right
                    now.
                  </p>
                </div>

                <Link
                  href="/transactions"
                  className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 sm:w-fit"
                >
                  <Plus size={17} />
                  Add transaction
                </Link>
              </div>
            </section>

            <section className="mb-7 grid gap-4 sm:mb-8 sm:grid-cols-2 xl:grid-cols-4">
              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Wallet size={20} />
                  </div>

                  <span className="text-xs text-slate-500">
                    Current
                  </span>
                </div>

                <p className="text-sm text-slate-400">
                  Balance
                </p>

                <p className="mt-1 break-words text-2xl font-bold text-white">
                  {formatCurrency(financialSummary.balance)}
                </p>
              </div>

              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <TrendingUp size={20} />
                  </div>

                  <span className="text-xs text-slate-500">
                    This month
                  </span>
                </div>

                <p className="text-sm text-slate-400">
                  Income
                </p>

                <p className="mt-1 break-words text-2xl font-bold text-white">
                  {formatCurrency(currentMonthSummary.income)}
                </p>
              </div>

              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
                    <TrendingDown size={20} />
                  </div>

                  <span className="text-xs text-slate-500">
                    This month
                  </span>
                </div>

                <p className="text-sm text-slate-400">
                  Expenses
                </p>

                <p className="mt-1 break-words text-2xl font-bold text-white">
                  {formatCurrency(
                    currentMonthSummary.expenses
                  )}
                </p>
              </div>

              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                    <BarChart3 size={20} />
                  </div>

                  <span className="text-xs text-slate-500">
                    Expense ratio
                  </span>
                </div>

                <p className="text-sm text-slate-400">
                  Income spent
                </p>

                <p className="mt-1 text-2xl font-bold text-white">
                  {expensePercentage.toFixed(1)}%
                </p>
              </div>
            </section>

            <section className="mb-7 grid gap-5 sm:mb-8 lg:grid-cols-3 lg:gap-6">
              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 lg:col-span-2">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white">
                      Spending overview
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Your expense categories
                    </p>
                  </div>

                  <Link
                    href="/transactions"
                    className="shrink-0 text-xs font-medium text-indigo-400 hover:text-indigo-300"
                  >
                    View all
                  </Link>
                </div>

                {categoryTotals.length === 0 ? (
                  <div className="flex min-h-40 items-center justify-center text-center">
                    <div className="max-w-sm">
                      <CreditCard
                        className="mx-auto mb-3 text-slate-600"
                        size={28}
                      />

                      <p className="text-sm text-slate-400">
                        No expenses recorded yet.
                      </p>

                      <Link
                        href="/transactions"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-400"
                      >
                        Add your first transaction
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {categoryTotals.map(
                      ([category, amount]) => {
                        const percentage =
                          financialSummary.expenses > 0
                            ? (amount /
                              financialSummary.expenses) *
                            100
                            : 0;

                        return (
                          <div
                            key={category}
                            className="min-w-0"
                          >
                            <div className="mb-2 flex items-center justify-between gap-4">
                              <div className="flex min-w-0 items-center gap-3">
                                <span className="shrink-0 text-lg">
                                  {getCategoryIcon(category)}
                                </span>

                                <span className="min-w-0 break-words text-sm text-slate-300">
                                  {category}
                                </span>
                              </div>

                              <span className="shrink-0 text-sm font-medium text-white">
                                {formatCurrency(amount)}
                              </span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-white/5">
                              <div
                                className="h-full rounded-full bg-indigo-500 transition-all"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    percentage
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>

              <div className="min-w-0 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.07] p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15">
                    <Bot
                      size={20}
                      className="text-indigo-400"
                    />
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-semibold text-white">
                      FinPilot AI
                    </h3>

                    <p className="text-xs text-slate-500">
                      Your financial coach
                    </p>
                  </div>
                </div>

                <p className="text-sm leading-6 text-slate-300">
                  Ask me about your spending, budget, savings,
                  affordability, or financial forecast.
                </p>

                <Link
                  href="/ai-coach"
                  className="mt-5 flex min-h-11 items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  <span>Open AI Coach</span>
                  <ArrowRight
                    size={16}
                    className="shrink-0"
                  />
                </Link>
              </div>
            </section>

            <section className="mb-7 grid gap-5 sm:mb-8 lg:grid-cols-2 lg:gap-6">
              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white">
                      Savings goal
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Track your progress
                    </p>
                  </div>

                  <Link
                    href="/goals"
                    className="shrink-0 text-xs font-medium text-indigo-400 hover:text-indigo-300"
                  >
                    Manage goals
                  </Link>
                </div>

                {primaryGoal ? (
                  <>
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="break-words text-lg font-semibold text-white">
                          {primaryGoal.name}
                        </p>

                        {primaryGoal.target_date && (
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                            <CalendarDays
                              size={13}
                              className="shrink-0"
                            />

                            <span>
                              Target:{" "}
                              {formatDate(
                                primaryGoal.target_date
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      <span className="shrink-0 text-lg font-bold text-indigo-400">
                        {goalProgress.toFixed(0)}%
                      </span>
                    </div>

                    <div className="mb-3 h-3 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all"
                        style={{
                          width: `${goalProgress}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-start justify-between gap-4 text-xs">
                      <span className="min-w-0 text-slate-400">
                        Saved{" "}
                        <span className="font-medium text-white">
                          {formatCurrency(
                            Number(primaryGoal.saved_amount)
                          )}
                        </span>
                      </span>

                      <span className="shrink-0 text-right text-slate-500">
                        of{" "}
                        {formatCurrency(
                          Number(primaryGoal.target_amount)
                        )}
                      </span>
                    </div>

                    <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                      <p className="text-xs text-slate-500">
                        Remaining
                      </p>

                      <p className="mt-1 break-words font-semibold text-white">
                        {formatCurrency(
                          Math.max(
                            0,
                            Number(
                              primaryGoal.target_amount
                            ) -
                            Number(
                              primaryGoal.saved_amount
                            )
                          )
                        )}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex min-h-40 items-center justify-center text-center">
                    <div className="max-w-sm">
                      <Goal
                        className="mx-auto mb-3 text-slate-600"
                        size={28}
                      />

                      <p className="text-sm text-slate-400">
                        You haven't created a savings goal
                        yet.
                      </p>

                      <Link
                        href="/goals"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-400"
                      >
                        Create a goal
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white">
                      Recent transactions
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Your latest activity
                    </p>
                  </div>

                  <Link
                    href="/transactions"
                    className="flex shrink-0 items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300"
                  >
                    View all
                    <ChevronRight size={14} />
                  </Link>
                </div>

                {dataLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((item) => (
                      <div
                        key={item}
                        className="h-12 animate-pulse rounded-xl bg-white/5"
                      />
                    ))}
                  </div>
                ) : recentTransactions.length === 0 ? (
                  <div className="flex min-h-40 items-center justify-center text-center">
                    <div className="max-w-sm">
                      <Receipt
                        className="mx-auto mb-3 text-slate-600"
                        size={28}
                      />

                      <p className="text-sm text-slate-400">
                        No transactions yet.
                      </p>

                      <Link
                        href="/transactions"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-400"
                      >
                        Add transaction
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {recentTransactions.map((transaction) => {
                      const isIncome =
                        transaction.type === "income";

                      return (
                        <div
                          key={transaction.id}
                          className="flex min-w-0 items-center justify-between gap-3 rounded-xl px-1 py-3 transition hover:bg-white/[0.03] sm:gap-4 sm:px-2"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-lg">
                              {getCategoryIcon(
                                transaction.category
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-white">
                                {transaction.description}
                              </p>

                              <div className="mt-0.5 flex min-w-0 items-center gap-2">
                                <span className="max-w-[100px] truncate text-xs text-slate-500 sm:max-w-[140px]">
                                  {transaction.category}
                                </span>

                                <span className="shrink-0 text-slate-700">
                                  •
                                </span>

                                <span className="shrink-0 text-xs text-slate-500">
                                  {formatDate(
                                    transaction.transaction_date
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          <p
                            className={`shrink-0 text-right text-sm font-semibold ${isIncome
                              ? "text-emerald-400"
                              : "text-white"
                              }`}
                          >
                            {isIncome ? "+" : "-"}
                            {formatCurrency(
                              Number(transaction.amount)
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                    <DollarSign size={21} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="break-words font-semibold text-white">
                      Need help deciding on a purchase?
                    </h3>

                    <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
                      Ask FinPilot AI whether you can afford
                      something based on your current balance,
                      spending and budget.
                    </p>
                  </div>
                </div>

                <Link
                  href="/ai-coach"
                  className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 md:w-fit"
                >
                  Ask FinPilot
                  <ArrowRight size={16} />
                </Link>
              </div>
            </section>

            <footer className="mt-8 border-t border-white/10 pt-6 text-center">
              <p className="text-xs text-slate-600">
                FinPilot • Personal finance, made simple.
              </p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}