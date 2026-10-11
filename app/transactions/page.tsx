"use client";

import {
    useEffect,
    useMemo,
    useState,
    type FormEvent,
    type ReactNode,
} from "react";
import Link from "next/link";
import {
    ArrowDownRight,
    ArrowUpRight,
    ChevronDown,
    CreditCard,
    Edit3,
    Filter,
    Goal,
    LayoutDashboard,
    Loader2,
    Menu,
    Plus,
    Search,
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
import AddTransaction from "@/app/components/AddTransaction";

type TransactionType = "income" | "expense";

type Transaction = {
    id: string;
    user_id: string;
    type: TransactionType;
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

function TransactionsContent() {
    const [user, setUser] = useState<any>(null);

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [sortOrder, setSortOrder] = useState("newest");

    const [showAddTransaction, setShowAddTransaction] = useState(false);

    const [editingTransaction, setEditingTransaction] =
        useState<Transaction | null>(null);

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    /* =====================================================
       LOAD USER
    ===================================================== */

    useEffect(() => {
        let mounted = true;

        async function loadUser() {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!mounted) return;

            setUser(user);
        }

        loadUser();

        return () => {
            mounted = false;
        };
    }, []);

    /* =====================================================
       ESCAPE KEY
    ===================================================== */

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setMobileMenuOpen(false);
            }
        }

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    /* =====================================================
       LOAD TRANSACTIONS
    ===================================================== */

    async function loadTransactions() {
        if (!user) return;

        setLoading(true);

        const { data, error } = await supabase
            .from("transactions")
            .select(
                "id, user_id, type, amount, description, category, transaction_date, created_at"
            )
            .eq("user_id", user.id)
            .order("transaction_date", {
                ascending: false,
            })
            .order("created_at", {
                ascending: false,
            });

        if (error) {
            console.error("Transaction loading error:", error);
            setLoading(false);
            return;
        }

        setTransactions((data || []) as Transaction[]);
        setLoading(false);
    }

    useEffect(() => {
        if (user) {
            loadTransactions();
        }
    }, [user]);

    /* =====================================================
       TOTALS
    ===================================================== */

    const totalIncome = useMemo(() => {
        return transactions
            .filter((transaction) => transaction.type === "income")
            .reduce(
                (total, transaction) => total + Number(transaction.amount),
                0
            );
    }, [transactions]);

    const totalExpenses = useMemo(() => {
        return transactions
            .filter((transaction) => transaction.type === "expense")
            .reduce(
                (total, transaction) => total + Number(transaction.amount),
                0
            );
    }, [transactions]);

    const balance = totalIncome - totalExpenses;

    const incomeCount = useMemo(() => {
        return transactions.filter(
            (transaction) => transaction.type === "income"
        ).length;
    }, [transactions]);

    const expenseCount = useMemo(() => {
        return transactions.filter(
            (transaction) => transaction.type === "expense"
        ).length;
    }, [transactions]);

    /* =====================================================
       FILTER + SORT
    ===================================================== */

    const filteredTransactions = useMemo(() => {
        let result = [...transactions];

        if (search.trim()) {
            const query = search.trim().toLowerCase();

            result = result.filter((transaction) => {
                return (
                    transaction.description?.toLowerCase().includes(query) ||
                    transaction.category?.toLowerCase().includes(query)
                );
            });
        }

        if (typeFilter !== "all") {
            result = result.filter(
                (transaction) => transaction.type === typeFilter
            );
        }

        if (categoryFilter !== "all") {
            result = result.filter(
                (transaction) => transaction.category === categoryFilter
            );
        }

        result.sort((a, b) => {
            if (sortOrder === "oldest") {
                return (
                    new Date(a.transaction_date).getTime() -
                    new Date(b.transaction_date).getTime()
                );
            }

            if (sortOrder === "highest") {
                return Number(b.amount) - Number(a.amount);
            }

            if (sortOrder === "lowest") {
                return Number(a.amount) - Number(b.amount);
            }

            return (
                new Date(b.transaction_date).getTime() -
                new Date(a.transaction_date).getTime()
            );
        });

        return result;
    }, [
        transactions,
        search,
        typeFilter,
        categoryFilter,
        sortOrder,
    ]);

    /* =====================================================
       CLEAR FILTERS
    ===================================================== */

    function clearFilters() {
        setSearch("");
        setTypeFilter("all");
        setCategoryFilter("all");
        setSortOrder("newest");
    }

    /* =====================================================
       DELETE
    ===================================================== */

    async function handleDelete() {
        if (!deleteId || !user) return;

        setDeleting(true);

        const { error } = await supabase
            .from("transactions")
            .delete()
            .eq("id", deleteId)
            .eq("user_id", user.id);

        if (error) {
            console.error("Delete transaction error:", error);

            alert("Unable to delete transaction.");

            setDeleting(false);
            return;
        }

        setTransactions((current) =>
            current.filter((transaction) => transaction.id !== deleteId)
        );

        setDeleteId(null);
        setDeleting(false);
    }

    /* =====================================================
       UPDATE
    ===================================================== */

    async function handleUpdate(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!editingTransaction || !user) return;

        const formData = new FormData(event.currentTarget);

        const description = String(
            formData.get("description") || ""
        ).trim();

        const amount = Number(formData.get("amount"));

        const category = String(
            formData.get("category") || ""
        );

        const type = String(
            formData.get("type") || ""
        ) as TransactionType;

        const transactionDate = String(
            formData.get("transaction_date") || ""
        );

        if (!description || !amount || amount <= 0) {
            alert("Please enter a valid description and amount.");
            return;
        }

        if (!transactionDate) {
            alert("Please select a transaction date.");
            return;
        }

        const { data, error } = await supabase
            .from("transactions")
            .update({
                description,
                amount,
                category,
                type,
                transaction_date: transactionDate,
            })
            .eq("id", editingTransaction.id)
            .eq("user_id", user.id)
            .select()
            .single();

        if (error) {
            console.error("Update transaction error:", error);

            alert("Unable to update transaction.");
            return;
        }

        setTransactions((current) =>
            current.map((transaction) =>
                transaction.id === editingTransaction.id
                    ? (data as Transaction)
                    : transaction
            )
        );

        setEditingTransaction(null);
    }

    /* =====================================================
       HELPERS
    ===================================================== */

    function formatCurrency(amount: number) {
        return `₹${amount.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    function formatDate(date: string) {
        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }

    /* =====================================================
       MAIN PAGE
    ===================================================== */

    return (
        <main className="min-h-[100dvh] overflow-x-hidden bg-slate-950 text-white">
            <div className="flex min-h-[100dvh]">
                {/* =================================================
            DESKTOP SIDEBAR
        ================================================= */}

                <aside className="sticky top-0 hidden h-[100dvh] w-64 shrink-0 overflow-y-auto border-r border-white/10 bg-slate-950 p-5 md:flex md:flex-col">
                    <SidebarContent />
                </aside>

                {/* =================================================
            MAIN CONTENT
        ================================================= */}

                <section className="min-w-0 flex-1">
                    {/* =================================================
              MOBILE HEADER
          ================================================= */}

                    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-white/10 bg-slate-950/95 px-4 py-3 backdrop-blur-md md:hidden">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500">
                                <Wallet size={19} />
                            </div>

                            <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-white">
                                    FinPilot
                                </p>

                                <p className="truncate text-[11px] text-slate-500">
                                    Transactions
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(true)}
                            aria-label="Open navigation menu"
                            aria-expanded={mobileMenuOpen}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 transition hover:bg-white/10 hover:text-white"
                        >
                            <Menu size={21} />
                        </button>
                    </header>

                    {/* =================================================
              PAGE CONTENT
          ================================================= */}

                    <div className="min-w-0 p-4 sm:p-5 md:p-8 lg:p-10">
                        <div className="mx-auto w-full max-w-[1600px]">
                            {/* =================================================
                  HEADER
              ================================================= */}

                            <div className="mb-6 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-center md:justify-between">
                                <div className="min-w-0">
                                    <p className="text-xs text-slate-500 sm:text-sm">
                                        {new Date().toLocaleDateString("en-IN", {
                                            weekday: "long",
                                            month: "long",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </p>

                                    <h2 className="mt-1 break-words text-2xl font-bold sm:text-3xl">
                                        Transactions
                                    </h2>

                                    <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                                        Manage and analyze all your transactions.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowAddTransaction(true)}
                                    className="flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-400 active:scale-[0.99] sm:w-auto"
                                >
                                    <Plus size={18} />
                                    Add Transaction
                                </button>
                            </div>

                            {/* =================================================
                  STATS
              ================================================= */}

                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <StatCard
                                    title="Total Income"
                                    value={formatCurrency(totalIncome)}
                                    subtitle={`${incomeCount} income ${incomeCount === 1 ? "entry" : "entries"
                                        }`}
                                    icon={
                                        <ArrowUpRight
                                            size={20}
                                            className="text-emerald-400"
                                        />
                                    }
                                />

                                <StatCard
                                    title="Total Spending"
                                    value={formatCurrency(totalExpenses)}
                                    subtitle={`${expenseCount} ${expenseCount === 1 ? "expense" : "expenses"
                                        } recorded`}
                                    icon={
                                        <ArrowDownRight
                                            size={20}
                                            className="text-red-400"
                                        />
                                    }
                                />

                                <StatCard
                                    title="Current Balance"
                                    value={formatCurrency(balance)}
                                    subtitle="Income minus expenses"
                                    icon={
                                        <Wallet
                                            size={20}
                                            className="text-indigo-400"
                                        />
                                    }
                                />
                            </div>

                            {/* =================================================
                  FILTER BAR
              ================================================= */}

                            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:mt-6 sm:p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Filter
                                            size={16}
                                            className="text-indigo-400"
                                        />

                                        <span className="text-sm font-medium text-slate-300">
                                            Filters
                                        </span>
                                    </div>

                                    {(search ||
                                        typeFilter !== "all" ||
                                        categoryFilter !== "all" ||
                                        sortOrder !== "newest") && (
                                            <button
                                                type="button"
                                                onClick={clearFilters}
                                                className="text-xs font-medium text-indigo-400 transition hover:text-indigo-300"
                                            >
                                                Clear all
                                            </button>
                                        )}
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    {/* SEARCH */}

                                    <div className="relative min-w-0 sm:col-span-2 lg:col-span-1">
                                        <Search
                                            size={18}
                                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                                        />

                                        <input
                                            value={search}
                                            onChange={(event) =>
                                                setSearch(event.target.value)
                                            }
                                            placeholder="Search transactions..."
                                            className="min-h-11 w-full min-w-0 rounded-xl border border-white/10 bg-slate-900 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>

                                    {/* TYPE */}

                                    <SelectBox
                                        value={typeFilter}
                                        onChange={setTypeFilter}
                                        options={[
                                            ["all", "All Types"],
                                            ["income", "Income"],
                                            ["expense", "Expense"],
                                        ]}
                                    />

                                    {/* CATEGORY */}

                                    <SelectBox
                                        value={categoryFilter}
                                        onChange={setCategoryFilter}
                                        options={[
                                            ["all", "All Categories"],
                                            ...categories.map((category) => [
                                                category,
                                                category,
                                            ]),
                                        ]}
                                    />

                                    {/* SORT */}

                                    <SelectBox
                                        value={sortOrder}
                                        onChange={setSortOrder}
                                        options={[
                                            ["newest", "Newest First"],
                                            ["oldest", "Oldest First"],
                                            ["highest", "Highest Amount"],
                                            ["lowest", "Lowest Amount"],
                                        ]}
                                    />
                                </div>
                            </div>

                            {/* =================================================
                  TRANSACTIONS CARD
              ================================================= */}

                            <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] sm:mt-6">
                                {/* TABLE HEADER */}

                                <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-white">
                                            All Transactions
                                        </h3>

                                        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                                            Showing {filteredTransactions.length} transaction
                                            {filteredTransactions.length !== 1 ? "s" : ""}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                        <Filter size={15} />

                                        <span className="hidden sm:inline">
                                            Scroll to view more
                                        </span>

                                        <span className="sm:hidden">
                                            Swipe to view
                                        </span>
                                    </div>
                                </div>

                                {/* LOADING */}

                                {loading ? (
                                    <div className="px-4 py-16 text-center sm:px-5">
                                        <Loader2
                                            size={30}
                                            className="mx-auto animate-spin text-indigo-400"
                                        />

                                        <p className="mt-3 text-sm text-slate-500">
                                            Loading transactions...
                                        </p>
                                    </div>
                                ) : filteredTransactions.length === 0 ? (
                                    /* EMPTY */

                                    <div className="px-5 py-16 text-center">
                                        <CreditCard
                                            size={32}
                                            className="mx-auto text-slate-600"
                                        />

                                        <p className="mt-4 text-sm text-slate-400 sm:text-base">
                                            No transactions found
                                        </p>

                                        {(search ||
                                            typeFilter !== "all" ||
                                            categoryFilter !== "all") && (
                                                <button
                                                    type="button"
                                                    onClick={clearFilters}
                                                    className="mt-3 text-sm text-indigo-400 transition hover:text-indigo-300"
                                                >
                                                    Clear filters
                                                </button>
                                            )}

                                        <div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowAddTransaction(true)
                                                }
                                                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400"
                                            >
                                                <Plus size={16} />
                                                Add Transaction
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /*
                                     * =================================================
                                     * IMPORTANT TRANSACTION SCROLL CONTAINER
                                     *
                                     * overflow-auto:
                                     * - vertical scrollbar for many transactions
                                     * - horizontal scrollbar for narrow screens
                                     *
                                     * max-h:
                                     * prevents the entire page from becoming extremely
                                     * long when hundreds of transactions exist.
                                     * =================================================
                                     */

                                    <div className="relative w-full max-h-[55vh] overflow-auto overscroll-contain sm:max-h-[60vh] lg:max-h-[calc(100dvh-25rem)]">
                                        <table className="w-full min-w-[850px]">
                                            {/* STICKY TABLE HEADER */}

                                            <thead className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-md">
                                                <tr className="border-b border-white/10">
                                                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                        Transaction
                                                    </th>

                                                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                        Category
                                                    </th>

                                                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                        Date
                                                    </th>

                                                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                        Type
                                                    </th>

                                                    <th className="whitespace-nowrap px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                        Amount
                                                    </th>

                                                    <th className="whitespace-nowrap px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {filteredTransactions.map(
                                                    (transaction) => (
                                                        <tr
                                                            key={transaction.id}
                                                            className="border-b border-white/5 transition last:border-0 hover:bg-white/[0.03]"
                                                        >
                                                            {/* TRANSACTION */}

                                                            <td className="max-w-[280px] px-5 py-5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
                                                                        {transaction.type ===
                                                                            "income" ? (
                                                                            <ArrowUpRight
                                                                                size={18}
                                                                                className="text-emerald-400"
                                                                            />
                                                                        ) : (
                                                                            <ArrowDownRight
                                                                                size={18}
                                                                                className="text-red-400"
                                                                            />
                                                                        )}
                                                                    </div>

                                                                    <span className="break-words font-medium text-white">
                                                                        {transaction.description}
                                                                    </span>
                                                                </div>
                                                            </td>

                                                            {/* CATEGORY */}

                                                            <td className="px-5 py-5">
                                                                <span className="inline-block max-w-[160px] break-words rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                                                                    {transaction.category}
                                                                </span>
                                                            </td>

                                                            {/* DATE */}

                                                            <td className="whitespace-nowrap px-5 py-5 text-sm text-slate-400">
                                                                {formatDate(
                                                                    transaction.transaction_date
                                                                )}
                                                            </td>

                                                            {/* TYPE */}

                                                            <td className="px-5 py-5">
                                                                <span
                                                                    className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${transaction.type ===
                                                                            "income"
                                                                            ? "bg-emerald-500/10 text-emerald-400"
                                                                            : "bg-red-500/10 text-red-400"
                                                                        }`}
                                                                >
                                                                    {transaction.type ===
                                                                        "income"
                                                                        ? "Income"
                                                                        : "Expense"}
                                                                </span>
                                                            </td>

                                                            {/* AMOUNT */}

                                                            <td
                                                                className={`whitespace-nowrap px-5 py-5 text-right font-semibold ${transaction.type ===
                                                                        "income"
                                                                        ? "text-emerald-400"
                                                                        : "text-red-400"
                                                                    }`}
                                                            >
                                                                {transaction.type ===
                                                                    "income"
                                                                    ? "+"
                                                                    : "-"}
                                                                {formatCurrency(
                                                                    Number(transaction.amount)
                                                                )}
                                                            </td>

                                                            {/* ACTIONS */}

                                                            <td className="px-5 py-5">
                                                                <div className="flex justify-end gap-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setEditingTransaction(
                                                                                transaction
                                                                            )
                                                                        }
                                                                        aria-label={`Edit ${transaction.description}`}
                                                                        title="Edit transaction"
                                                                        className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-indigo-500/10 hover:text-indigo-400"
                                                                    >
                                                                        <Edit3 size={16} />
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setDeleteId(
                                                                                transaction.id
                                                                            )
                                                                        }
                                                                        aria-label={`Delete ${transaction.description}`}
                                                                        title="Delete transaction"
                                                                        className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* MOBILE TABLE HINT */}

                            {!loading &&
                                filteredTransactions.length > 0 && (
                                    <p className="mt-2 text-center text-[11px] text-slate-600 sm:hidden">
                                        Swipe horizontally and vertically to view
                                        all transactions.
                                    </p>
                                )}
                        </div>
                    </div>
                </section>
            </div>

            {/* =====================================================
          MOBILE SIDEBAR DRAWER
      ===================================================== */}

            {mobileMenuOpen && (
                <div className="fixed inset-0 z-[80] md:hidden">
                    {/* OVERLAY */}

                    <button
                        type="button"
                        aria-label="Close navigation menu"
                        onClick={() => setMobileMenuOpen(false)}
                        className="absolute inset-0 h-full w-full bg-black/70 backdrop-blur-sm"
                    />

                    {/* DRAWER */}

                    <aside className="absolute left-0 top-0 flex h-[100dvh] w-[min(18rem,calc(100vw-1rem))] flex-col overflow-y-auto overscroll-contain border-r border-white/10 bg-slate-950 p-4 shadow-2xl">
                        <div className="mb-6 flex items-center justify-between">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500">
                                    <Wallet size={21} />
                                </div>

                                <div className="min-w-0">
                                    <h1 className="truncate font-bold text-white">
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
                                aria-label="Close navigation menu"
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-white/5 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <MobileNavItem
                            href="/"
                            icon={<LayoutDashboard size={18} />}
                            label="Dashboard"
                            onClick={() => setMobileMenuOpen(false)}
                        />

                        <MobileNavItem
                            href="/transactions"
                            icon={<CreditCard size={18} />}
                            label="Transactions"
                            active
                            onClick={() => setMobileMenuOpen(false)}
                        />

                        <MobileNavItem
                            href="/budgets"
                            icon={<Target size={18} />}
                            label="Budgets"
                            onClick={() => setMobileMenuOpen(false)}
                        />

                        <MobileNavItem
                            href="/goals"
                            icon={<Goal size={18} />}
                            label="Goals"
                            onClick={() => setMobileMenuOpen(false)}
                        />

                        <MobileNavItem
                            href="/forecast"
                            icon={<TrendingUp size={18} />}
                            label="Forecast"
                            onClick={() => setMobileMenuOpen(false)}
                        />

                        <MobileNavItem
                            href="/ai-coach"
                            icon={<Sparkles size={18} />}
                            label="AI Coach"
                            onClick={() => setMobileMenuOpen(false)}
                        />

                        <div className="my-5 border-t border-white/10" />

                        <MobileNavItem
                            href="/settings"
                            icon={<Settings size={18} />}
                            label="Settings"
                            onClick={() => setMobileMenuOpen(false)}
                        />

                        <div className="mt-auto pt-6">
                            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4">
                                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20">
                                    <Sparkles
                                        size={18}
                                        className="text-indigo-400"
                                    />
                                </div>

                                <p className="text-sm font-semibold text-white">
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

            {/* =====================================================
          ADD TRANSACTION
      ===================================================== */}

            {showAddTransaction && (
                <AddTransaction
                    onClose={() => {
                        setShowAddTransaction(false);
                        loadTransactions();
                    }}
                />
            )}

            {/* =====================================================
          EDIT MODAL
      ===================================================== */}

            {editingTransaction && (
                <div className="fixed inset-0 z-[90] overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-4">
                    <div className="flex min-h-full items-center justify-center">
                        <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl">
                            {/* HEADER */}

                            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-4 sm:p-6">
                                <div className="min-w-0">
                                    <h2 className="text-lg font-bold text-white sm:text-xl">
                                        Edit Transaction
                                    </h2>

                                    <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                                        Update your transaction details.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setEditingTransaction(null)
                                    }
                                    aria-label="Close edit transaction"
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* FORM */}

                            <form
                                onSubmit={handleUpdate}
                                className="max-h-[calc(100dvh-8rem)] space-y-5 overflow-y-auto overscroll-contain p-4 sm:p-6"
                            >
                                {/* DESCRIPTION */}

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-300">
                                        Description
                                    </label>

                                    <input
                                        name="description"
                                        defaultValue={
                                            editingTransaction.description
                                        }
                                        required
                                        maxLength={150}
                                        className="min-h-11 w-full min-w-0 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>

                                {/* AMOUNT */}

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-300">
                                        Amount
                                    </label>

                                    <input
                                        name="amount"
                                        type="number"
                                        inputMode="decimal"
                                        step="0.01"
                                        min="0.01"
                                        defaultValue={
                                            editingTransaction.amount
                                        }
                                        required
                                        className="min-h-11 w-full min-w-0 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>

                                {/* TYPE + CATEGORY */}

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-300">
                                            Type
                                        </label>

                                        <select
                                            name="type"
                                            defaultValue={
                                                editingTransaction.type
                                            }
                                            className="min-h-11 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500"
                                        >
                                            <option value="expense">
                                                Expense
                                            </option>

                                            <option value="income">
                                                Income
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-300">
                                            Category
                                        </label>

                                        <select
                                            name="category"
                                            defaultValue={
                                                editingTransaction.category
                                            }
                                            className="min-h-11 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500"
                                        >
                                            {categories.map((category) => (
                                                <option
                                                    key={category}
                                                    value={category}
                                                >
                                                    {category}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* DATE */}

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-300">
                                        Date
                                    </label>

                                    <input
                                        name="transaction_date"
                                        type="date"
                                        defaultValue={
                                            editingTransaction.transaction_date
                                        }
                                        required
                                        className="min-h-11 w-full min-w-0 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500"
                                    />
                                </div>

                                {/* BUTTONS */}

                                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setEditingTransaction(null)
                                        }
                                        className="min-h-11 flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="min-h-11 flex-1 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-400"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* =====================================================
          DELETE MODAL
      ===================================================== */}

            {deleteId && (
                <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-4">
                    <div className="flex min-h-full items-center justify-center">
                        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-2xl sm:p-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                                <Trash2
                                    size={22}
                                    className="text-red-400"
                                />
                            </div>

                            <h2 className="mt-4 text-lg font-bold text-white sm:text-xl">
                                Delete transaction?
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                This transaction will be permanently
                                removed from your FinPilot account.
                            </p>

                            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => setDeleteId(null)}
                                    disabled={deleting}
                                    className="min-h-11 flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="min-h-11 flex-1 rounded-xl bg-red-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
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
                </div>
            )}
        </main>
    );
}

/* =========================================================
   SIDEBAR
========================================================= */

function SidebarContent() {
    return (
        <>
            {/* LOGO */}

            <div className="mb-10 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500">
                    <Wallet size={21} />
                </div>

                <div className="min-w-0">
                    <h1 className="font-bold text-white">
                        FinPilot
                    </h1>

                    <p className="truncate text-xs text-slate-500">
                        AI Finance Assistant
                    </p>
                </div>
            </div>

            {/* NAV */}

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
                    active
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

            {/* SETTINGS */}

            <div className="mt-10 border-t border-white/10 pt-5">
                <NavItem
                    href="/settings"
                    icon={<Settings size={18} />}
                    label="Settings"
                />
            </div>

            {/* AI CARD */}

            <div className="mt-8 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20">
                    <Sparkles
                        size={18}
                        className="text-indigo-400"
                    />
                </div>

                <p className="text-sm font-semibold text-white">
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
   DESKTOP NAV ITEM
========================================================= */

type NavItemProps = {
    href: string;
    icon: ReactNode;
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
            <span className="shrink-0">
                {icon}
            </span>

            <span className="min-w-0 flex-1 truncate">
                {label}
            </span>
        </Link>
    );
}

/* =========================================================
   MOBILE NAV ITEM
========================================================= */

type MobileNavItemProps = {
    href: string;
    icon: ReactNode;
    label: string;
    active?: boolean;
    onClick: () => void;
};

function MobileNavItem({
    href,
    icon,
    label,
    active = false,
    onClick,
}: MobileNavItemProps) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${active
                    ? "bg-indigo-500/10 text-indigo-300"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
        >
            <span className="shrink-0">
                {icon}
            </span>

            <span className="min-w-0 flex-1">
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
    icon: ReactNode;
};

function StatCard({
    title,
    value,
    subtitle,
    icon,
}: StatCardProps) {
    return (
        <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 text-sm text-slate-400">
                    {title}
                </p>

                <div className="shrink-0 rounded-lg bg-white/5 p-2">
                    {icon}
                </div>
            </div>

            <p className="mt-4 break-words text-xl font-bold text-white sm:mt-5 sm:text-2xl">
                {value}
            </p>

            <p className="mt-1 text-xs text-slate-500">
                {subtitle}
            </p>
        </div>
    );
}

/* =========================================================
   SELECT BOX
========================================================= */

type SelectBoxProps = {
    value: string;
    onChange: (value: string) => void;
    options: string[][];
};

function SelectBox({
    value,
    onChange,
    options,
}: SelectBoxProps) {
    return (
        <div className="relative min-w-0">
            <select
                value={value}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                className="min-h-11 w-full appearance-none rounded-xl border border-white/10 bg-slate-900 px-4 py-3 pr-10 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
                {options.map(([optionValue, label]) => (
                    <option
                        key={optionValue}
                        value={optionValue}
                    >
                        {label}
                    </option>
                ))}
            </select>

            <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
        </div>
    );
}

/* =========================================================
   PAGE EXPORT
========================================================= */

export default function TransactionsPage() {
    return (
        <AuthGuard>
            <TransactionsContent />
        </AuthGuard>
    );
}