import { NextResponse } from "next/server";
import { sendBrevoEmail } from "@/lib/notifications";
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

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get("authorization");

        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Unauthorized." },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);

        const {
            data: { user },
            error: userError,
        } = await adminSupabase.auth.getUser(token);

        if (userError || !user) {
            return NextResponse.json(
                { error: "Invalid or expired session." },
                { status: 401 }
            );
        }

        const email = user.email;

        if (!email) {
            return NextResponse.json(
                {
                    error:
                        "Your account does not have an email address.",
                },
                { status: 400 }
            );
        }

        const fullName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            "there";

        const firstName =
            typeof fullName === "string"
                ? fullName.split(" ")[0]
                : "there";

        await sendBrevoEmail({
            to: email,
            name: fullName,
            subject: "FinPilot email notifications are working!",
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <title>FinPilot Test Email</title>
                </head>

                <body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;">
                    <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
                        
                        <h1 style="margin:0 0 16px;color:#111827;">
                            FinPilot
                        </h1>

                        <p style="font-size:16px;color:#374151;">
                            Hi ${escapeHtml(firstName)},
                        </p>

                        <p style="font-size:16px;line-height:1.6;color:#374151;">
                            This is a test email from FinPilot.
                            Your email notification system is connected
                            successfully.
                        </p>

                        <div style="margin:24px 0;padding:16px;background:#f3f4f6;border-radius:10px;">
                            <strong style="color:#111827;">
                                ✓ Brevo connection successful
                            </strong>
                            <br />
                            <span style="color:#4b5563;">
                                FinPilot can now send transactional emails.
                            </span>
                        </div>

                        <p style="font-size:14px;color:#6b7280;">
                            You can now receive future FinPilot alerts,
                            reminders and financial summaries.
                        </p>

                        <p style="margin-top:28px;font-size:14px;color:#6b7280;">
                            — FinPilot
                        </p>
                    </div>
                </body>
                </html>
            `,
            text: `
FinPilot

Hi ${firstName},

This is a test email from FinPilot.

Your email notification system is connected successfully.

✓ Brevo connection successful

FinPilot can now send transactional emails.

You can now receive future FinPilot alerts, reminders and financial summaries.

— FinPilot
            `.trim(),
            tags: ["finpilot", "test-email"],
        });

        return NextResponse.json({
            success: true,
            message: `Test email sent to ${email}.`,
        });
    } catch (error) {
        console.error("Test email error:", error);

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to send test email.",
            },
            { status: 500 }
        );
    }
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}