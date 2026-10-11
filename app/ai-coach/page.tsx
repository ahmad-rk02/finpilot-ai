"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/lib/supabase";
import AuthGuard from "@/app/components/AuthGuard";
import {
    ArrowUp,
    Bot,
    CheckCircle2,
    ChevronRight,
    Loader2,
    MessageCircle,
    RefreshCw,
    Sparkles,
    Trash2,
    User,
    WalletCards,
} from "lucide-react";

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

type Goal = {
    id: string;
    name: string;
    target_amount: number;
    saved_amount: number;
    target_date: string | null;
};

type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
    provider?: string;
    created_at?: string;
};

type FinancialContext = {
    month: string;
    income: number;
    expenses: number;
    balance: number;
    totalBudget: number;
    budgetUsed: number;
    budgetRemaining: number;
    budgetUsagePercent: number;
    daysElapsed: number;
    daysRemaining: number;
    daysInMonth: number;
    dailyAverage: number;
    projectedExpenses: number;
    forecastConfidence: "Low" | "Medium" | "High";
    previousMonthExpenses: number;
    categorySpending: Record<string, number>;
    recentTransactions: {
        type: string;
        amount: number;
        description: string;
        category: string;
        date: string;
    }[];
    goals: {
        name: string;
        target: number;
        saved: number;
        remaining: number;
        progress: number;
        targetDate: string | null;
    }[];
};

const quickQuestions = [
    "Give me an overview of my finances",
    "Where am I spending the most?",
    "Am I on track with my budget?",
    "How are my savings goals doing?",
    "How much am I likely to spend this month?",
    "Can I afford an ₹800 purchase?",
];

function formatMoney(amount: number) {
    return `₹${amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function normalizeMarkdown(content: string) {
    return content
        .replace(/\\\|/g, "|")
        .replace(/\\\*/g, "*")
        .replace(/\\_/g, "_")
        .replace(/\\#/g, "#")
        .replace(/\\-/g, "-");
}

function getMonthInfo(date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth();

    const daysInMonth = new Date(
        year,
        month + 1,
        0
    ).getDate();

    const daysElapsed = date.getDate();

    const daysRemaining = Math.max(
        daysInMonth - daysElapsed,
        0
    );

    return {
        year,
        month,
        daysInMonth,
        daysElapsed,
        daysRemaining,
        monthStart: `${year}-${String(month + 1).padStart(
            2,
            "0"
        )}-01`,
    };
}

function getPreviousMonthStart(date = new Date()) {
    const previous = new Date(
        date.getFullYear(),
        date.getMonth() - 1,
        1
    );

    return `${previous.getFullYear()}-${String(
        previous.getMonth() + 1
    ).padStart(2, "0")}-01`;
}

function getNextMonthStart(date = new Date()) {
    const next = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        1
    );

    return `${next.getFullYear()}-${String(
        next.getMonth() + 1
    ).padStart(2, "0")}-01`;
}

function getCategorySpending(
    transactions: Transaction[]
) {
    const spending: Record<string, number> = {};

    transactions
        .filter(
            (transaction) =>
                transaction.type === "expense"
        )
        .forEach((transaction) => {
            const category =
                transaction.category || "Other";

            spending[category] =
                (spending[category] || 0) +
                Number(transaction.amount);
        });

    return spending;
}

function calculateForecast(
    currentExpenses: number,
    previousMonthExpenses: number,
    daysElapsed: number,
    daysInMonth: number
) {
    const dailyAverage =
        daysElapsed > 0
            ? currentExpenses / daysElapsed
            : 0;

    const currentPaceProjection =
        dailyAverage * daysInMonth;

    let projectedExpenses =
        currentPaceProjection;

    if (previousMonthExpenses > 0) {
        projectedExpenses =
            currentPaceProjection * 0.6 +
            previousMonthExpenses * 0.4;
    }

    let confidence:
        | "Low"
        | "Medium"
        | "High" = "Low";

    if (daysElapsed > 10) {
        confidence = "High";
    } else if (daysElapsed > 3) {
        confidence = "Medium";
    }

    return {
        dailyAverage,
        projectedExpenses,
        confidence,
    };
}

function getProviderLabel(provider?: string) {
    if (
        provider === "Gemini" ||
        provider === "gemini"
    ) {
        return "Gemini";
    }

    if (
        provider === "OpenRouter" ||
        provider === "openrouter"
    ) {
        return "OpenRouter backup";
    }

    if (
        provider === "FinPilot" ||
        provider === "finpilot" ||
        provider === "finpilot-fallback"
    ) {
        return "FinPilot fallback";
    }

    return null;
}

export default function AICoachPage() {
    return (
        <AuthGuard>
            <AICoachContent />
        </AuthGuard>
    );
}

function AICoachContent() {
    const [messages, setMessages] = useState<
        ChatMessage[]
    >([]);

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const [financialContext, setFinancialContext] =
        useState<FinancialContext | null>(null);

    const [error, setError] = useState("");

    const [userId, setUserId] = useState<
        string | null
    >(null);

    const messagesEndRef =
        useRef<HTMLDivElement>(null);

    useEffect(() => {
        initializePage();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
    }, [messages, sending]);

    async function initializePage() {
        setLoading(true);
        setError("");

        try {
            const {
                data: { session },
                error: sessionError,
            } = await supabase.auth.getSession();

            if (sessionError) {
                throw sessionError;
            }

            if (!session?.user) {
                return;
            }

            const currentUserId = session.user.id;

            setUserId(currentUserId);

            const context =
                await loadFinancialData(
                    currentUserId
                );

            if (context) {
                await loadChatHistory(
                    currentUserId,
                    context
                );
            }
        } catch (err) {
            console.error(
                "AI Coach initialization error:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to initialize AI Coach."
            );
        } finally {
            setLoading(false);
        }
    }

    async function loadChatHistory(
        currentUserId: string,
        context?: FinancialContext
    ) {
        const {
            data,
            error: historyError,
        } = await supabase
            .from("ai_chat_messages")
            .select(
                "id, role, content, provider, created_at"
            )
            .eq("user_id", currentUserId)
            .order("created_at", {
                ascending: true,
            });

        if (historyError) {
            console.error(
                "Chat history load error:",
                historyError
            );

            setError(
                `Chat history could not be loaded: ${historyError.message}`
            );

            return;
        }

        if (data && data.length > 0) {
            setMessages(
                data.map((message) => ({
                    id: message.id,
                    role: message.role as
                        | "user"
                        | "assistant",
                    content: message.content,
                    provider:
                        message.provider || undefined,
                    created_at: message.created_at,
                }))
            );

            return;
        }

        if (context) {
            const greeting = createGreeting(context);

            setMessages([greeting]);

            await saveChatMessage(
                currentUserId,
                greeting
            );
        }
    }

    function createGreeting(
        context: FinancialContext
    ): ChatMessage {
        return {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Hi! I'm your FinPilot AI Coach. 👋

I can analyze your actual transactions, budgets, savings goals, and spending forecast.

For ${context.month}, you've recorded ${formatMoney(
                context.income
            )} income and ${formatMoney(
                context.expenses
            )} in expenses.

Your current balance is ${formatMoney(
                context.balance
            )}.

What would you like to know?`,
            provider: "FinPilot",
        };
    }

    async function saveChatMessage(
        currentUserId: string,
        message: ChatMessage
    ): Promise<boolean> {
        const {
            error: insertError,
        } = await supabase
            .from("ai_chat_messages")
            .insert({
                id: message.id,
                user_id: currentUserId,
                role: message.role,
                content: message.content,
                provider: message.provider || null,
            });

        if (insertError) {
            console.error(
                "Chat message INSERT error:",
                insertError
            );

            setError(
                `Chat could not be saved: ${insertError.message}`
            );

            return false;
        }

        return true;
    }

    async function loadFinancialData(
        currentUserId?: string
    ): Promise<FinancialContext | null> {
        setError("");

        try {
            let activeUserId = currentUserId;

            if (!activeUserId) {
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (!session?.user) {
                    return null;
                }

                activeUserId = session.user.id;
                setUserId(activeUserId);
            }

            const today = new Date();

            const monthInfo =
                getMonthInfo(today);

            const previousMonthStart =
                getPreviousMonthStart(today);

            const nextMonthStart =
                getNextMonthStart(today);

            const [
                currentTransactionsResult,
                previousTransactionsResult,
                budgetsResult,
                goalsResult,
            ] = await Promise.all([
                supabase
                    .from("transactions")
                    .select(
                        "id, type, amount, description, category, transaction_date"
                    )
                    .eq("user_id", activeUserId)
                    .gte(
                        "transaction_date",
                        monthInfo.monthStart
                    )
                    .lt(
                        "transaction_date",
                        nextMonthStart
                    )
                    .order("transaction_date", {
                        ascending: false,
                    }),

                supabase
                    .from("transactions")
                    .select(
                        "id, type, amount, description, category, transaction_date"
                    )
                    .eq("user_id", activeUserId)
                    .gte(
                        "transaction_date",
                        previousMonthStart
                    )
                    .lt(
                        "transaction_date",
                        monthInfo.monthStart
                    ),

                supabase
                    .from("budgets")
                    .select(
                        "id, category, amount"
                    )
                    .eq("user_id", activeUserId)
                    .eq(
                        "month",
                        monthInfo.monthStart
                    ),

                supabase
                    .from("goals")
                    .select(
                        "id, name, target_amount, saved_amount, target_date"
                    )
                    .eq("user_id", activeUserId)
                    .order("created_at", {
                        ascending: false,
                    }),
            ]);

            if (currentTransactionsResult.error) {
                throw currentTransactionsResult.error;
            }

            if (previousTransactionsResult.error) {
                throw previousTransactionsResult.error;
            }

            if (budgetsResult.error) {
                throw budgetsResult.error;
            }

            if (goalsResult.error) {
                throw goalsResult.error;
            }

            const currentTransactions =
                (currentTransactionsResult.data ||
                    []) as Transaction[];

            const previousTransactions =
                (previousTransactionsResult.data ||
                    []) as Transaction[];

            const budgets =
                (budgetsResult.data ||
                    []) as Budget[];

            const goals =
                (goalsResult.data ||
                    []) as Goal[];

            const income =
                currentTransactions
                    .filter(
                        (transaction) =>
                            transaction.type === "income"
                    )
                    .reduce(
                        (sum, transaction) =>
                            sum +
                            Number(transaction.amount),
                        0
                    );

            const expenses =
                currentTransactions
                    .filter(
                        (transaction) =>
                            transaction.type === "expense"
                    )
                    .reduce(
                        (sum, transaction) =>
                            sum +
                            Number(transaction.amount),
                        0
                    );

            const balance =
                income - expenses;

            const totalBudget =
                budgets.reduce(
                    (sum, budget) =>
                        sum + Number(budget.amount),
                    0
                );

            const budgetUsed = expenses;

            const budgetRemaining =
                totalBudget - budgetUsed;

            const budgetUsagePercent =
                totalBudget > 0
                    ? (budgetUsed / totalBudget) * 100
                    : 0;

            const previousMonthExpenses =
                previousTransactions
                    .filter(
                        (transaction) =>
                            transaction.type === "expense"
                    )
                    .reduce(
                        (sum, transaction) =>
                            sum +
                            Number(transaction.amount),
                        0
                    );

            const forecast =
                calculateForecast(
                    expenses,
                    previousMonthExpenses,
                    monthInfo.daysElapsed,
                    monthInfo.daysInMonth
                );

            const categorySpending =
                getCategorySpending(
                    currentTransactions
                );

            const formattedGoals =
                goals.map((goal) => {
                    const target =
                        Number(goal.target_amount);

                    const saved =
                        Number(goal.saved_amount);

                    const remaining = Math.max(
                        target - saved,
                        0
                    );

                    const progress =
                        target > 0
                            ? Math.min(
                                (saved / target) * 100,
                                100
                            )
                            : 0;

                    return {
                        name: goal.name,
                        target,
                        saved,
                        remaining,
                        progress,
                        targetDate:
                            goal.target_date,
                    };
                });

            const context: FinancialContext = {
                month:
                    today.toLocaleString(
                        "en-IN",
                        {
                            month: "long",
                            year: "numeric",
                        }
                    ),

                income,
                expenses,
                balance,
                totalBudget,
                budgetUsed,
                budgetRemaining,
                budgetUsagePercent,

                daysElapsed:
                    monthInfo.daysElapsed,

                daysRemaining:
                    monthInfo.daysRemaining,

                daysInMonth:
                    monthInfo.daysInMonth,

                dailyAverage:
                    forecast.dailyAverage,

                projectedExpenses:
                    forecast.projectedExpenses,

                forecastConfidence:
                    forecast.confidence,

                previousMonthExpenses,

                categorySpending,

                recentTransactions:
                    currentTransactions
                        .slice(0, 10)
                        .map((transaction) => ({
                            type: transaction.type,
                            amount: Number(
                                transaction.amount
                            ),
                            description:
                                transaction.description,
                            category:
                                transaction.category,
                            date:
                                transaction.transaction_date,
                        })),

                goals: formattedGoals,
            };

            setFinancialContext(context);

            setMessages((currentMessages) => {
                if (currentMessages.length > 0) {
                    return currentMessages;
                }

                return [
                    createGreeting(context),
                ];
            });

            return context;
        } catch (err) {
            console.error(
                "AI Coach data loading error:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load your financial data."
            );

            return null;
        }
    }

    async function sendMessage(
        customQuestion?: string
    ) {
        const question = (
            customQuestion ?? input
        ).trim();

        if (
            !question ||
            sending ||
            !financialContext ||
            !userId
        ) {
            return;
        }

        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: question,
        };

        const previousMessages =
            messages;

        setMessages((current) => [
            ...current,
            userMessage,
        ]);

        setInput("");
        setSending(true);
        setError("");

        try {
            const savedUserMessage =
                await saveChatMessage(
                    userId,
                    userMessage
                );

            if (!savedUserMessage) {
                throw new Error(
                    "Your message could not be saved to Supabase."
                );
            }

            /* =================================================
               GET CURRENT SUPABASE SESSION
            ================================================= */

            const {
                data: { session },
                error: sessionError,
            } = await supabase.auth.getSession();

            if (sessionError) {
                throw sessionError;
            }

            if (!session?.access_token) {
                throw new Error(
                    "Your session has expired. Please sign in again."
                );
            }

            const history =
                previousMessages
                    .filter(
                        (message) =>
                            message.role === "user" ||
                            message.role ===
                            "assistant"
                    )
                    .slice(-10)
                    .map((message) => ({
                        role: message.role,
                        content: message.content,
                    }));

            /* =================================================
               CALL AI COACH API WITH AUTHORIZATION TOKEN
            ================================================= */

            const response =
                await fetch(
                    "/api/ai-coach",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${session.access_token}`,
                        },
                        body: JSON.stringify({
                            question,
                            context:
                                financialContext,
                            history,
                        }),
                    }
                );

            const responseText =
                await response.text();

            let data: any = null;

            try {
                data = responseText
                    ? JSON.parse(responseText)
                    : null;
            } catch {
                data = null;
            }

            if (!response.ok) {
                throw new Error(
                    data?.error ||
                    "Unable to get an AI response."
                );
            }

            const assistantMessage:
                ChatMessage = {
                id: crypto.randomUUID(),
                role: "assistant",
                content:
                    data?.answer ||
                    "I couldn't generate a response. Please try again.",
                provider:
                    data?.provider,
            };

            setMessages((current) => [
                ...current,
                assistantMessage,
            ]);

            const savedAssistantMessage =
                await saveChatMessage(
                    userId,
                    assistantMessage
                );

            if (!savedAssistantMessage) {
                console.error(
                    "Assistant response was not saved."
                );
            }
        } catch (err) {
            console.error(
                "AI Coach request error:",
                err
            );

            const errorMessage =
                err instanceof Error
                    ? err.message
                    : "AI Coach couldn't respond right now.";

            setError(errorMessage);

            const fallbackMessage:
                ChatMessage = {
                id: crypto.randomUUID(),
                role: "assistant",
                content:
                    "I'm having trouble connecting to the AI service right now. Please try again in a moment.",
                provider: "error",
            };

            setMessages((current) => [
                ...current,
                fallbackMessage,
            ]);
        } finally {
            setSending(false);
        }
    }

    async function clearChat() {
        if (
            !userId ||
            !financialContext
        ) {
            return;
        }

        setError("");

        const {
            error: deleteError,
        } = await supabase
            .from("ai_chat_messages")
            .delete()
            .eq("user_id", userId);

        if (deleteError) {
            console.error(
                "Chat delete error:",
                deleteError
            );

            setError(
                `Chat could not be cleared: ${deleteError.message}`
            );

            return;
        }

        const greeting =
            createGreeting(
                financialContext
            );

        setMessages([greeting]);

        await saveChatMessage(
            userId,
            greeting
        );
    }

    const topCategory =
        useMemo(() => {
            if (!financialContext) {
                return null;
            }

            const entries =
                Object.entries(
                    financialContext.categorySpending
                );

            if (!entries.length) {
                return null;
            }

            return entries.sort(
                (a, b) => b[1] - a[1]
            )[0];
        }, [financialContext]);

    if (loading) {
        return (
            <div className="flex min-h-[100dvh] w-full items-center justify-center bg-slate-950 px-4 text-white">
                <div className="flex max-w-xs items-center gap-3 text-center text-sm text-slate-400">
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin text-indigo-400" />

                    <span>
                        Loading your financial data...
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[100dvh] w-full overflow-hidden bg-slate-950 text-white">
            {/* Desktop Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-slate-950 md:block">
                <div className="flex h-full min-h-0 flex-col p-5">
                    <div className="mb-7 flex shrink-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500">
                            <WalletCards className="h-5 w-5 text-white" />
                        </div>

                        <div className="min-w-0">
                            <h1 className="truncate font-semibold tracking-tight">
                                FinPilot
                            </h1>

                            <p className="truncate text-xs text-slate-500">
                                Personal Finance
                            </p>
                        </div>
                    </div>

                    <nav className="min-h-0 space-y-1 overflow-y-auto">
                        <NavItem
                            href="/"
                            label="Dashboard"
                        />

                        <NavItem
                            href="/transactions"
                            label="Transactions"
                        />

                        <NavItem
                            href="/budgets"
                            label="Budgets"
                        />

                        <NavItem
                            href="/goals"
                            label="Goals"
                        />

                        <NavItem
                            href="/forecast"
                            label="Forecast"
                        />

                        <NavItem
                            href="/ai-coach"
                            label="AI Coach"
                            active
                            icon={
                                <Sparkles className="h-4 w-4" />
                            }
                        />

                        <NavItem
                            href="/settings"
                            label="Settings"
                        />
                    </nav>

                    <div className="mt-auto hidden shrink-0 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4 lg:block">
                        <div className="mb-2 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-indigo-400" />

                            <span className="text-sm font-medium text-indigo-300">
                                AI Coach V2
                            </span>
                        </div>

                        <p className="text-xs leading-5 text-slate-400">
                            Ask questions about your
                            spending, budgets, goals
                            and financial forecast.
                        </p>
                    </div>
                </div>
            </aside>

            {/* Main */}
            <main className="h-[100dvh] min-w-0 overflow-hidden md:ml-64">
                <div className="mx-auto flex h-full min-h-0 max-w-7xl flex-col overflow-hidden px-2.5 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 xl:px-8">
                    {/* Mobile Navigation */}
                    <div className="mb-2.5 shrink-0 md:hidden">
                        <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500">
                                <WalletCards className="h-4 w-4 text-white" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold">
                                    FinPilot
                                </p>

                                <p className="truncate text-[10px] text-slate-600">
                                    AI Coach
                                </p>
                            </div>

                            <Link
                                href="/settings"
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 text-slate-400 transition hover:bg-white/5 hover:text-white"
                                aria-label="Settings"
                            >
                                <span className="text-sm">
                                    ⚙
                                </span>
                            </Link>
                        </div>

                        <nav className="mt-2 flex min-w-0 gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            <MobileNavItem
                                href="/"
                                label="Dashboard"
                            />

                            <MobileNavItem
                                href="/transactions"
                                label="Transactions"
                            />

                            <MobileNavItem
                                href="/budgets"
                                label="Budgets"
                            />

                            <MobileNavItem
                                href="/goals"
                                label="Goals"
                            />

                            <MobileNavItem
                                href="/forecast"
                                label="Forecast"
                            />

                            <MobileNavItem
                                href="/ai-coach"
                                label="AI Coach"
                                active
                            />
                        </nav>
                    </div>

                    {/* Header */}
                    <header className="mb-2.5 flex shrink-0 items-center justify-between gap-2.5 sm:mb-3.5 sm:gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 sm:h-10 sm:w-10">
                                <Sparkles className="h-4.5 w-4.5 text-indigo-400 sm:h-5 sm:w-5" />
                            </div>

                            <div className="min-w-0">
                                <h2 className="truncate text-lg font-semibold sm:text-2xl">
                                    AI Coach
                                </h2>

                                <p className="hidden truncate text-xs text-slate-500 sm:block sm:text-sm">
                                    Your personal financial assistant
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={clearChat}
                            disabled={sending}
                            className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:px-3"
                            aria-label="Clear chat"
                        >
                            <Trash2 className="h-4 w-4" />

                            <span className="hidden sm:inline">
                                Clear
                            </span>
                        </button>
                    </header>

                    {/* Financial Stats */}
                    {financialContext && (
                        <div className="mb-2.5 grid shrink-0 grid-cols-2 gap-1.5 sm:mb-3 sm:grid-cols-2 sm:gap-2.5 lg:grid-cols-4">
                            <MiniStat
                                label="Balance"
                                value={formatMoney(
                                    financialContext.balance
                                )}
                            />

                            <MiniStat
                                label="Spent"
                                value={formatMoney(
                                    financialContext.expenses
                                )}
                            />

                            <MiniStat
                                label="Budget"
                                value={
                                    financialContext.totalBudget >
                                        0
                                        ? `${Math.round(
                                            financialContext.budgetUsagePercent
                                        )}% used`
                                        : "Not set"
                                }
                            />

                            <MiniStat
                                label="Top Category"
                                value={
                                    topCategory
                                        ? `${topCategory[0]} · ${formatMoney(
                                            topCategory[1]
                                        )}`
                                        : "None"
                                }
                            />
                        </div>
                    )}

                    {/* Chat */}
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] shadow-2xl shadow-black/20">
                        {/* Messages */}
                        <div
                            className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2.5 sm:space-y-6 sm:p-4 lg:p-5 [scrollbar-color:rgb(71_85_105)_transparent] [scrollbar-width:thin]"
                            style={{
                                scrollbarGutter: "stable",
                            }}
                        >
                            <div className="space-y-4 sm:space-y-6">
                                {messages.map((message) => {
                                    const isUser =
                                        message.role === "user";

                                    const providerLabel =
                                        getProviderLabel(
                                            message.provider
                                        );

                                    return (
                                        <div
                                            key={message.id}
                                            className={`flex min-w-0 gap-2 ${isUser
                                                ? "justify-end"
                                                : "justify-start"
                                                } sm:gap-3`}
                                        >
                                            {!isUser && (
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 sm:h-9 sm:w-9">
                                                    <Bot className="h-4 w-4 text-indigo-400" />
                                                </div>
                                            )}

                                            <div
                                                className={`flex min-w-0 max-w-[calc(100%-40px)] flex-col sm:max-w-[78%] lg:max-w-[75%] ${isUser
                                                    ? "items-end"
                                                    : "items-start"
                                                    }`}
                                            >
                                                <div
                                                    className={`min-w-0 max-w-full overflow-hidden rounded-2xl px-3 py-2.5 text-[13px] leading-6 sm:px-4 sm:py-3 sm:text-sm ${isUser
                                                        ? "rounded-br-md bg-indigo-500 text-white"
                                                        : "rounded-bl-md border border-white/10 bg-white/[0.04] text-slate-200"
                                                        }`}
                                                >
                                                    {isUser ? (
                                                        <div className="whitespace-pre-wrap break-words">
                                                            {message.content}
                                                        </div>
                                                    ) : (
                                                        <div className="finpilot-markdown min-w-0 max-w-full break-words">
                                                            <ReactMarkdown
                                                                remarkPlugins={[
                                                                    remarkGfm,
                                                                ]}
                                                                components={{
                                                                    p: ({
                                                                        children,
                                                                    }) => (
                                                                        <p className="mb-3 break-words leading-7 last:mb-0">
                                                                            {children}
                                                                        </p>
                                                                    ),

                                                                    strong: ({
                                                                        children,
                                                                    }) => (
                                                                        <strong className="font-semibold text-white">
                                                                            {children}
                                                                        </strong>
                                                                    ),

                                                                    em: ({
                                                                        children,
                                                                    }) => (
                                                                        <em className="italic text-slate-300">
                                                                            {children}
                                                                        </em>
                                                                    ),

                                                                    ul: ({
                                                                        children,
                                                                    }) => (
                                                                        <ul className="my-3 ml-5 list-disc space-y-1.5">
                                                                            {children}
                                                                        </ul>
                                                                    ),

                                                                    ol: ({
                                                                        children,
                                                                    }) => (
                                                                        <ol className="my-3 ml-5 list-decimal space-y-1.5">
                                                                            {children}
                                                                        </ol>
                                                                    ),

                                                                    li: ({
                                                                        children,
                                                                    }) => (
                                                                        <li className="break-words pl-1 leading-6">
                                                                            {children}
                                                                        </li>
                                                                    ),

                                                                    h1: ({
                                                                        children,
                                                                    }) => (
                                                                        <h1 className="mb-3 mt-1 break-words text-lg font-semibold text-white">
                                                                            {children}
                                                                        </h1>
                                                                    ),

                                                                    h2: ({
                                                                        children,
                                                                    }) => (
                                                                        <h2 className="mb-3 mt-1 break-words text-base font-semibold text-white">
                                                                            {children}
                                                                        </h2>
                                                                    ),

                                                                    h3: ({
                                                                        children,
                                                                    }) => (
                                                                        <h3 className="mb-2 mt-4 break-words text-sm font-semibold text-white">
                                                                            {children}
                                                                        </h3>
                                                                    ),

                                                                    hr: () => (
                                                                        <hr className="my-4 border-white/10" />
                                                                    ),

                                                                    blockquote: ({
                                                                        children,
                                                                    }) => (
                                                                        <blockquote className="my-3 border-l-2 border-indigo-500/40 pl-3 text-slate-400">
                                                                            {children}
                                                                        </blockquote>
                                                                    ),

                                                                    table: ({
                                                                        children,
                                                                    }) => (
                                                                        <div className="my-4 max-w-full overflow-x-auto rounded-xl border border-white/10">
                                                                            <table className="w-full min-w-[430px] border-collapse text-left text-xs sm:min-w-[520px] sm:text-sm">
                                                                                {children}
                                                                            </table>
                                                                        </div>
                                                                    ),

                                                                    thead: ({
                                                                        children,
                                                                    }) => (
                                                                        <thead className="bg-white/[0.06] text-slate-300">
                                                                            {children}
                                                                        </thead>
                                                                    ),

                                                                    tbody: ({
                                                                        children,
                                                                    }) => (
                                                                        <tbody className="divide-y divide-white/10">
                                                                            {children}
                                                                        </tbody>
                                                                    ),

                                                                    tr: ({
                                                                        children,
                                                                    }) => (
                                                                        <tr className="transition hover:bg-white/[0.025]">
                                                                            {children}
                                                                        </tr>
                                                                    ),

                                                                    th: ({
                                                                        children,
                                                                    }) => (
                                                                        <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-300 sm:px-4 sm:py-3">
                                                                            {children}
                                                                        </th>
                                                                    ),

                                                                    td: ({
                                                                        children,
                                                                    }) => (
                                                                        <td className="px-3 py-2.5 text-slate-300 sm:px-4 sm:py-3">
                                                                            {children}
                                                                        </td>
                                                                    ),

                                                                    code: ({
                                                                        children,
                                                                        className,
                                                                    }) => {
                                                                        const isBlock =
                                                                            Boolean(
                                                                                className
                                                                            );

                                                                        if (isBlock) {
                                                                            return (
                                                                                <code className="block max-w-full overflow-x-auto rounded-xl bg-black/30 p-3 text-xs leading-6 text-slate-300 sm:p-4">
                                                                                    {children}
                                                                                </code>
                                                                            );
                                                                        }

                                                                        return (
                                                                            <code className="break-words rounded bg-black/20 px-1.5 py-0.5 text-xs text-indigo-300">
                                                                                {children}
                                                                            </code>
                                                                        );
                                                                    },

                                                                    pre: ({
                                                                        children,
                                                                    }) => (
                                                                        <pre className="my-4 max-w-full overflow-x-auto rounded-xl border border-white/10 bg-black/30">
                                                                            {children}
                                                                        </pre>
                                                                    ),

                                                                    a: ({
                                                                        children,
                                                                        href,
                                                                    }) => (
                                                                        <a
                                                                            href={href}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="break-all text-indigo-300 underline underline-offset-2 hover:text-indigo-200"
                                                                        >
                                                                            {children}
                                                                        </a>
                                                                    ),
                                                                }}
                                                            >
                                                                {normalizeMarkdown(
                                                                    message.content
                                                                )}
                                                            </ReactMarkdown>
                                                        </div>
                                                    )}
                                                </div>

                                                {!isUser &&
                                                    providerLabel && (
                                                        <div className="mt-1.5 ml-1 flex max-w-full items-center gap-1.5 text-[10px] text-slate-600">
                                                            {(
                                                                message.provider ===
                                                                "gemini" ||
                                                                message.provider ===
                                                                "Gemini"
                                                            ) && (
                                                                    <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500/70" />
                                                                )}

                                                            {(
                                                                message.provider ===
                                                                "openrouter" ||
                                                                message.provider ===
                                                                "OpenRouter"
                                                            ) && (
                                                                    <RefreshCw className="h-3 w-3 shrink-0 text-amber-500/70" />
                                                                )}

                                                            {(
                                                                message.provider ===
                                                                "finpilot-fallback" ||
                                                                message.provider ===
                                                                "FinPilot" ||
                                                                message.provider ===
                                                                "finpilot"
                                                            ) && (
                                                                    <Sparkles className="h-3 w-3 shrink-0 text-indigo-500/70" />
                                                                )}

                                                            <span className="truncate">
                                                                {providerLabel}
                                                            </span>
                                                        </div>
                                                    )}
                                            </div>

                                            {isUser && (
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500 sm:h-9 sm:w-9">
                                                    <User className="h-4 w-4 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {sending && (
                                    <div className="flex gap-2 sm:gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 sm:h-9 sm:w-9">
                                            <Bot className="h-4 w-4 text-indigo-400" />
                                        </div>

                                        <div className="min-w-0 max-w-[calc(100%-40px)] rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.04] px-3 py-2.5 sm:px-4 sm:py-3">
                                            <div className="flex items-center gap-2 text-xs text-slate-500 sm:text-sm">
                                                <span className="flex shrink-0 gap-1">
                                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.3s]" />
                                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.15s]" />
                                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" />
                                                </span>

                                                <span className="truncate">
                                                    FinPilot is responding
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="max-h-20 shrink-0 overflow-y-auto border-t border-red-500/10 bg-red-500/5 px-3 py-2 text-xs leading-5 text-red-300 sm:px-4 sm:py-2.5 sm:text-sm">
                                {error}
                            </div>
                        )}

                        {/* Bottom Composer */}
                        <div className="shrink-0 border-t border-white/10 bg-slate-950/95 p-2 sm:p-3 lg:p-4">
                            {/* Quick Questions */}
                            <div className="mb-2.5">
                                <div className="mb-1.5 flex items-center gap-1.5">
                                    <Sparkles className="h-3 w-3 shrink-0 text-indigo-400" />

                                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-600 sm:text-xs">
                                        Try asking
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-1.5 sm:hidden">
                                    {quickQuestions.slice(0, 4).map(
                                        (question) => (
                                            <QuickQuestionButton
                                                key={question}
                                                question={question}
                                                onClick={() =>
                                                    sendMessage(
                                                        question
                                                    )
                                                }
                                                disabled={sending}
                                            />
                                        )
                                    )}
                                </div>

                                <div className="hidden gap-2 overflow-hidden sm:flex">
                                    {quickQuestions.slice(0, 4).map(
                                        (question) => (
                                            <QuickQuestionButton
                                                key={question}
                                                question={question}
                                                onClick={() =>
                                                    sendMessage(
                                                        question
                                                    )
                                                }
                                                disabled={sending}
                                                desktop
                                            />
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Input */}
                            <div className="flex min-w-0 items-end gap-1.5 rounded-2xl border border-white/10 bg-slate-900/90 p-1.5 transition focus-within:border-indigo-500/30 sm:gap-2 sm:p-2">
                                <MessageCircle className="mb-2 ml-1 h-4 w-4 shrink-0 text-slate-600 sm:ml-2 sm:h-5 sm:w-5" />

                                <textarea
                                    value={input}
                                    onChange={(event) =>
                                        setInput(
                                            event.target.value
                                        )
                                    }
                                    onKeyDown={(event) => {
                                        if (
                                            event.key ===
                                            "Enter" &&
                                            !event.shiftKey
                                        ) {
                                            event.preventDefault();
                                            sendMessage();
                                        }
                                    }}
                                    placeholder="Ask FinPilot about your finances..."
                                    rows={1}
                                    maxLength={2000}
                                    disabled={sending}
                                    className="max-h-24 min-h-10 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent px-1 py-2.5 text-sm leading-5 text-white outline-none placeholder:text-slate-600 disabled:cursor-not-allowed sm:min-h-11 sm:py-3"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        sendMessage()
                                    }
                                    disabled={
                                        !input.trim() ||
                                        sending
                                    }
                                    aria-label="Send message"
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white transition hover:bg-indigo-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 sm:h-11 sm:w-11"
                                >
                                    {sending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <ArrowUp className="h-4 w-4" />
                                    )}
                                </button>
                            </div>

                            <div className="mt-1.5 flex min-w-0 items-center justify-between gap-2 px-1 text-[9px] text-slate-600 sm:text-[10px]">
                                <span className="truncate">
                                    Enter to send · Shift + Enter for new line
                                </span>

                                <span className="hidden shrink-0 lg:block">
                                    Your financial data stays in FinPilot
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-1.5 flex shrink-0 items-center justify-between gap-3 px-1 text-[9px] text-slate-600 sm:mt-2 sm:text-xs">
                        <div className="flex min-w-0 items-center gap-1.5">
                            <Sparkles className="h-3 w-3 shrink-0" />

                            <span className="truncate">
                                FinPilot AI Coach
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                loadFinancialData(
                                    userId || undefined
                                )
                            }
                            disabled={sending}
                            className="flex shrink-0 items-center gap-1.5 transition hover:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5" />

                            <span>
                                Refresh
                            </span>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}

function QuickQuestionButton({
    question,
    onClick,
    disabled,
    desktop = false,
}: {
    question: string;
    onClick: () => void;
    disabled: boolean;
    desktop?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`group flex min-w-0 items-center justify-between rounded-xl border border-white/10 bg-white/[0.025] text-left transition-all duration-200 hover:border-indigo-500/30 hover:bg-indigo-500/[0.07] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 ${desktop
                    ? "min-h-10 flex-1 px-2.5 py-2"
                    : "min-h-11 px-2 py-2"
                }`}
        >
            <span
                className={`min-w-0 pr-1.5 leading-4 text-slate-400 transition group-hover:text-slate-200 ${desktop
                        ? "line-clamp-1 text-[11px]"
                        : "line-clamp-2 text-[10px]"
                    }`}
            >
                {question}
            </span>

            <ChevronRight
                className={`shrink-0 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-indigo-400 ${desktop
                        ? "h-3.5 w-3.5"
                        : "h-3 w-3"
                    }`}
            />
        </button>
    );
}

function NavItem({
    href,
    label,
    active = false,
    icon,
}: {
    href: string;
    label: string;
    active?: boolean;
    icon?: ReactNode;
}) {
    return (
        <Link
            href={href}
            className={`flex min-h-10 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active
                    ? "bg-indigo-500/10 text-indigo-300"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
        >
            {icon || (
                <ChevronRight className="h-4 w-4 shrink-0 opacity-60" />
            )}

            <span className="truncate">
                {label}
            </span>
        </Link>
    );
}

function MobileNavItem({
    href,
    label,
    active = false,
}: {
    href: string;
    label: string;
    active?: boolean;
}) {
    return (
        <Link
            href={href}
            className={`min-h-9 shrink-0 rounded-xl border px-3 py-2 text-xs font-medium transition ${active
                    ? "border-indigo-500/30 bg-indigo-500/15 text-indigo-300"
                    : "border-white/10 bg-white/[0.025] text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
        >
            {label}
        </Link>
    );
}

function MiniStat({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] px-2 py-2 sm:p-3">
            <p className="truncate text-[8px] uppercase tracking-[0.08em] text-slate-600 sm:text-[10px] sm:tracking-[0.12em]">
                {label}
            </p>

            <p className="mt-0.5 truncate text-[11px] font-medium text-slate-200 sm:mt-1 sm:text-sm">
                {value}
            </p>
        </div>
    );
}