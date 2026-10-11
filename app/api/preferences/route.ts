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

const adminSupabase = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

const allowedFields = [
    "ai_insights_enabled",
    "email_notifications_enabled",
    "budget_alerts",
    "overspending_alerts",
    "goal_reminders",
    "weekly_summary",
    "monthly_summary",
] as const;

type PreferenceField = (typeof allowedFields)[number];

function getAccessToken(request: NextRequest) {
    const authorization =
        request.headers.get("authorization");

    if (!authorization) {
        return null;
    }

    const [scheme, token] = authorization.split(" ");

    if (
        scheme?.toLowerCase() !== "bearer" ||
        !token
    ) {
        return null;
    }

    return token;
}

async function getAuthenticatedUser(
    request: NextRequest
) {
    const token = getAccessToken(request);

    if (!token) {
        return {
            user: null,
            error: "Missing authentication token.",
        };
    }

    const {
        data: { user },
        error,
    } = await adminSupabase.auth.getUser(token);

    if (error || !user) {
        return {
            user: null,
            error: "Invalid or expired authentication session.",
        };
    }

    return {
        user,
        error: null,
    };
}

export async function GET(request: NextRequest) {
    try {
        const { user, error: authError } =
            await getAuthenticatedUser(request);

        if (!user) {
            return NextResponse.json(
                {
                    error:
                        authError ||
                        "Unauthorized.",
                },
                { status: 401 }
            );
        }

        const { data, error } =
            await adminSupabase
                .from("user_preferences")
                .select(
                    `
                    ai_insights_enabled,
                    email_notifications_enabled,
                    budget_alerts,
                    overspending_alerts,
                    goal_reminders,
                    weekly_summary,
                    monthly_summary
                `
                )
                .eq("user_id", user.id)
                .maybeSingle();

        if (error) {
            console.error(
                "Failed to load preferences:",
                error
            );

            return NextResponse.json(
                {
                    error:
                        "Unable to load your preferences.",
                },
                { status: 500 }
            );
        }

        const preferences = {
            ai_insights_enabled:
                data?.ai_insights_enabled ?? true,

            email_notifications_enabled:
                data?.email_notifications_enabled ??
                false,

            budget_alerts:
                data?.budget_alerts ?? true,

            overspending_alerts:
                data?.overspending_alerts ?? true,

            goal_reminders:
                data?.goal_reminders ?? true,

            weekly_summary:
                data?.weekly_summary ?? true,

            monthly_summary:
                data?.monthly_summary ?? true,
        };

        return NextResponse.json({
            preferences,
        });
    } catch (error) {
        console.error(
            "Preferences GET error:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "An unexpected error occurred.",
            },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest
) {
    try {
        const { user, error: authError } =
            await getAuthenticatedUser(request);

        if (!user) {
            return NextResponse.json(
                {
                    error:
                        authError ||
                        "Unauthorized.",
                },
                { status: 401 }
            );
        }

        let body: Record<string, unknown>;

        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                {
                    error:
                        "Invalid request body.",
                },
                { status: 400 }
            );
        }

        const updateData: Record<
            string,
            boolean | string
        > = {};

        for (const field of allowedFields) {
            const value = body[field];

            if (value !== undefined) {
                if (typeof value !== "boolean") {
                    return NextResponse.json(
                        {
                            error: `${field} must be a boolean.`,
                        },
                        { status: 400 }
                    );
                }

                updateData[field] = value;
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                {
                    error:
                        "No valid preference changes were provided.",
                },
                { status: 400 }
            );
        }

        updateData.email = user.email || "";

        updateData.full_name =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            "";

        const { data, error } =
            await adminSupabase
                .from("user_preferences")
                .upsert(
                    {
                        user_id: user.id,
                        ...updateData,
                        updated_at:
                            new Date().toISOString(),
                    },
                    {
                        onConflict: "user_id",
                    }
                )
                .select(
                    `
                    ai_insights_enabled,
                    email_notifications_enabled,
                    budget_alerts,
                    overspending_alerts,
                    goal_reminders,
                    weekly_summary,
                    monthly_summary
                `
                )
                .single();

        if (error) {
            console.error(
                "Failed to save preferences:",
                error
            );

            return NextResponse.json(
                {
                    error:
                        "Unable to save your preferences.",
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            preferences: data,
        });
    } catch (error) {
        console.error(
            "Preferences PATCH error:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "An unexpected error occurred.",
            },
            { status: 500 }
        );
    }
}