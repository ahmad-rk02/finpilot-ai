"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Lock, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [ready, setReady] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);

    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;

        async function checkSession() {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (!mounted) return;

                if (session) {
                    setReady(true);
                } else {
                    setError(
                        "This password reset link is invalid or has expired. Please request a new reset link."
                    );
                }
            } catch (err) {
                console.error("Reset session check failed:", err);

                if (mounted) {
                    setError(
                        "Unable to verify the reset link. Please request a new password reset link."
                    );
                }
            } finally {
                if (mounted) {
                    setCheckingSession(false);
                }
            }
        }

        checkSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (!mounted) return;

            if (event === "PASSWORD_RECOVERY" && session) {
                setReady(true);
                setError("");
                setCheckingSession(false);
                return;
            }

            if (session) {
                setReady(true);
                setError("");
                setCheckingSession(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    async function handleSubmit(
        e: React.FormEvent<HTMLFormElement>
    ) {
        e.preventDefault();

        setError("");

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const { error: updateError } =
                await supabase.auth.updateUser({
                    password,
                });

            if (updateError) {
                throw updateError;
            }

            setSuccess(true);
            setPassword("");
            setConfirmPassword("");
        } catch (err) {
            console.error("Password update failed:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to reset password. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    const showVerificationState =
        checkingSession && !ready && !success;

    return (
        <main className="min-h-[100dvh] overflow-x-hidden bg-slate-950 px-4 py-8 text-white sm:px-6 sm:py-12">
            <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center sm:min-h-[calc(100dvh-6rem)]">
                <div className="w-full max-w-md">
                    {/* Brand */}
                    <div className="mb-7 text-center sm:mb-8">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/10 sm:h-16 sm:w-16">
                            <Wallet size={28} />
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            FinPilot
                        </h1>

                        <p className="mt-2 text-sm text-slate-400">
                            Reset your account password
                        </p>
                    </div>

                    {/* Card */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl shadow-black/20 sm:p-6">
                        {success ? (
                            <div className="text-center">
                                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                                    <Check size={28} />
                                </div>

                                <h2 className="text-xl font-semibold">
                                    Password updated
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-slate-400">
                                    Your FinPilot password has been changed
                                    successfully.
                                </p>

                                <Link
                                    href="/"
                                    className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 font-medium text-white transition hover:bg-indigo-400 sm:w-auto"
                                >
                                    Continue to FinPilot
                                    <ArrowRight size={17} />
                                </Link>
                            </div>
                        ) : showVerificationState ? (
                            <div className="py-10 text-center">
                                <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-white/10 border-t-indigo-500" />

                                <p className="text-sm text-slate-400">
                                    Verifying reset link...
                                </p>
                            </div>
                        ) : !ready ? (
                            <div className="text-center">
                                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                                    <Lock size={25} />
                                </div>

                                <h2 className="text-xl font-semibold">
                                    Reset link unavailable
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-slate-400">
                                    {error ||
                                        "This password reset link is invalid or has expired."}
                                </p>

                                <Link
                                    href="/"
                                    className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10 sm:w-auto"
                                >
                                    Return to FinPilot
                                    <ArrowRight size={17} />
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <h2 className="text-xl font-semibold">
                                        Set a new password
                                    </h2>

                                    <p className="mt-1 text-sm leading-6 text-slate-400">
                                        Choose a new password for your FinPilot
                                        account.
                                    </p>
                                </div>

                                <form
                                    onSubmit={handleSubmit}
                                    className="mt-6 space-y-4"
                                >
                                    {/* New password */}
                                    <div>
                                        <label
                                            htmlFor="new-password"
                                            className="mb-2 block text-sm text-slate-300"
                                        >
                                            New password
                                        </label>

                                        <div className="flex min-h-12 items-center rounded-xl border border-white/10 bg-white/5 px-4 transition focus-within:border-indigo-500/50 focus-within:bg-white/[0.07]">
                                            <Lock
                                                size={18}
                                                className="mr-3 shrink-0 text-slate-500"
                                            />

                                            <input
                                                id="new-password"
                                                type="password"
                                                required
                                                minLength={6}
                                                autoComplete="new-password"
                                                value={password}
                                                onChange={(e) =>
                                                    setPassword(e.target.value)
                                                }
                                                placeholder="••••••••"
                                                className="min-w-0 flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-600"
                                            />
                                        </div>

                                        <p className="mt-2 text-xs text-slate-500">
                                            Use at least 6 characters.
                                        </p>
                                    </div>

                                    {/* Confirm password */}
                                    <div>
                                        <label
                                            htmlFor="confirm-password"
                                            className="mb-2 block text-sm text-slate-300"
                                        >
                                            Confirm new password
                                        </label>

                                        <div className="flex min-h-12 items-center rounded-xl border border-white/10 bg-white/5 px-4 transition focus-within:border-indigo-500/50 focus-within:bg-white/[0.07]">
                                            <Lock
                                                size={18}
                                                className="mr-3 shrink-0 text-slate-500"
                                            />

                                            <input
                                                id="confirm-password"
                                                type="password"
                                                required
                                                minLength={6}
                                                autoComplete="new-password"
                                                value={confirmPassword}
                                                onChange={(e) =>
                                                    setConfirmPassword(e.target.value)
                                                }
                                                placeholder="••••••••"
                                                className="min-w-0 flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-600"
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div
                                            role="alert"
                                            className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm leading-5 text-red-300"
                                        >
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <>
                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                Update Password
                                                <ArrowRight size={18} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>

                    <p className="mt-6 text-center text-xs text-slate-600">
                        FinPilot • Personal finance, made simple.
                    </p>
                </div>
            </div>
        </main>
    );
}