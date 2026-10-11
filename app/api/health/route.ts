import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/health
 *
 * Public endpoint — no auth required.
 * Used by UptimeRobot (or any uptime monitor) to:
 *   1. Keep the Vercel serverless function warm
 *   2. Ping the Supabase DB so it never hits the 7-day
 *      inactivity threshold on the free tier
 *
 * Returns 200 when DB is reachable, 503 when it's not.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        return NextResponse.json(
            { status: "error", message: "Missing environment variables." },
            { status: 503 }
        );
    }

    try {
        const supabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });

        // Lightweight query — just checks the DB is alive.
        const { error } = await supabase
            .from("user_preferences")
            .select("user_id")
            .limit(1);

        if (error) {
            console.error("Health check DB error:", error.message);
            return NextResponse.json(
                { status: "error", message: "Database unreachable.", detail: error.message },
                { status: 503 }
            );
        }

        return NextResponse.json({
            status: "ok",
            message: "FinPilot is running.",
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        console.error("Health check failed:", err);
        return NextResponse.json(
            { status: "error", message: "Unexpected error." },
            { status: 503 }
        );
    }
}
