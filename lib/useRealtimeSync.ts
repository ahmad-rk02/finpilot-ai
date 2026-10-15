/**
 * useRealtimeSync
 *
 * Subscribes to Supabase Realtime on one or more tables
 * (filtered by the current user's id) and calls `onRefresh`
 * whenever any INSERT, UPDATE or DELETE arrives.
 *
 * Usage:
 *   useRealtimeSync({ userId, tables: ["transactions", "budgets"], onRefresh: loadData });
 *
 * - The subscription is torn down automatically on unmount or when userId changes.
 * - Multiple tables share a single channel to minimise connections.
 * - Safe to call with userId = null — no subscription is created until it is set.
 */

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

type UseRealtimeSyncOptions = {
    /** Authenticated user id. Pass null/undefined while auth is loading. */
    userId: string | null | undefined;
    /** Supabase table names to watch. */
    tables: string[];
    /** Called when any subscribed table has a change. Re-fetch your data here. */
    onRefresh: () => void;
};

export function useRealtimeSync({
    userId,
    tables,
    onRefresh,
}: UseRealtimeSyncOptions): void {
    useEffect(() => {
        if (!userId || tables.length === 0) return;

        // One channel per hook instance, named uniquely per user + table set
        const channelName = `realtime-sync:${userId}:${tables.join(",")}`;
        const channel = supabase.channel(channelName);

        for (const table of tables) {
            channel.on(
                "postgres_changes" as any,
                {
                    event: "*", // INSERT | UPDATE | DELETE
                    schema: "public",
                    table,
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    onRefresh();
                }
            );
        }

        channel.subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
        // onRefresh is intentionally excluded — callers should wrap it in useCallback
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, tables.join(",")]);
}
