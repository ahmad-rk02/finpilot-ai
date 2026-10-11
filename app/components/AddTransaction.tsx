"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";

type AddTransactionProps = {
    onClose: () => void;
};

export default function AddTransaction({
    onClose,
}: AddTransactionProps) {
    const [type, setType] = useState<"expense" | "income">("expense");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Food");

    const [date, setDate] = useState(
        new Date().toISOString().split("T")[0]
    );

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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

    async function handleSubmit(
        e: React.FormEvent<HTMLFormElement>
    ) {
        e.preventDefault();

        setError("");

        if (!amount || Number(amount) <= 0) {
            setError("Please enter a valid amount.");
            return;
        }

        if (!description.trim()) {
            setError("Please enter a description.");
            return;
        }

        setLoading(true);

        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) {
                setError(
                    "Your session has expired. Please sign in again."
                );
                return;
            }

            if (!user) {
                setError(
                    "Please sign in before adding a transaction."
                );
                return;
            }

            const { error: insertError } = await supabase
                .from("transactions")
                .insert({
                    user_id: user.id,
                    type,
                    amount: Number(amount),
                    description: description.trim(),
                    category,
                    transaction_date: date,
                });

            if (insertError) {
                throw insertError;
            }

            onClose();
        } catch (err) {
            console.error("Add transaction error:", err);

            setError(
                "Unable to save transaction. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-transaction-title"
        >
            <div className="flex min-h-full items-center justify-center py-3 sm:py-6">
                <div
                    className="
            w-full
            max-w-md
            overflow-hidden
            rounded-2xl
            border
            border-white/10
            bg-slate-900
            shadow-2xl
            shadow-black/40
          "
                >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
                        <div className="min-w-0">
                            <h2
                                id="add-transaction-title"
                                className="text-lg font-bold text-white sm:text-xl"
                            >
                                Add Transaction
                            </h2>

                            <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
                                Record your income or expense.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            aria-label="Close"
                            className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                text-slate-400
                transition
                hover:bg-white/5
                hover:text-white
                active:bg-white/10
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Form */}
                    <form
                        onSubmit={handleSubmit}
                        className="max-h-[calc(100vh-7rem)] overflow-y-auto overscroll-contain px-4 py-5 sm:max-h-[calc(100vh-8rem)] sm:px-6 sm:py-6"
                        style={{
                            scrollbarWidth: "thin",
                            scrollbarColor:
                                "rgb(71 85 105) transparent",
                        }}
                    >
                        <div className="space-y-5">
                            {/* Type */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-300">
                                    Transaction Type
                                </label>

                                <div className="grid grid-cols-2 gap-2 rounded-xl bg-white/5 p-1">
                                    <button
                                        type="button"
                                        onClick={() => setType("expense")}
                                        disabled={loading}
                                        className={`
                      min-h-11
                      rounded-lg
                      px-3
                      py-2
                      text-sm
                      font-medium
                      transition
                      active:scale-[0.98]
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                      ${type === "expense"
                                                ? "bg-red-500/20 text-red-300 ring-1 ring-red-500/20"
                                                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                                            }
                    `}
                                    >
                                        Expense
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setType("income")}
                                        disabled={loading}
                                        className={`
                      min-h-11
                      rounded-lg
                      px-3
                      py-2
                      text-sm
                      font-medium
                      transition
                      active:scale-[0.98]
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                      ${type === "income"
                                                ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/20"
                                                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                                            }
                    `}
                                    >
                                        Income
                                    </button>
                                </div>
                            </div>

                            {/* Amount */}
                            <div>
                                <label
                                    htmlFor="transaction-amount"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Amount
                                </label>

                                <div
                                    className="
                    flex
                    min-h-12
                    items-center
                    rounded-xl
                    border
                    border-white/10
                    bg-white/5
                    px-3
                    transition
                    focus-within:border-indigo-400/50
                    focus-within:bg-white/[0.07]
                    sm:px-4
                  "
                                >
                                    <span className="mr-2 shrink-0 text-lg text-slate-400">
                                        ₹
                                    </span>

                                    <input
                                        id="transaction-amount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        inputMode="decimal"
                                        value={amount}
                                        onChange={(e) =>
                                            setAmount(e.target.value)
                                        }
                                        placeholder="0.00"
                                        disabled={loading}
                                        className="
                      min-w-0
                      w-full
                      bg-transparent
                      py-3
                      text-base
                      text-white
                      outline-none
                      placeholder:text-slate-600
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                      sm:text-lg
                    "
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label
                                    htmlFor="transaction-description"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Description
                                </label>

                                <input
                                    id="transaction-description"
                                    type="text"
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                    placeholder="e.g. Petrol"
                                    maxLength={150}
                                    disabled={loading}
                                    className="
                    min-h-12
                    w-full
                    min-w-0
                    rounded-xl
                    border
                    border-white/10
                    bg-white/5
                    px-4
                    py-3
                    text-sm
                    text-white
                    outline-none
                    transition
                    placeholder:text-slate-600
                    focus:border-indigo-400/50
                    focus:bg-white/[0.07]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label
                                    htmlFor="transaction-category"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Category
                                </label>

                                <select
                                    id="transaction-category"
                                    value={category}
                                    onChange={(e) =>
                                        setCategory(e.target.value)
                                    }
                                    disabled={loading}
                                    className="
                    min-h-12
                    w-full
                    min-w-0
                    rounded-xl
                    border
                    border-white/10
                    bg-slate-800
                    px-4
                    py-3
                    text-sm
                    text-white
                    outline-none
                    transition
                    focus:border-indigo-400/50
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                                >
                                    {categories.map((item) => (
                                        <option
                                            key={item}
                                            value={item}
                                        >
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Date */}
                            <div>
                                <label
                                    htmlFor="transaction-date"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Date
                                </label>

                                <input
                                    id="transaction-date"
                                    type="date"
                                    value={date}
                                    onChange={(e) =>
                                        setDate(e.target.value)
                                    }
                                    disabled={loading}
                                    className="
                    min-h-12
                    w-full
                    min-w-0
                    rounded-xl
                    border
                    border-white/10
                    bg-white/5
                    px-4
                    py-3
                    text-sm
                    text-white
                    outline-none
                    transition
                    focus:border-indigo-400/50
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                                />
                            </div>

                            {/* Error */}
                            {error && (
                                <div
                                    role="alert"
                                    className="
                    overflow-hidden
                    rounded-xl
                    border
                    border-red-400/20
                    bg-red-400/10
                    px-4
                    py-3
                    text-sm
                    leading-5
                    text-red-300
                    break-words
                  "
                                >
                                    {error}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-col gap-3 pt-1 sm:flex-row-reverse">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="
                    flex
                    min-h-12
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-indigo-500
                    px-4
                    py-3
                    text-sm
                    font-medium
                    text-white
                    transition
                    hover:bg-indigo-400
                    active:scale-[0.99]
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                    sm:flex-1
                  "
                                >
                                    <Plus size={18} />

                                    {loading
                                        ? "Saving..."
                                        : "Save Transaction"}
                                </button>

                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={loading}
                                    className="
                    min-h-12
                    w-full
                    rounded-xl
                    border
                    border-white/10
                    bg-white/[0.03]
                    px-4
                    py-3
                    text-sm
                    font-medium
                    text-slate-300
                    transition
                    hover:bg-white/[0.06]
                    hover:text-white
                    active:scale-[0.99]
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                    sm:w-auto
                    sm:px-5
                  "
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}