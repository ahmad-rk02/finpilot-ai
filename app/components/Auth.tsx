"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    Eye,
    EyeOff,
    Lock,
    Mail,
    User,
    Wallet,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type AuthMode = "login" | "signup" | "forgot";

export default function Auth() {
    const router = useRouter();

    const [mode, setMode] = useState<AuthMode>("login");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState<
        "google" | "github" | null
    >(null);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const clearMessages = () => {
        setMessage("");
        setError("");
    };

    const changeMode = (newMode: AuthMode) => {
        clearMessages();
        setMode(newMode);
        setPassword("");
        setConfirmPassword("");
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    const validateEmail = (value: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    };

    const handleOAuthLogin = async (
        provider: "google" | "github"
    ) => {
        clearMessages();
        setOauthLoading(provider);

        try {
            const { error: oauthError } =
                await supabase.auth.signInWithOAuth({
                    provider,
                    options: {
                        redirectTo: window.location.origin,
                    },
                });

            if (oauthError) {
                throw oauthError;
            }
        } catch (err) {
            console.error(`${provider} OAuth error:`, err);

            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError(
                    `Unable to continue with ${provider}. Please try again.`
                );
            }

            setOauthLoading(null);
        }
    };

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();
        clearMessages();

        const cleanEmail = email.trim().toLowerCase();

        if (!cleanEmail) {
            setError("Please enter your email address.");
            return;
        }

        if (!validateEmail(cleanEmail)) {
            setError("Please enter a valid email address.");
            return;
        }

        setLoading(true);

        try {
            // --------------------------------------------------
            // FORGOT PASSWORD
            // --------------------------------------------------

            if (mode === "forgot") {
                const redirectTo =
                    `${window.location.origin}/reset-password`;

                const { error: resetError } =
                    await supabase.auth.resetPasswordForEmail(
                        cleanEmail,
                        {
                            redirectTo,
                        }
                    );

                if (resetError) {
                    throw resetError;
                }

                setMessage(
                    "If an account exists for this email, a password reset link has been sent. Please check your inbox."
                );

                return;
            }

            // --------------------------------------------------
            // SIGN UP
            // --------------------------------------------------

            if (mode === "signup") {
                if (!fullName.trim()) {
                    setError("Please enter your full name.");
                    return;
                }

                if (password.length < 6) {
                    setError(
                        "Password must be at least 6 characters."
                    );
                    return;
                }

                if (password !== confirmPassword) {
                    setError("Passwords do not match.");
                    return;
                }

                const {
                    data: signupData,
                    error: signupError,
                } = await supabase.auth.signUp({
                    email: cleanEmail,
                    password,
                    options: {
                        data: {
                            full_name: fullName.trim(),
                        },
                    },
                });

                if (signupError) {
                    const errorMessage =
                        signupError.message.toLowerCase();

                    if (
                        errorMessage.includes("already registered") ||
                        errorMessage.includes("already exists") ||
                        errorMessage.includes(
                            "user already registered"
                        )
                    ) {
                        setError(
                            "An account with this email already exists. Please sign in instead."
                        );
                    } else {
                        setError(signupError.message);
                    }

                    return;
                }

                if (
                    signupData.user &&
                    Array.isArray(signupData.user.identities) &&
                    signupData.user.identities.length === 0
                ) {
                    setError(
                        "An account with this email already exists. Please sign in instead."
                    );
                    return;
                }

                if (signupData.user && !signupData.session) {
                    setMessage(
                        "Account created successfully. Please check your email to confirm your account."
                    );

                    setPassword("");
                    setConfirmPassword("");

                    return;
                }

                if (signupData.session) {
                    router.replace("/");
                    router.refresh();
                    return;
                }

                setMessage(
                    "Account created successfully. Please check your email to continue."
                );

                setPassword("");
                setConfirmPassword("");

                return;
            }

            // --------------------------------------------------
            // LOGIN
            // --------------------------------------------------

            if (!password) {
                setError("Please enter your password.");
                return;
            }

            const {
                data: loginData,
                error: loginError,
            } = await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password,
            });

            if (loginError) {
                const errorMessage =
                    loginError.message.toLowerCase();

                if (
                    errorMessage.includes(
                        "invalid login credentials"
                    ) ||
                    errorMessage.includes("invalid credentials")
                ) {
                    setError("Incorrect email or password.");
                } else if (
                    errorMessage.includes("email not confirmed")
                ) {
                    setError(
                        "Your email is not confirmed yet. Please check your inbox and confirm your email before signing in."
                    );
                } else {
                    setError(loginError.message);
                }

                return;
            }

            if (!loginData.session || !loginData.user) {
                setError(
                    "Login completed, but no active session was found. Please try again."
                );
                return;
            }

            router.replace("/");
            router.refresh();
        } catch (err) {
            console.error("Authentication error:", err);

            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError(
                    "Something went wrong. Please try again."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const isLogin = mode === "login";
    const isSignup = mode === "signup";
    const isForgot = mode === "forgot";

    const anyLoading =
        loading || oauthLoading !== null;

    return (
        <main className="min-h-[100dvh] overflow-x-hidden bg-slate-950 px-3 py-6 text-white sm:px-4 sm:py-8">
            <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-md items-center justify-center sm:min-h-[calc(100dvh-4rem)]">
                <div className="w-full min-w-0">
                    {/* Logo */}
                    <div className="mb-6 text-center sm:mb-8">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-500/20 sm:mb-4 sm:h-14 sm:w-14">
                            <Wallet
                                size={24}
                                className="sm:h-7 sm:w-7"
                            />
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            FinPilot
                        </h1>

                        <p className="mx-auto mt-1.5 max-w-xs text-sm leading-5 text-slate-400 sm:mt-2">
                            Your AI-powered financial co-pilot
                        </p>
                    </div>

                    {/* Card */}
                    <div className="w-full min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-2xl shadow-black/20 sm:p-6">
                        {/* Header */}
                        {isForgot ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() =>
                                        changeMode("login")
                                    }
                                    disabled={anyLoading}
                                    className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-lg text-sm text-slate-400 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50 sm:mb-5"
                                >
                                    <ArrowLeft size={16} />
                                    Back to sign in
                                </button>

                                <h2 className="text-lg font-semibold sm:text-xl">
                                    Reset your password
                                </h2>

                                <p className="mt-1 text-sm leading-5 text-slate-400">
                                    Enter your email and we'll send
                                    you a password reset link.
                                </p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-lg font-semibold sm:text-xl">
                                    {isLogin
                                        ? "Welcome back"
                                        : "Create your account"}
                                </h2>

                                <p className="mt-1 text-sm leading-5 text-slate-400">
                                    {isLogin
                                        ? "Sign in to continue to FinPilot."
                                        : "Start tracking your finances with FinPilot."}
                                </p>
                            </>
                        )}

                        {/* Error */}
                        {error && (
                            <div
                                role="alert"
                                className="mt-4 overflow-hidden break-words rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-3 text-sm leading-5 text-red-300 sm:mt-5 sm:px-4"
                            >
                                {error}
                            </div>
                        )}

                        {/* Success message */}
                        {message && (
                            <div
                                role="status"
                                className="mt-4 overflow-hidden break-words rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-3 text-sm leading-5 text-emerald-300 sm:mt-5 sm:px-4"
                            >
                                {message}
                            </div>
                        )}

                        {/* OAuth */}
                        {!isForgot && (
                            <>
                                <div className="mt-5 grid grid-cols-1 gap-2.5 min-[380px]:grid-cols-2 sm:mt-6 sm:gap-3">
                                    {/* Google */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleOAuthLogin(
                                                "google"
                                            )
                                        }
                                        disabled={anyLoading}
                                        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {oauthLoading ===
                                            "google" ? (
                                            <span className="text-xs">
                                                Connecting...
                                            </span>
                                        ) : (
                                            <>
                                                <span className="text-base font-bold">
                                                    G
                                                </span>
                                                <span>
                                                    Google
                                                </span>
                                            </>
                                        )}
                                    </button>

                                    {/* GitHub */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleOAuthLogin(
                                                "github"
                                            )
                                        }
                                        disabled={anyLoading}
                                        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {oauthLoading ===
                                            "github" ? (
                                            <span className="text-xs">
                                                Connecting...
                                            </span>
                                        ) : (
                                            <>
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    className="h-[18px] w-[18px] shrink-0 fill-current"
                                                    aria-hidden="true"
                                                >
                                                    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55v-2.01c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.73-1.52-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.47.11-3.06 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.77.11 3.06.73.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.07.78 2.16v3.2c0 .31.2.66.79.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5Z" />
                                                </svg>
                                                <span>
                                                    GitHub
                                                </span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Divider */}
                                <div className="my-5 flex items-center gap-3 sm:my-6">
                                    <div className="h-px min-w-0 flex-1 bg-white/10" />

                                    <span className="shrink-0 text-[11px] text-slate-500 sm:text-xs">
                                        OR
                                    </span>

                                    <div className="h-px min-w-0 flex-1 bg-white/10" />
                                </div>
                            </>
                        )}

                        {/* Form */}
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-4"
                        >
                            {/* Full Name */}
                            {isSignup && (
                                <div className="min-w-0">
                                    <label
                                        htmlFor="fullName"
                                        className="mb-2 block text-sm text-slate-300"
                                    >
                                        Full name
                                    </label>

                                    <div className="flex min-w-0 items-center rounded-xl border border-white/10 bg-white/5 px-3.5 transition focus-within:border-indigo-400/40 focus-within:ring-2 focus-within:ring-indigo-500/10 sm:px-4">
                                        <User
                                            size={18}
                                            className="mr-3 shrink-0 text-slate-500"
                                        />

                                        <input
                                            id="fullName"
                                            type="text"
                                            required
                                            value={fullName}
                                            onChange={(event) => {
                                                setFullName(
                                                    event.target.value
                                                );
                                                clearMessages();
                                            }}
                                            placeholder="Your name"
                                            autoComplete="name"
                                            disabled={anyLoading}
                                            className="min-w-0 w-full bg-transparent py-3 outline-none placeholder:text-slate-600 disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Email */}
                            <div className="min-w-0">
                                <label
                                    htmlFor="email"
                                    className="mb-2 block text-sm text-slate-300"
                                >
                                    Email
                                </label>

                                <div className="flex min-w-0 items-center rounded-xl border border-white/10 bg-white/5 px-3.5 transition focus-within:border-indigo-400/40 focus-within:ring-2 focus-within:ring-indigo-500/10 sm:px-4">
                                    <Mail
                                        size={18}
                                        className="mr-3 shrink-0 text-slate-500"
                                    />

                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(event) => {
                                            setEmail(
                                                event.target.value
                                            );
                                            clearMessages();
                                        }}
                                        placeholder="you@example.com"
                                        autoComplete="email"
                                        inputMode="email"
                                        disabled={anyLoading}
                                        className="min-w-0 w-full bg-transparent py-3 outline-none placeholder:text-slate-600 disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            {!isForgot && (
                                <div className="min-w-0">
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <label
                                            htmlFor="password"
                                            className="text-sm text-slate-300"
                                        >
                                            Password
                                        </label>

                                        {isLogin && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    changeMode(
                                                        "forgot"
                                                    )
                                                }
                                                disabled={anyLoading}
                                                className="shrink-0 rounded-md text-xs text-indigo-300 transition hover:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Forgot password?
                                            </button>
                                        )}
                                    </div>

                                    <div className="relative flex min-w-0 items-center rounded-xl border border-white/10 bg-white/5 px-3.5 transition focus-within:border-indigo-400/40 focus-within:ring-2 focus-within:ring-indigo-500/10 sm:px-4">
                                        <Lock
                                            size={18}
                                            className="mr-3 shrink-0 text-slate-500"
                                        />

                                        <input
                                            id="password"
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            required
                                            minLength={6}
                                            value={password}
                                            onChange={(event) => {
                                                setPassword(
                                                    event.target.value
                                                );
                                                clearMessages();
                                            }}
                                            placeholder="••••••••"
                                            autoComplete={
                                                isLogin
                                                    ? "current-password"
                                                    : "new-password"
                                            }
                                            disabled={anyLoading}
                                            className="min-w-0 w-full bg-transparent py-3 pr-10 outline-none placeholder:text-slate-600 disabled:opacity-50"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(
                                                    (value) => !value
                                                )
                                            }
                                            disabled={anyLoading}
                                            className="absolute right-2.5 flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/5 hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
                                            aria-label={
                                                showPassword
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
                                        >
                                            {showPassword ? (
                                                <EyeOff size={18} />
                                            ) : (
                                                <Eye size={18} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Confirm Password */}
                            {isSignup && (
                                <div className="min-w-0">
                                    <label
                                        htmlFor="confirmPassword"
                                        className="mb-2 block text-sm text-slate-300"
                                    >
                                        Confirm password
                                    </label>

                                    <div className="relative flex min-w-0 items-center rounded-xl border border-white/10 bg-white/5 px-3.5 transition focus-within:border-indigo-400/40 focus-within:ring-2 focus-within:ring-indigo-500/10 sm:px-4">
                                        <Lock
                                            size={18}
                                            className="mr-3 shrink-0 text-slate-500"
                                        />

                                        <input
                                            id="confirmPassword"
                                            type={
                                                showConfirmPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            required
                                            minLength={6}
                                            value={confirmPassword}
                                            onChange={(event) => {
                                                setConfirmPassword(
                                                    event.target.value
                                                );
                                                clearMessages();
                                            }}
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                            disabled={anyLoading}
                                            className="min-w-0 w-full bg-transparent py-3 pr-10 outline-none placeholder:text-slate-600 disabled:opacity-50"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowConfirmPassword(
                                                    (value) => !value
                                                )
                                            }
                                            disabled={anyLoading}
                                            className="absolute right-2.5 flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/5 hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
                                            aria-label={
                                                showConfirmPassword
                                                    ? "Hide confirm password"
                                                    : "Show confirm password"
                                            }
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff size={18} />
                                            ) : (
                                                <Eye size={18} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={anyLoading}
                                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 font-medium transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading
                                    ? "Please wait..."
                                    : isForgot
                                        ? "Send Reset Link"
                                        : isLogin
                                            ? "Sign In"
                                            : "Create Account"}

                                {!loading && (
                                    <ArrowRight size={18} />
                                )}
                            </button>
                        </form>

                        {/* Bottom navigation */}
                        {!isForgot && (
                            <div className="mt-5 text-center text-sm leading-5 text-slate-400 sm:mt-6">
                                <span>
                                    {isLogin
                                        ? "Don't have an account?"
                                        : "Already have an account?"}
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        changeMode(
                                            isLogin
                                                ? "signup"
                                                : "login"
                                        )
                                    }
                                    disabled={anyLoading}
                                    className="ml-2 rounded-md font-medium text-indigo-300 transition hover:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isLogin
                                        ? "Create account"
                                        : "Sign in"}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Small-screen footer */}
                    <p className="mt-5 px-4 text-center text-[11px] leading-4 text-slate-600 sm:mt-6 sm:text-xs">
                        Secure authentication powered by
                        Supabase.
                    </p>
                </div>
            </div>
        </main>
    );
}