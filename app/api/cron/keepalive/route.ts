import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/cron/keepalive
 *
 * Runs daily via Vercel Cron to prevent Supabase free-tier projects
 * from pausing due to inactivity (7-day idle threshold).
 *
 * Secured with CRON_SECRET — Vercel sends the Authorization header
 * automatically when configured in vercel.json.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const cronSecret = process.env.CRON_SECRET;
    const authorization = request.headers.get("authorization");

    if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        return NextResponse.json(
            { error: "Missing Supabase environment variables." },
            { status: 500 }
        );
    }

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    // A lightweight query — just checks the DB is reachable.
    const { error } = await adminSupabase
        .from("user_preferences")
        .select("user_id")
        .limit(1);

    if (error) {
        console.error("Keepalive DB ping failed:", error.message);
        return NextResponse.json(
            { error: "Database ping failed.", detail: error.message },
            { status: 500 }
        );
    }

    return NextResponse.json({
        success: true,
        message: "Supabase keepalive ping successful.",
        timestamp: new Date().toISOString(),
    });
}
