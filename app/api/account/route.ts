import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

function getAccessToken(request: NextRequest): string | null {
    const authorization = request.headers.get("authorization");
    if (!authorization) return null;
    const [scheme, token] = authorization.split(" ");
    if (scheme?.toLowerCase() !== "bearer" || !token) return null;
    return token;
}

async function getAuthenticatedUser(request: NextRequest) {
    const token = getAccessToken(request);
    if (!token) {
        return { user: null, error: "Missing authentication token." };
    }

    const {
        data: { user },
        error,
    } = await adminSupabase.auth.getUser(token);

    if (error || !user) {
        return { user: null, error: "Invalid or expired authentication session." };
    }

    return { user, error: null };
}

/**
 * DELETE /api/account
 *
 * Permanently deletes all user data and then removes the auth user.
 * Tables are deleted in dependency order (children before parents).
 * The auth user deletion is performed last via the admin API so it
 * succeeds even if a table delete partially fails.
 */
export async function DELETE(request: NextRequest) {
    try {
        const { user, error: authError } = await getAuthenticatedUser(request);

        if (!user) {
            return NextResponse.json(
                { error: authError || "Unauthorized." },
                { status: 401 }
            );
        }

        const userId = user.id;
        const errors: string[] = [];

        // Delete user data from all application tables.
        // Order matters: delete dependent rows first.
        const tables = [
            "ai_chat_messages",
            "transactions",
            "budgets",
            "goals",
            "user_preferences",
        ];

        for (const table of tables) {
            const { error } = await adminSupabase
                .from(table)
                .delete()
                .eq("user_id", userId);

            if (error) {
                // Log but continue — we still want to attempt the auth deletion.
                console.error(`Failed to delete from ${table}:`, error.message);
                errors.push(table);
            }
        }

        // Delete the auth user. This is irreversible.
        const { error: deleteUserError } =
            await adminSupabase.auth.admin.deleteUser(userId);

        if (deleteUserError) {
            console.error("Failed to delete auth user:", deleteUserError.message);
            return NextResponse.json(
                {
                    error:
                        "Your data was partially removed, but we could not delete your account. Please contact support.",
                },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Account DELETE error:", error);
        return NextResponse.json(
            { error: "An unexpected error occurred. Please try again." },
            { status: 500 }
        );
    }
}
