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

type SendEmailArgs = {
    to: string;
    name?: string | null;
    subject: string;
    html: string;
    text: string;
    tags?: string[];
};

export async function sendBrevoEmail({
    to,
    name,
    subject,
    html,
    text,
    tags = ["finpilot"],
}: SendEmailArgs) {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const senderName =
        process.env.BREVO_SENDER_NAME || "FinPilot";

    if (!apiKey) {
        throw new Error("Missing BREVO_API_KEY");
    }

    if (!senderEmail) {
        throw new Error("Missing BREVO_SENDER_EMAIL");
    }

    const response = await fetch(
        "https://api.brevo.com/v3/smtp/email",
        {
            method: "POST",
            headers: {
                accept: "application/json",
                "api-key": apiKey,
                "content-type": "application/json",
            },
            body: JSON.stringify({
                sender: {
                    name: senderName,
                    email: senderEmail,
                },
                to: [
                    {
                        email: to,
                        ...(name ? { name } : {}),
                    },
                ],
                subject,
                htmlContent: html,
                textContent: text,
                tags,
            }),
        }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(
            data?.message ||
            data?.code ||
            "Brevo email request failed."
        );
    }

    return data;
}

export async function wasNotificationSent(
    userId: string,
    notificationType: string,
    referenceKey: string
) {
    const { data, error } = await adminSupabase
        .from("notification_log")
        .select("id")
        .eq("user_id", userId)
        .eq("notification_type", notificationType)
        .eq("reference_key", referenceKey)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return Boolean(data);
}

export async function markNotificationSent({
    userId,
    notificationType,
    referenceKey,
    subject,
    email,
}: {
    userId: string;
    notificationType: string;
    referenceKey: string;
    subject: string;
    email: string;
}) {
    const { error } = await adminSupabase
        .from("notification_log")
        .upsert(
            {
                user_id: userId,
                notification_type: notificationType,
                reference_key: referenceKey,
                subject,
                email,
            },
            {
                onConflict:
                    "user_id,notification_type,reference_key",
            }
        );

    if (error) {
        throw error;
    }
}

export function getAdminSupabase() {
    return adminSupabase;
}