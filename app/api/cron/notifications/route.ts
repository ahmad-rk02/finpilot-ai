import { NextRequest, NextResponse } from "next/server";
import {
    getAdminSupabase,
    sendBrevoEmail,
    wasNotificationSent,
    markNotificationSent,
} from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Preference = {
    user_id: string;
    ai_insights_enabled: boolean;
    email_notifications_enabled: boolean;
    budget_alerts: boolean;
    overspending_alerts: boolean;
    goal_reminders: boolean;
    weekly_summary: boolean;
    monthly_summary: boolean;
    email: string | null;
    full_name: string | null;
};

type Budget = {
    id: string;
    user_id: string;
    category: string;
    amount: number;
    month: string;
};

type Transaction = {
    id: string;
    user_id: string;
    type: "income" | "expense";
    amount: number;
    category: string;
    transaction_date: string;
};

type Goal = {
    id: string;
    user_id: string;
    name: string;
    target_amount: number;
    saved_amount: number;
    target_date: string;
};

function getToday() {
    const now = new Date();

    return new Date(
        Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate()
        )
    );
}

function getDateString(date: Date) {
    return date.toISOString().slice(0, 10);
}

function getMonthStart(date: Date) {
    return `${date.getUTCFullYear()}-${String(
        date.getUTCMonth() + 1
    ).padStart(2, "0")}-01`;
}

function getPreviousDay(date: Date) {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() - 1);
    return result;
}

function getDaysDifference(
    from: Date,
    to: Date
) {
    const milliseconds =
        to.getTime() - from.getTime();

    return Math.ceil(
        milliseconds / (1000 * 60 * 60 * 24)
    );
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(amount);
}

function escapeHtml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getGreetingName(
    fullName: string | null,
    email: string
) {
    if (fullName?.trim()) {
        return fullName.trim().split(" ")[0];
    }

    return email.split("@")[0];
}

async function sendNotification(
    preference: Preference,
    notificationType: string,
    referenceKey: string,
    subject: string,
    html: string,
    text: string
) {
    const adminSupabase = getAdminSupabase();

    if (!preference.email) {
        return {
            sent: false,
            skipped: true,
            reason: "No email address",
        };
    }

    const alreadySent =
        await wasNotificationSent(
            preference.user_id,
            notificationType,
            referenceKey
        );

    if (alreadySent) {
        return {
            sent: false,
            skipped: true,
            reason: "Already sent",
        };
    }

    await sendBrevoEmail({
        to: preference.email,
        name: preference.full_name,
        subject,
        html,
        text,
        tags: [
            "finpilot",
            notificationType,
        ],
    });

    await markNotificationSent({
        userId: preference.user_id,
        notificationType,
        referenceKey,
        subject,
        email: preference.email,
    });

    return {
        sent: true,
        skipped: false,
    };
}

function buildEmailLayout(
    name: string,
    title: string,
    content: string
) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
</head>

<body style="margin:0;padding:0;background:#020617;font-family:Arial,Helvetica,sans-serif;color:#e2e8f0;">
    <div style="width:100%;padding:40px 16px;box-sizing:border-box;">
        <div style="max-width:600px;margin:0 auto;background:#0f172a;border:1px solid #1e293b;border-radius:16px;overflow:hidden;">
            
            <div style="padding:24px;border-bottom:1px solid #1e293b;">
                <div style="font-size:22px;font-weight:700;color:#ffffff;">
                    FinPilot
                </div>

                <div style="font-size:12px;color:#64748b;margin-top:4px;">
                    Personal Finance, Made Simple
                </div>
            </div>

            <div style="padding:28px 24px;">
                <p style="margin:0 0 8px;color:#94a3b8;font-size:14px;">
                    Hello ${escapeHtml(name)},
                </p>

                <h1 style="margin:0 0 20px;color:#ffffff;font-size:24px;">
                    ${escapeHtml(title)}
                </h1>

                ${content}
            </div>

            <div style="padding:20px 24px;border-top:1px solid #1e293b;text-align:center;">
                <p style="margin:0;color:#475569;font-size:12px;">
                    FinPilot • Personal finance, made simple.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
`;
}

async function processBudgetAlerts(
    preference: Preference,
    budgets: Budget[],
    transactions: Transaction[],
    monthStart: string
) {
    if (
        !preference.budget_alerts &&
        !preference.overspending_alerts
    ) {
        return 0;
    }

    let sentCount = 0;

    const monthTransactions =
        transactions.filter(
            (transaction) =>
                transaction.transaction_date >=
                monthStart &&
                transaction.type === "expense"
        );

    for (const budget of budgets) {
        const budgetAmount = Number(
            budget.amount
        );

        if (
            !Number.isFinite(budgetAmount) ||
            budgetAmount <= 0
        ) {
            continue;
        }

        const spent = monthTransactions
            .filter(
                (transaction) =>
                    transaction.category
                        ?.toLowerCase() ===
                    budget.category?.toLowerCase()
            )
            .reduce(
                (total, transaction) =>
                    total +
                    Number(transaction.amount),
                0
            );

        const percentage =
            (spent / budgetAmount) * 100;

        let notificationType = "";
        let referenceKey = "";
        let subject = "";
        let title = "";
        let content = "";

        if (
            percentage >= 100 &&
            preference.overspending_alerts
        ) {
            notificationType =
                "budget_overspent";

            referenceKey = `${monthStart}:${budget.id}:100`;

            subject = `🚨 Budget exceeded: ${budget.category}`;

            title = `Budget exceeded`;

            content = `
                <p style="color:#cbd5e1;font-size:15px;line-height:1.7;">
                    Your <strong style="color:#ffffff;">
                    ${escapeHtml(budget.category)}
                    </strong> budget has been exceeded.
                </p>

                <div style="background:#1e293b;border-radius:12px;padding:18px;margin:20px 0;">
                    <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;">
                        Spent
                    </p>

                    <p style="margin:0;color:#fb7185;font-size:24px;font-weight:700;">
                        ${formatCurrency(spent)}
                    </p>

                    <p style="margin:12px 0 0;color:#94a3b8;font-size:13px;">
                        Budget: ${formatCurrency(budgetAmount)}
                    </p>
                </div>

                <p style="color:#94a3b8;font-size:13px;line-height:1.6;">
                    Consider reviewing your recent spending in FinPilot.
                </p>
            `;

        } else if (
            percentage >= 80 &&
            preference.budget_alerts
        ) {
            notificationType =
                "budget_warning";

            referenceKey = `${monthStart}:${budget.id}:80`;

            subject = `⚠️ Budget alert: ${budget.category}`;

            title = `You're approaching your budget`;

            content = `
                <p style="color:#cbd5e1;font-size:15px;line-height:1.7;">
                    You've used approximately
                    <strong style="color:#ffffff;">
                        ${percentage.toFixed(0)}%
                    </strong>
                    of your
                    <strong style="color:#ffffff;">
                        ${escapeHtml(budget.category)}
                    </strong>
                    budget.
                </p>

                <div style="background:#1e293b;border-radius:12px;padding:18px;margin:20px 0;">
                    <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;">
                        Spent
                    </p>

                    <p style="margin:0;color:#fbbf24;font-size:24px;font-weight:700;">
                        ${formatCurrency(spent)}
                    </p>

                    <p style="margin:12px 0 0;color:#94a3b8;font-size:13px;">
                        Budget: ${formatCurrency(budgetAmount)}
                    </p>
                </div>

                <p style="color:#94a3b8;font-size:13px;line-height:1.6;">
                    You're getting close to your budget limit. Keep an eye on your remaining spending.
                </p>
            `;
        }

        if (!notificationType) {
            continue;
        }

        const name = getGreetingName(
            preference.full_name,
            preference.email || "User"
        );

        const html = buildEmailLayout(
            name,
            title,
            content
        );

        const text =
            `${title}\n\n` +
            `Hello ${name},\n\n` +
            `Category: ${budget.category}\n` +
            `Spent: ${formatCurrency(spent)}\n` +
            `Budget: ${formatCurrency(budgetAmount)}\n` +
            `Usage: ${percentage.toFixed(0)}%\n\n` +
            `FinPilot`;

        try {
            const result =
                await sendNotification(
                    preference,
                    notificationType,
                    referenceKey,
                    subject,
                    html,
                    text
                );

            if (result.sent) {
                sentCount++;
            }
        } catch (error) {
            console.error(
                `Failed to send ${notificationType} for user ${preference.user_id}:`,
                error
            );
        }
    }

    return sentCount;
}

async function processGoalReminders(
    preference: Preference,
    goals: Goal[],
    today: Date
) {
    if (!preference.goal_reminders) {
        return 0;
    }

    let sentCount = 0;

    for (const goal of goals) {
        if (!goal.target_date) {
            continue;
        }

        const targetDate = new Date(
            `${goal.target_date}T00:00:00Z`
        );

        if (Number.isNaN(targetDate.getTime())) {
            continue;
        }

        const daysRemaining =
            getDaysDifference(
                today,
                targetDate
            );

        if (
            daysRemaining < 0 ||
            daysRemaining > 7
        ) {
            continue;
        }

        const referenceKey = `${goal.id}:${goal.target_date}`;

        const notificationType =
            "goal_reminder";

        const subject =
            daysRemaining === 0
                ? `🎯 Goal deadline is today: ${goal.name}`
                : `🎯 Goal reminder: ${goal.name}`;

        const title =
            daysRemaining === 0
                ? "Your goal deadline is today"
                : "Goal deadline approaching";

        const remainingAmount = Math.max(
            Number(goal.target_amount) -
            Number(goal.saved_amount),
            0
        );

        const name = getGreetingName(
            preference.full_name,
            preference.email || "User"
        );

        const deadlineText =
            daysRemaining === 0
                ? "today"
                : `in ${daysRemaining} day${daysRemaining === 1
                    ? ""
                    : "s"
                }`;

        const content = `
            <p style="color:#cbd5e1;font-size:15px;line-height:1.7;">
                Your goal
                <strong style="color:#ffffff;">
                    ${escapeHtml(goal.name)}
                </strong>
                has a target date
                <strong style="color:#ffffff;">
                    ${deadlineText}
                </strong>.
            </p>

            <div style="background:#1e293b;border-radius:12px;padding:18px;margin:20px 0;">
                <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;">
                    Saved
                </p>

                <p style="margin:0;color:#a78bfa;font-size:24px;font-weight:700;">
                    ${formatCurrency(
            Number(goal.saved_amount)
        )}
                </p>

                <p style="margin:12px 0 0;color:#94a3b8;font-size:13px;">
                    Target: ${formatCurrency(
            Number(goal.target_amount)
        )}
                </p>

                <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;">
                    Remaining: ${formatCurrency(
            remainingAmount
        )}
                </p>
            </div>
        `;

        const html = buildEmailLayout(
            name,
            title,
            content
        );

        const text =
            `${title}\n\n` +
            `Hello ${name},\n\n` +
            `Goal: ${goal.name}\n` +
            `Target: ${formatCurrency(
                Number(goal.target_amount)
            )}\n` +
            `Saved: ${formatCurrency(
                Number(goal.saved_amount)
            )}\n` +
            `Remaining: ${formatCurrency(
                remainingAmount
            )}\n` +
            `Target date: ${goal.target_date}\n\n` +
            `FinPilot`;

        try {
            const result =
                await sendNotification(
                    preference,
                    notificationType,
                    referenceKey,
                    subject,
                    html,
                    text
                );

            if (result.sent) {
                sentCount++;
            }
        } catch (error) {
            console.error(
                `Failed to send goal reminder for user ${preference.user_id}:`,
                error
            );
        }
    }

    return sentCount;
}

async function processWeeklySummary(
    preference: Preference,
    transactions: Transaction[],
    today: Date
) {
    if (!preference.weekly_summary) {
        return 0;
    }

    /*
     * JavaScript:
     * Sunday = 0
     * Monday = 1
     *
     * Weekly summary is sent on Monday.
     */
    if (today.getUTCDay() !== 1) {
        return 0;
    }

    const endDate = getDateString(
        getPreviousDay(today)
    );

    const start = new Date(today);
    start.setUTCDate(
        start.getUTCDate() - 7
    );

    const startDate = getDateString(start);

    const weeklyTransactions =
        transactions.filter(
            (transaction) =>
                transaction.transaction_date >=
                startDate &&
                transaction.transaction_date <=
                endDate
        );

    const income =
        weeklyTransactions
            .filter(
                (transaction) =>
                    transaction.type === "income"
            )
            .reduce(
                (total, transaction) =>
                    total +
                    Number(transaction.amount),
                0
            );

    const expenses =
        weeklyTransactions
            .filter(
                (transaction) =>
                    transaction.type === "expense"
            )
            .reduce(
                (total, transaction) =>
                    total +
                    Number(transaction.amount),
                0
            );

    const balance = income - expenses;

    const referenceKey =
        `week:${startDate}:${endDate}`;

    const subject =
        "📊 Your FinPilot weekly summary";

    const title =
        "Your weekly financial summary";

    const name = getGreetingName(
        preference.full_name,
        preference.email || "User"
    );

    const content = `
        <p style="color:#cbd5e1;font-size:15px;line-height:1.7;">
            Here's a quick look at your finances from
            <strong style="color:#ffffff;">
                ${startDate}
            </strong>
            to
            <strong style="color:#ffffff;">
                ${endDate}
            </strong>.
        </p>

        <div style="background:#1e293b;border-radius:12px;padding:18px;margin:20px 0;">
            <p style="margin:0 0 14px;color:#94a3b8;font-size:13px;">
                Income
            </p>

            <p style="margin:0 0 18px;color:#34d399;font-size:22px;font-weight:700;">
                ${formatCurrency(income)}
            </p>

            <p style="margin:0 0 14px;color:#94a3b8;font-size:13px;">
                Expenses
            </p>

            <p style="margin:0 0 18px;color:#fb7185;font-size:22px;font-weight:700;">
                ${formatCurrency(expenses)}
            </p>

            <p style="margin:0 0 14px;color:#94a3b8;font-size:13px;">
                Net cash flow
            </p>

            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">
                ${formatCurrency(balance)}
            </p>
        </div>

        <p style="color:#94a3b8;font-size:13px;line-height:1.6;">
            Open FinPilot to review your transactions, budgets and goals.
        </p>
    `;

    const html = buildEmailLayout(
        name,
        title,
        content
    );

    const text =
        `${title}\n\n` +
        `Hello ${name},\n\n` +
        `Income: ${formatCurrency(income)}\n` +
        `Expenses: ${formatCurrency(expenses)}\n` +
        `Net cash flow: ${formatCurrency(
            balance
        )}\n\n` +
        `FinPilot`;

    try {
        const result =
            await sendNotification(
                preference,
                "weekly_summary",
                referenceKey,
                subject,
                html,
                text
            );

        return result.sent ? 1 : 0;
    } catch (error) {
        console.error(
            `Failed to send weekly summary for user ${preference.user_id}:`,
            error
        );

        return 0;
    }
}

async function processMonthlySummary(
    preference: Preference,
    transactions: Transaction[],
    today: Date
) {
    if (!preference.monthly_summary) {
        return 0;
    }

    if (today.getUTCDate() !== 1) {
        return 0;
    }

    const previousMonth = new Date(today);

    previousMonth.setUTCMonth(
        previousMonth.getUTCMonth() - 1
    );

    const year =
        previousMonth.getUTCFullYear();

    const month =
        previousMonth.getUTCMonth();

    const monthStart = `${year}-${String(
        month + 1
    ).padStart(2, "0")}-01`;

    const nextMonth = new Date(
        Date.UTC(
            year,
            month + 1,
            1
        )
    );

    const monthEnd = getDateString(
        new Date(
            nextMonth.getTime() -
            24 * 60 * 60 * 1000
        )
    );

    const monthlyTransactions =
        transactions.filter(
            (transaction) =>
                transaction.transaction_date >=
                monthStart &&
                transaction.transaction_date <=
                monthEnd
        );

    const income =
        monthlyTransactions
            .filter(
                (transaction) =>
                    transaction.type === "income"
            )
            .reduce(
                (total, transaction) =>
                    total +
                    Number(transaction.amount),
                0
            );

    const expenses =
        monthlyTransactions
            .filter(
                (transaction) =>
                    transaction.type === "expense"
            )
            .reduce(
                (total, transaction) =>
                    total +
                    Number(transaction.amount),
                0
            );

    const balance = income - expenses;

    const monthLabel =
        new Date(
            `${monthStart}T00:00:00Z`
        ).toLocaleDateString(
            "en-IN",
            {
                month: "long",
                year: "numeric",
                timeZone: "UTC",
            }
        );

    const referenceKey =
        `month:${monthStart}`;

    const subject =
        `📅 Your ${monthLabel} FinPilot summary`;

    const title =
        `${monthLabel} financial summary`;

    const name = getGreetingName(
        preference.full_name,
        preference.email || "User"
    );

    const content = `
        <p style="color:#cbd5e1;font-size:15px;line-height:1.7;">
            Here's your financial summary for
            <strong style="color:#ffffff;">
                ${escapeHtml(monthLabel)}
            </strong>.
        </p>

        <div style="background:#1e293b;border-radius:12px;padding:18px;margin:20px 0;">
            <p style="margin:0 0 14px;color:#94a3b8;font-size:13px;">
                Total income
            </p>

            <p style="margin:0 0 18px;color:#34d399;font-size:22px;font-weight:700;">
                ${formatCurrency(income)}
            </p>

            <p style="margin:0 0 14px;color:#94a3b8;font-size:13px;">
                Total expenses
            </p>

            <p style="margin:0 0 18px;color:#fb7185;font-size:22px;font-weight:700;">
                ${formatCurrency(expenses)}
            </p>

            <p style="margin:0 0 14px;color:#94a3b8;font-size:13px;">
                Net cash flow
            </p>

            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">
                ${formatCurrency(balance)}
            </p>
        </div>

        <p style="color:#94a3b8;font-size:13px;line-height:1.6;">
            Open FinPilot for a deeper look at your financial activity.
        </p>
    `;

    const html = buildEmailLayout(
        name,
        title,
        content
    );

    const text =
        `${title}\n\n` +
        `Hello ${name},\n\n` +
        `Income: ${formatCurrency(income)}\n` +
        `Expenses: ${formatCurrency(expenses)}\n` +
        `Net cash flow: ${formatCurrency(
            balance
        )}\n\n` +
        `FinPilot`;

    try {
        const result =
            await sendNotification(
                preference,
                "monthly_summary",
                referenceKey,
                subject,
                html,
                text
            );

        return result.sent ? 1 : 0;
    } catch (error) {
        console.error(
            `Failed to send monthly summary for user ${preference.user_id}:`,
            error
        );

        return 0;
    }
}

export async function GET(
    request: NextRequest
) {
    try {
        const cronSecret =
            process.env.CRON_SECRET;

        if (!cronSecret) {
            console.error(
                "CRON_SECRET is not configured."
            );

            return NextResponse.json(
                {
                    error:
                        "Cron secret is not configured.",
                },
                { status: 500 }
            );
        }

        const authorization =
            request.headers.get(
                "authorization"
            );

        const expectedAuthorization =
            `Bearer ${cronSecret}`;

        if (
            authorization !==
            expectedAuthorization
        ) {
            return NextResponse.json(
                {
                    error: "Unauthorized.",
                },
                { status: 401 }
            );
        }

        const adminSupabase =
            getAdminSupabase();

        const today = getToday();

        const todayString =
            getDateString(today);

        const monthStart =
            getMonthStart(today);

        const { data: preferences, error: preferencesError } =
            await adminSupabase
                .from("user_preferences")
                .select(
                    `
                    user_id,
                    ai_insights_enabled,
                    email_notifications_enabled,
                    budget_alerts,
                    overspending_alerts,
                    goal_reminders,
                    weekly_summary,
                    monthly_summary,
                    email,
                    full_name
                    `
                )
                .eq(
                    "email_notifications_enabled",
                    true
                );

        if (preferencesError) {
            throw preferencesError;
        }

        if (!preferences || preferences.length === 0) {
            return NextResponse.json({
                success: true,
                message:
                    "No users have email notifications enabled.",
                processedUsers: 0,
                emailsSent: 0,
                date: todayString,
            });
        }

        let processedUsers = 0;
        let emailsSent = 0;

        for (const preference of preferences as Preference[]) {
            try {
                if (!preference.email) {
                    continue;
                }

                const { data: budgets, error: budgetsError } =
                    await adminSupabase
                        .from("budgets")
                        .select(
                            "id, user_id, category, amount, month"
                        )
                        .eq(
                            "user_id",
                            preference.user_id
                        )
                        .eq(
                            "month",
                            monthStart
                        );

                if (budgetsError) {
                    throw budgetsError;
                }

                const { data: transactions, error: transactionsError } =
                    await adminSupabase
                        .from("transactions")
                        .select(
                            `
                            id,
                            user_id,
                            type,
                            amount,
                            category,
                            transaction_date
                            `
                        )
                        .eq(
                            "user_id",
                            preference.user_id
                        );

                if (transactionsError) {
                    throw transactionsError;
                }

                const { data: goals, error: goalsError } =
                    await adminSupabase
                        .from("goals")
                        .select(
                            `
                            id,
                            user_id,
                            name,
                            target_amount,
                            saved_amount,
                            target_date
                            `
                        )
                        .eq(
                            "user_id",
                            preference.user_id
                        );

                if (goalsError) {
                    throw goalsError;
                }

                const userBudgets =
                    (budgets || []) as Budget[];

                const userTransactions =
                    (transactions || []) as Transaction[];

                const userGoals =
                    (goals || []) as Goal[];

                processedUsers++;

                emailsSent +=
                    await processBudgetAlerts(
                        preference,
                        userBudgets,
                        userTransactions,
                        monthStart
                    );

                emailsSent +=
                    await processGoalReminders(
                        preference,
                        userGoals,
                        today
                    );

                emailsSent +=
                    await processWeeklySummary(
                        preference,
                        userTransactions,
                        today
                    );

                emailsSent +=
                    await processMonthlySummary(
                        preference,
                        userTransactions,
                        today
                    );
            } catch (error) {
                console.error(
                    `Notification processing failed for user ${preference.user_id}:`,
                    error
                );
            }
        }

        return NextResponse.json({
            success: true,
            date: todayString,
            processedUsers,
            emailsSent,
        });
    } catch (error) {
        console.error(
            "Notification cron failed:",
            error
        );

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Notification cron failed.",
            },
            { status: 500 }
        );
    }
}