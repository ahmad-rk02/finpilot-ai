"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import { supabase } from "@/lib/supabase";

type AuthGuardProps = {
    children: ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
    const router = useRouter();
    const pathname = usePathname();

    const [checkingAuth, setCheckingAuth] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        let mounted = true;

        const checkSession = async () => {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (!mounted) return;

                if (!session) {
                    setAuthenticated(false);
                    router.replace("/");
                    return;
                }

                setAuthenticated(true);
                setCheckingAuth(false);
            } catch (error) {
                console.error("AuthGuard session check failed:", error);

                if (!mounted) return;

                setAuthenticated(false);
                router.replace("/");
            }
        };

        checkSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (!mounted) return;

            if (!session) {
                setAuthenticated(false);
                setCheckingAuth(false);

                if (pathname !== "/") {
                    router.replace("/");
                }

                return;
            }

            if (
                event === "SIGNED_IN" ||
                event === "INITIAL_SESSION" ||
                event === "TOKEN_REFRESHED" ||
                event === "USER_UPDATED"
            ) {
                setAuthenticated(true);
                setCheckingAuth(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [router, pathname]);

    if (checkingAuth || !authenticated) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950">
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15">
                        <Wallet
                            size={24}
                            className="animate-pulse text-indigo-400"
                        />
                    </div>

                    <p className="text-sm text-slate-400">
                        Checking your session...
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}