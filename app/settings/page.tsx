"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    AlertTriangle,
    ArrowLeft,
    Bell,
    Bot,
    Check,
    ChevronRight,
    Eye,
    KeyRound,
    LayoutDashboard,
    Loader2,
    LogOut,
    Menu,
    Moon,
    Save,
    Settings as SettingsIcon,
    Shield,
    Trash2,
    User,
    Wallet,
    X,
} from "lucide-react";
import AuthGuard from "@/app/components/AuthGuard";
import { supabase } from "@/lib/supabase";

const navigation = [
    {
        name: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
    },
    {
        name: "Transactions",
        href: "/transactions",
        icon: Wallet,
    },
    {
        name: "Budgets",
        href: "/budgets",
        icon: ChevronRight,
    },
    {
        name: "Goals",
        href: "/goals",
        icon: ChevronRight,
    },
    {
        name: "Forecast",
        href: "/forecast",
        icon: ChevronRight,
    },
    {
        name: "AI Coach",
        href: "/ai-coach",
        icon: Bot,
    },
    {
        name: "Settings",
        href: "/settings",
        icon: SettingsIcon,
    },
];

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
                    : "hidden md:flex md:w-64 md:flex-col"
            }
        >
            <div className="flex h-full min-h-0 w-full flex-col border-r border-white/10 bg-slate-950">
                <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-4 sm:px-6">
                    <Link
                        href="/"
                        onClick={onClose}
                        className="flex min-w-0 items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
                            <Wallet size={20} />
                        </div>

                        <div className="min-w-0">
                            <h1 className="truncate text-lg font-bold text-white">
                                FinPilot
                            </h1>

                            <p className="truncate text-[10px] uppercase tracking-wider text-slate-500">
                                Personal Finance
                            </p>
                        </div>
                    </Link>

                    {mobile && (
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close navigation"
                            className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
                    <div className="space-y-1">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const active =
                                item.href === "/settings";

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={onClose}
                                    className={`flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${active
                                        ? "bg-indigo-500/15 text-indigo-400"
                                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                                        }`}
                                >
                                    <Icon
                                        size={18}
                                        className="shrink-0"
                                    />

                                    <span className="truncate">
                                        {item.name}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                <div className="shrink-0 border-t border-white/10 p-3 sm:p-4">
                    <Link
                        href="/ai-coach"
                        onClick={onClose}
                        className="block rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4 transition hover:bg-indigo-500/15 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                        <div className="mb-2 flex min-w-0 items-center gap-2">
                            <Bot
                                size={17}
                                className="shrink-0 text-indigo-400"
                            />

                            <span className="truncate text-sm font-semibold text-white">
                                AI Financial Coach
                            </span>
                        </div>

                        <p className="text-xs leading-5 text-slate-400">
                            Get personalized insights about your
                            spending and budget.
                        </p>

                        <div className="mt-3 flex items-center gap-1 text-xs font-medium text-indigo-400">
                            Open AI Coach
                            <ChevronRight size={13} />
                        </div>
                    </Link>
                </div>
            </div>
        </aside>
    );
}

function SettingToggle({
    enabled,
    onChange,
    label,
    disabled = false,
}: {
    enabled: boolean;
    onChange: (value: boolean) => void;
    label: string;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={() => onChange(!enabled)}
            disabled={disabled}
            aria-pressed={enabled}
            aria-label={`${enabled ? "Disable" : "Enable"} ${label}`}
            className={`relative h-7 w-12 shrink-0 rounded-full transition focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${enabled ? "bg-indigo-500" : "bg-slate-700"
                } ${disabled
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer"
                }`}
        >
            <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${enabled ? "left-6" : "left-1"
                    }`}
            />
        </button>
    );
}

function SettingsLoading() {
    return (
        <div className="min-h-[100dvh] overflow-x-hidden bg-slate-950 text-white">
            <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                <div className="mb-8">
                    <div className="h-8 w-48 animate-pulse rounded-lg bg-white/5" />

                    <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded bg-white/5" />
                </div>

                <div className="space-y-5 sm:space-y-6">
                    {[
                        "profile",
                        "security",
                        "ai",
                        "notifications",
                    ].map((item) => (
                        <div
                            key={item}
                            className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
                        >
                            <div className="border-b border-white/10 p-5 sm:p-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-white/5" />

                                    <div className="min-w-0 space-y-2">
                                        <div className="h-4 w-28 animate-pulse rounded bg-white/5" />

                                        <div className="h-3 w-48 max-w-[55vw] animate-pulse rounded bg-white/5" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 p-5 sm:p-6">
                                <div className="h-11 w-full animate-pulse rounded-xl bg-white/5" />
                                <div className="h-11 w-full animate-pulse rounded-xl bg-white/5" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function SettingsContent() {
    const [mobileMenuOpen, setMobileMenuOpen] =
        useState(false);

    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] =
        useState(false);
    const [changingPassword, setChangingPassword] =
        useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const [savingPreference, setSavingPreference] =
        useState<string | null>(null);

    const [preferenceError, setPreferenceError] =
        useState("");

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [createdAt, setCreatedAt] = useState("");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [profileMessage, setProfileMessage] =
        useState("");
    const [profileError, setProfileError] = useState("");

    const [passwordMessage, setPasswordMessage] =
        useState("");
    const [passwordError, setPasswordError] = useState("");

    const [aiInsights, setAiInsights] = useState(true);
    const [notifications, setNotifications] =
        useState(false);

    const [sendingTestEmail, setSendingTestEmail] =
        useState(false);

    const [testEmailMessage, setTestEmailMessage] =
        useState("");

    const [testEmailError, setTestEmailError] =
        useState("");

    // Delete account
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [deletingAccount, setDeletingAccount] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    useEffect(() => {
        let mounted = true;

        const loadSettings = async () => {
            try {
                const {
                    data: { user },
                    error: userError,
                } = await supabase.auth.getUser();

                if (userError) {
                    console.error(
                        "Failed to load user:",
                        userError
                    );
                    return;
                }

                if (!mounted || !user) {
                    return;
                }

                const name =
                    user.user_metadata?.full_name ||
                    user.user_metadata?.name ||
                    "";

                setFullName(name);
                setEmail(user.email || "");
                setCreatedAt(user.created_at || "");

                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (!session?.access_token) {
                    console.error(
                        "No active authentication session."
                    );
                    return;
                }

                const response = await fetch(
                    "/api/preferences",
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${session.access_token}`,
                        },
                    }
                );

                const responseText =
                    await response.text();

                let result: any = {};

                try {
                    result = responseText
                        ? JSON.parse(responseText)
                        : {};
                } catch {
                    result = {
                        error:
                            responseText ||
                            "Invalid server response.",
                    };
                }

                if (!response.ok) {
                    throw new Error(
                        result?.error ||
                        "Unable to load preferences."
                    );
                }

                if (!mounted) {
                    return;
                }

                setAiInsights(
                    result.preferences
                        ?.ai_insights_enabled ?? true
                );

                setNotifications(
                    result.preferences
                        ?.email_notifications_enabled ??
                    false
                );
            } catch (error) {
                console.error(
                    "Failed to load settings:",
                    error
                );

                if (mounted) {
                    setPreferenceError(
                        "Unable to load your saved preferences."
                    );
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        loadSettings();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (!mobileMenuOpen) {
            return;
        }

        const originalOverflow =
            document.body.style.overflow;

        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow =
                originalOverflow;
        };
    }, [mobileMenuOpen]);

    const updatePreference = async (
        field:
            | "ai_insights_enabled"
            | "email_notifications_enabled",
        value: boolean
    ) => {
        setPreferenceError("");

        setSavingPreference(field);

        const previousValue =
            field === "ai_insights_enabled"
                ? aiInsights
                : notifications;

        if (field === "ai_insights_enabled") {
            setAiInsights(value);
        } else {
            setNotifications(value);

            if (!value) {
                setTestEmailMessage("");
                setTestEmailError("");
            }
        }

        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session?.access_token) {
                throw new Error(
                    "Your session has expired. Please log in again."
                );
            }

            const response = await fetch(
                "/api/preferences",
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                        [field]: value,
                    }),
                }
            );

            const responseText =
                await response.text();

            let result: any = {};

            try {
                result = responseText
                    ? JSON.parse(responseText)
                    : {};
            } catch {
                result = {
                    error:
                        responseText ||
                        "Invalid server response.",
                };
            }

            if (!response.ok) {
                throw new Error(
                    result?.error ||
                    "Unable to save preference."
                );
            }
        } catch (error) {
            console.error(
                "Preference update failed:",
                error
            );

            if (field === "ai_insights_enabled") {
                setAiInsights(previousValue);
            } else {
                setNotifications(previousValue);
            }

            setPreferenceError(
                error instanceof Error
                    ? error.message
                    : "Unable to save your preference."
            );
        } finally {
            setSavingPreference(null);
        }
    };

    const handleSendTestEmail = async () => {
        setTestEmailMessage("");
        setTestEmailError("");

        if (!notifications) {
            setTestEmailError(
                "Enable Email notifications first."
            );
            return;
        }

        if (sendingTestEmail) {
            return;
        }

        setSendingTestEmail(true);

        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session?.access_token) {
                throw new Error(
                    "Your session has expired. Please log in again."
                );
            }

            const response = await fetch(
                "/api/notifications/test",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                }
            );

            const responseText =
                await response.text();

            let result: any = {};

            try {
                result = responseText
                    ? JSON.parse(responseText)
                    : {};
            } catch {
                result = {
                    error:
                        responseText ||
                        "Invalid server response.",
                };
            }

            if (!response.ok) {
                throw new Error(
                    result?.error ||
                    "Unable to send the test email."
                );
            }

            setTestEmailMessage(
                result?.message ||
                `Test email sent successfully to ${email}.`
            );
        } catch (error) {
            console.error(
                "Test email failed:",
                error
            );

            setTestEmailError(
                error instanceof Error
                    ? error.message
                    : "Unable to send the test email. Please try again."
            );
        } finally {
            setSendingTestEmail(false);
        }
    };

    const handleSaveProfile = async () => {
        setProfileMessage("");
        setProfileError("");

        const cleanName = fullName.trim();

        if (!cleanName) {
            setProfileError(
                "Please enter your full name."
            );
            return;
        }

        setSavingProfile(true);

        try {
            const { error } =
                await supabase.auth.updateUser({
                    data: {
                        full_name: cleanName,
                    },
                });

            if (error) {
                setProfileError(error.message);
                return;
            }

            setFullName(cleanName);

            setProfileMessage(
                "Profile updated successfully."
            );

            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (session?.access_token) {
                await fetch("/api/preferences", {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                        ai_insights_enabled:
                            aiInsights,
                        email_notifications_enabled:
                            notifications,
                        email:
                            email ||
                            "",
                        full_name:
                            cleanName,
                    }),
                });
            }
        } catch (error) {
            console.error(
                "Profile update failed:",
                error
            );

            setProfileError(
                "Unable to update your profile. Please try again."
            );
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword = async () => {
        setPasswordMessage("");
        setPasswordError("");

        if (!newPassword || !confirmPassword) {
            setPasswordError(
                "Please fill in both password fields."
            );
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError(
                "Password must contain at least 6 characters."
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError(
                "Passwords do not match."
            );
            return;
        }

        setChangingPassword(true);

        try {
            const { error } =
                await supabase.auth.updateUser({
                    password: newPassword,
                });

            if (error) {
                setPasswordError(error.message);
                return;
            }

            setNewPassword("");
            setConfirmPassword("");

            setPasswordMessage(
                "Password changed successfully."
            );
        } catch (error) {
            console.error(
                "Password update failed:",
                error
            );

            setPasswordError(
                "Unable to change your password. Please try again."
            );
        } finally {
            setChangingPassword(false);
        }
    };

    const handleLogout = async () => {
        if (loggingOut) {
            return;
        }

        setLoggingOut(true);

        try {
            const { error } =
                await supabase.auth.signOut();

            if (error) {
                console.error(
                    "Logout failed:",
                    error
                );

                setLoggingOut(false);
                return;
            }

            window.location.replace("/");
        } catch (error) {
            console.error(
                "Logout failed:",
                error
            );

            setLoggingOut(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deletingAccount) return;

        setDeleteError("");
        setDeletingAccount(true);

        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session?.access_token) {
                setDeleteError(
                    "Your session has expired. Please log in again."
                );
                return;
            }

            const response = await fetch("/api/account", {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            });

            const responseText = await response.text();
            let result: any = {};
            try {
                result = responseText ? JSON.parse(responseText) : {};
            } catch {
                result = { error: responseText || "Invalid server response." };
            }

            if (!response.ok) {
                setDeleteError(
                    result?.error ||
                    "Unable to delete your account. Please try again."
                );
                return;
            }

            // Sign out locally and redirect to landing page.
            await supabase.auth.signOut();
            window.location.replace("/");
        } catch (error) {
            console.error("Account deletion failed:", error);
            setDeleteError(
                "Something went wrong. Please try again or contact support."
            );
        } finally {
            setDeletingAccount(false);
        }
    };

    if (loading) {
        return <SettingsLoading />;
    }

    return (
        <div className="min-h-[100dvh] overflow-x-hidden bg-slate-950 text-white">
            <div className="flex min-h-[100dvh]">
                {/* Desktop sidebar */}
                <Sidebar />

                {/* Mobile sidebar */}
                {mobileMenuOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px] md:hidden"
                            onClick={() =>
                                setMobileMenuOpen(false)
                            }
                            aria-hidden="true"
                        />

                        <Sidebar
                            mobile
                            onClose={() =>
                                setMobileMenuOpen(false)
                            }
                        />
                    </>
                )}

                <main className="min-w-0 flex-1 overflow-x-hidden">
                    {/* Header */}
                    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
                        <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 sm:min-h-20 sm:px-6 lg:px-8">
                            <div className="flex min-w-0 items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setMobileMenuOpen(true)
                                    }
                                    aria-label="Open navigation"
                                    aria-expanded={
                                        mobileMenuOpen
                                    }
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 md:hidden"
                                >
                                    <Menu size={22} />
                                </button>

                                <div className="min-w-0">
                                    <p className="truncate text-lg font-semibold text-white">
                                        Settings
                                    </p>

                                    <p className="hidden truncate text-xs text-slate-500 sm:block">
                                        Manage your FinPilot account
                                    </p>
                                </div>
                            </div>

                            <Link
                                href="/"
                                className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            >
                                <ArrowLeft size={16} />

                                <span className="hidden sm:inline">
                                    Dashboard
                                </span>
                            </Link>
                        </div>
                    </header>

                    {/* Content */}
                    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                        <div className="mb-6 sm:mb-8">
                            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                                Account settings
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                                Manage your profile, security and
                                FinPilot preferences.
                            </p>
                        </div>

                        <div className="space-y-5 sm:space-y-6">
                            {/* Profile */}
                            <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                                <div className="border-b border-white/10 p-5 sm:p-6">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                                            <User size={19} />
                                        </div>

                                        <div className="min-w-0">
                                            <h2 className="font-semibold text-white">
                                                Profile
                                            </h2>

                                            <p className="mt-0.5 truncate text-xs text-slate-500">
                                                Your personal account
                                                information
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-5 p-5 sm:p-6">
                                    <div className="min-w-0">
                                        <label
                                            htmlFor="settings-fullName"
                                            className="mb-2 block text-sm font-medium text-slate-300"
                                        >
                                            Full name
                                        </label>

                                        <input
                                            id="settings-fullName"
                                            type="text"
                                            value={fullName}
                                            onChange={(event) =>
                                                setFullName(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Enter your full name"
                                            autoComplete="name"
                                            className="min-h-11 w-full min-w-0 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10"
                                        />
                                    </div>

                                    <div className="min-w-0">
                                        <label
                                            htmlFor="settings-email"
                                            className="mb-2 block text-sm font-medium text-slate-300"
                                        >
                                            Email address
                                        </label>

                                        <input
                                            id="settings-email"
                                            type="email"
                                            value={email}
                                            disabled
                                            className="min-h-11 w-full min-w-0 cursor-not-allowed rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-500"
                                        />

                                        <p className="mt-2 break-words text-xs leading-5 text-slate-600">
                                            Your login email cannot
                                            be changed here.
                                        </p>
                                    </div>

                                    {profileError && (
                                        <div
                                            role="alert"
                                            className="break-words rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm leading-5 text-rose-300"
                                        >
                                            {profileError}
                                        </div>
                                    )}

                                    {profileMessage && (
                                        <div
                                            role="status"
                                            className="flex items-start gap-2 break-words rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm leading-5 text-emerald-300"
                                        >
                                            <Check
                                                size={16}
                                                className="mt-0.5 shrink-0"
                                            />

                                            <span>
                                                {profileMessage}
                                            </span>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={handleSaveProfile}
                                        disabled={savingProfile}
                                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                    >
                                        <Save size={16} />

                                        {savingProfile
                                            ? "Saving..."
                                            : "Save profile"}
                                    </button>
                                </div>
                            </section>

                            {/* Security */}
                            <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                                <div className="border-b border-white/10 p-5 sm:p-6">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                                            <Shield size={19} />
                                        </div>

                                        <div className="min-w-0">
                                            <h2 className="font-semibold text-white">
                                                Password & Security
                                            </h2>

                                            <p className="mt-0.5 text-xs text-slate-500">
                                                Keep your FinPilot account
                                                secure
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-5 p-5 sm:p-6">
                                    <div className="grid min-w-0 gap-5 sm:grid-cols-2">
                                        <div className="min-w-0">
                                            <label
                                                htmlFor="newPassword"
                                                className="mb-2 block text-sm font-medium text-slate-300"
                                            >
                                                New password
                                            </label>

                                            <input
                                                id="newPassword"
                                                type="password"
                                                value={newPassword}
                                                onChange={(event) =>
                                                    setNewPassword(
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="At least 6 characters"
                                                autoComplete="new-password"
                                                className="min-h-11 w-full min-w-0 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10"
                                            />
                                        </div>

                                        <div className="min-w-0">
                                            <label
                                                htmlFor="confirmPassword"
                                                className="mb-2 block text-sm font-medium text-slate-300"
                                            >
                                                Confirm password
                                            </label>

                                            <input
                                                id="confirmPassword"
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(event) =>
                                                    setConfirmPassword(
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Repeat your new password"
                                                autoComplete="new-password"
                                                className="min-h-11 w-full min-w-0 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10"
                                            />
                                        </div>
                                    </div>

                                    {passwordError && (
                                        <div
                                            role="alert"
                                            className="break-words rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm leading-5 text-rose-300"
                                        >
                                            {passwordError}
                                        </div>
                                    )}

                                    {passwordMessage && (
                                        <div
                                            role="status"
                                            className="flex items-start gap-2 break-words rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm leading-5 text-emerald-300"
                                        >
                                            <Check
                                                size={16}
                                                className="mt-0.5 shrink-0"
                                            />

                                            <span>
                                                {passwordMessage}
                                            </span>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={
                                            handleChangePassword
                                        }
                                        disabled={
                                            changingPassword
                                        }
                                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                    >
                                        <KeyRound size={16} />

                                        {changingPassword
                                            ? "Changing password..."
                                            : "Change password"}
                                    </button>

                                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <Eye
                                                size={17}
                                                className="shrink-0 text-slate-500"
                                            />

                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-300">
                                                    Account created
                                                </p>

                                                <p className="mt-1 break-words text-xs text-slate-500">
                                                    {createdAt
                                                        ? new Date(
                                                            createdAt
                                                        ).toLocaleDateString(
                                                            "en-IN",
                                                            {
                                                                day: "2-digit",
                                                                month: "long",
                                                                year: "numeric",
                                                            }
                                                        )
                                                        : "Not available"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* AI Preferences */}
                            <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                                <div className="border-b border-white/10 p-5 sm:p-6">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                                            <Bot size={19} />
                                        </div>

                                        <div className="min-w-0">
                                            <h2 className="font-semibold text-white">
                                                AI Preferences
                                            </h2>

                                            <p className="mt-0.5 text-xs text-slate-500">
                                                Control how FinPilot AI
                                                works for you
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="divide-y divide-white/5">
                                    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-white">
                                                AI financial insights
                                            </p>

                                            <p className="mt-1 max-w-xl break-words text-xs leading-5 text-slate-500">
                                                Allow FinPilot to provide
                                                personalized spending and
                                                financial insights based on
                                                your transactions.
                                            </p>

                                            {preferenceError && (
                                                <p
                                                    role="alert"
                                                    className="mt-2 break-words text-xs leading-5 text-rose-400"
                                                >
                                                    {preferenceError}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex shrink-0 items-center gap-3">
                                            {savingPreference ===
                                                "ai_insights_enabled" && (
                                                    <Loader2
                                                        size={16}
                                                        className="animate-spin text-slate-500"
                                                    />
                                                )}

                                            <SettingToggle
                                                enabled={
                                                    aiInsights
                                                }
                                                onChange={(
                                                    value
                                                ) =>
                                                    updatePreference(
                                                        "ai_insights_enabled",
                                                        value
                                                    )
                                                }
                                                label="AI financial insights"
                                                disabled={
                                                    savingPreference !==
                                                    null
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Notifications */}
                            <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                                <div className="border-b border-white/10 p-5 sm:p-6">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
                                            <Bell size={19} />
                                        </div>

                                        <div className="min-w-0">
                                            <h2 className="font-semibold text-white">
                                                Notifications
                                            </h2>

                                            <p className="mt-0.5 text-xs text-slate-500">
                                                Manage notification
                                                preferences
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="divide-y divide-white/5">
                                    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-white">
                                                Email notifications
                                            </p>

                                            <p className="mt-1 max-w-xl break-words text-xs leading-5 text-slate-500">
                                                Receive important FinPilot
                                                updates and financial
                                                reminders by email.
                                            </p>

                                            {preferenceError && (
                                                <p
                                                    role="alert"
                                                    className="mt-2 break-words text-xs leading-5 text-rose-400"
                                                >
                                                    {preferenceError}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex shrink-0 items-center gap-3">
                                            {savingPreference ===
                                                "email_notifications_enabled" && (
                                                    <Loader2
                                                        size={16}
                                                        className="animate-spin text-slate-500"
                                                    />
                                                )}

                                            <SettingToggle
                                                enabled={
                                                    notifications
                                                }
                                                onChange={(
                                                    value
                                                ) =>
                                                    updatePreference(
                                                        "email_notifications_enabled",
                                                        value
                                                    )
                                                }
                                                label="email notifications"
                                                disabled={
                                                    savingPreference !==
                                                    null
                                                }
                                            />
                                        </div>
                                    </div>

                                    {/* Test email functionality */}
                                    <div className="flex flex-col gap-4 p-5 sm:p-6">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-white">
                                                Test email delivery
                                            </p>

                                            <p className="mt-1 max-w-xl break-words text-xs leading-5 text-slate-500">
                                                Send a test email to your
                                                FinPilot account email to
                                                verify that email
                                                notifications are working.
                                            </p>
                                        </div>

                                        {testEmailError && (
                                            <div
                                                role="alert"
                                                className="break-words rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm leading-5 text-rose-300"
                                            >
                                                {testEmailError}
                                            </div>
                                        )}

                                        {testEmailMessage && (
                                            <div
                                                role="status"
                                                className="flex items-start gap-2 break-words rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm leading-5 text-emerald-300"
                                            >
                                                <Check
                                                    size={16}
                                                    className="mt-0.5 shrink-0"
                                                />

                                                <span>
                                                    {testEmailMessage}
                                                </span>
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            onClick={
                                                handleSendTestEmail
                                            }
                                            disabled={
                                                !notifications ||
                                                sendingTestEmail ||
                                                savingPreference !== null
                                            }
                                            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                        >
                                            {sendingTestEmail ? (
                                                <Loader2
                                                    size={16}
                                                    className="animate-spin"
                                                />
                                            ) : (
                                                <Bell size={16} />
                                            )}

                                            {sendingTestEmail
                                                ? "Sending test email..."
                                                : "Send test email"}
                                        </button>
                                    </div>
                                </div>
                            </section>

                            {/* Appearance — unchanged */}
                            <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                                <div className="border-b border-white/10 p-5 sm:p-6">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-500/10 text-slate-300">
                                            <Moon size={19} />
                                        </div>

                                        <div className="min-w-0">
                                            <h2 className="font-semibold text-white">
                                                Appearance
                                            </h2>

                                            <p className="mt-0.5 text-xs text-slate-500">
                                                Choose how FinPilot looks
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 sm:p-6">
                                    <div className="flex flex-col gap-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <Moon
                                                size={18}
                                                className="shrink-0 text-indigo-400"
                                            />

                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-white">
                                                    Dark mode
                                                </p>

                                                <p className="mt-1 break-words text-xs leading-5 text-slate-500">
                                                    FinPilot currently uses
                                                    the dark interface.
                                                </p>
                                            </div>
                                        </div>

                                        <span className="w-fit shrink-0 rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-medium text-indigo-400">
                                            Active
                                        </span>
                                    </div>
                                </div>
                            </section>

                            {/* Account — Sign out */}
                            <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                                <div className="p-5 sm:p-6">
                                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0">
                                            <h2 className="font-semibold text-white">
                                                Account
                                            </h2>

                                            <p className="mt-1 break-words text-xs leading-5 text-slate-500">
                                                Sign out of FinPilot on this
                                                device.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            disabled={loggingOut}
                                            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                        >
                                            <LogOut size={17} />

                                            {loggingOut
                                                ? "Logging out..."
                                                : "Log out"}
                                        </button>
                                    </div>
                                </div>
                            </section>

                            {/* Danger zone — Delete account */}
                            <section className="overflow-hidden rounded-2xl border border-rose-500/20 bg-rose-500/[0.03]">
                                <div className="border-b border-rose-500/10 p-5 sm:p-6">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
                                            <AlertTriangle size={19} />
                                        </div>

                                        <div className="min-w-0">
                                            <h2 className="font-semibold text-white">
                                                Danger Zone
                                            </h2>

                                            <p className="mt-0.5 text-xs text-slate-500">
                                                Irreversible actions — proceed with care
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 sm:p-6">
                                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-white">
                                                Delete account
                                            </p>

                                            <p className="mt-1 max-w-lg break-words text-xs leading-5 text-slate-500">
                                                Permanently delete your FinPilot account and
                                                all associated data — transactions, budgets,
                                                goals, AI chat history, and preferences.
                                                This action{" "}
                                                <span className="font-medium text-rose-400">
                                                    cannot be undone
                                                </span>
                                                .
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDeleteConfirmText("");
                                                setDeleteError("");
                                                setShowDeleteModal(true);
                                            }}
                                            disabled={deletingAccount}
                                            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-5 py-3 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20 focus:outline-none focus:ring-2 focus:ring-rose-500/40 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                        >
                                            <Trash2 size={17} />
                                            Delete account
                                        </button>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <footer className="mt-8 border-t border-white/10 pb-2 pt-6 text-center">
                            <p className="break-words text-xs text-slate-600">
                                FinPilot • Personal finance, made
                                simple.
                            </p>
                        </footer>
                    </div>
                </main>
            </div>

            {/* ── Delete account confirmation modal ── */}
            {showDeleteModal && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                        aria-hidden="true"
                        onClick={() => {
                            if (!deletingAccount) {
                                setShowDeleteModal(false);
                            }
                        }}
                    />

                    {/* Dialog */}
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-modal-title"
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-rose-500/20 bg-slate-900 shadow-2xl shadow-black/60">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-6">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
                                        <Trash2 size={19} />
                                    </div>

                                    <div className="min-w-0">
                                        <h3
                                            id="delete-modal-title"
                                            className="font-semibold text-white"
                                        >
                                            Delete your account
                                        </h3>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            This cannot be undone
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={deletingAccount}
                                    aria-label="Close dialog"
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/5 hover:text-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="space-y-4 p-5 sm:p-6">
                                <div className="rounded-xl border border-rose-500/15 bg-rose-500/[0.07] p-4">
                                    <p className="text-sm leading-6 text-rose-200">
                                        <span className="font-semibold">Warning:</span> All
                                        your data will be permanently erased — transactions,
                                        budgets, goals, AI chat history, and account
                                        preferences. Your email{" "}
                                        <span className="font-medium text-white">
                                            {email}
                                        </span>{" "}
                                        will be freed from FinPilot immediately.
                                    </p>
                                </div>

                                <div className="min-w-0">
                                    <label
                                        htmlFor="delete-confirm-input"
                                        className="mb-2 block text-sm font-medium text-slate-300"
                                    >
                                        Type{" "}
                                        <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-rose-300">
                                            DELETE
                                        </span>{" "}
                                        to confirm
                                    </label>

                                    <input
                                        id="delete-confirm-input"
                                        type="text"
                                        value={deleteConfirmText}
                                        onChange={(e) => {
                                            setDeleteConfirmText(e.target.value);
                                            setDeleteError("");
                                        }}
                                        placeholder="DELETE"
                                        autoComplete="off"
                                        spellCheck={false}
                                        disabled={deletingAccount}
                                        className="min-h-11 w-full min-w-0 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 font-mono text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-rose-500/40 focus:ring-2 focus:ring-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>

                                {deleteError && (
                                    <div
                                        role="alert"
                                        className="break-words rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm leading-5 text-rose-300"
                                    >
                                        {deleteError}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex flex-col-reverse gap-2.5 border-t border-white/10 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={deletingAccount}
                                    className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleDeleteAccount}
                                    disabled={
                                        deleteConfirmText !== "DELETE" ||
                                        deletingAccount
                                    }
                                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                                >
                                    {deletingAccount ? (
                                        <>
                                            <Loader2
                                                size={16}
                                                className="animate-spin"
                                            />
                                            Deleting account...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={16} />
                                            Yes, delete my account
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default function SettingsPage() {
    return (
        <AuthGuard>
            <SettingsContent />
        </AuthGuard>
    );
}