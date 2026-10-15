import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* =========================================================
   ENVIRONMENT
========================================================= */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabaseServiceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

/* =========================================================
   SUPABASE ADMIN CLIENT
========================================================= */

const adminSupabase = createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

/* =========================================================
   SYSTEM PROMPT
========================================================= */

const SYSTEM_PROMPT = `
You are FinPilot AI Coach, an intelligent personal finance assistant.

Your job is to help users understand and improve their personal finances.

You can analyze:
- Income
- Expenses
- Transactions
- Budgets
- Savings goals
- Spending patterns
- Categories
- Financial habits
- Cash flow
- Financial risks
- Savings opportunities

Rules:

1. Give practical and personalized financial guidance.
2. Use the user's actual financial data when available.
3. Never invent transactions, balances, budgets, goals, or other financial information.
4. If information is missing, clearly say what is missing.
5. Keep calculations accurate.
6. Explain financial concepts in simple language.
7. Highlight important risks when appropriate.
8. Avoid unnecessary repetition.
9. Do not claim to perform actions that you cannot actually perform.
10. Do not provide illegal or fraudulent financial advice.
11. Do not guarantee investment returns.
12. For investment-related questions, provide general educational information and mention that professional advice may be appropriate.
13. Be concise but useful.
14. When useful, provide clear bullet points or numbered steps.
15. Focus on helping the user make better financial decisions.

You are part of the FinPilot application.
`;

/* =========================================================
   ANSWER CLEANING
========================================================= */

function cleanAnswer(answer: string): string {
    if (!answer) {
        return "";
    }

    return answer
        .replace(/\r\n/g, "\n")
        .replace(/\n{4,}/g, "\n\n")
        .trim();
}

/* =========================================================
   GEMINI RESPONSE EXTRACTION
========================================================= */

function extractGeminiText(value: unknown): string {
    if (!value) {
        return "";
    }

    if (typeof value === "string") {
        return value;
    }

    if (Array.isArray(value)) {
        return value
            .map((item) => extractGeminiText(item))
            .filter(Boolean)
            .join("\n");
    }

    if (typeof value === "object") {
        const obj = value as Record<string, unknown>;

        if (typeof obj.text === "string") {
            return obj.text;
        }

        if (typeof obj.output_text === "string") {
            return obj.output_text;
        }

        if (typeof obj.content === "string") {
            return obj.content;
        }

        if (obj.parts) {
            const result = extractGeminiText(obj.parts);

            if (result) {
                return result;
            }
        }

        if (obj.candidates) {
            const result = extractGeminiText(obj.candidates);

            if (result) {
                return result;
            }
        }

        if (obj.content) {
            const result = extractGeminiText(obj.content);

            if (result) {
                return result;
            }
        }

        if (obj.message) {
            const result = extractGeminiText(obj.message);

            if (result) {
                return result;
            }
        }

        /*
         * Gemini Interactions API returns model output
         * inside steps. Each model_output step can contain
         * content blocks containing text.
         */
        if (obj.steps) {
            const result = extractGeminiText(obj.steps);

            if (result) {
                return result;
            }
        }

        /*
         * Some Interaction API responses expose the final
         * model output under output.
         */
        if (obj.output) {
            const result = extractGeminiText(obj.output);

            if (result) {
                return result;
            }
        }
    }

    return "";
}

/* =========================================================
   PROMPT BUILDER
========================================================= */

function buildPrompt(
    question: string,
    context: unknown,
    history: unknown
): string {
    return `
${SYSTEM_PROMPT}

USER QUESTION:
${question}

USER FINANCIAL CONTEXT:
${JSON.stringify(context ?? {}, null, 2)}

PREVIOUS CONVERSATION:
${JSON.stringify(history ?? [], null, 2)}

Analyze the available information carefully.

Answer the user's question directly.

If financial data is available, use it.

If financial data is not available, do not invent it.

Provide practical, easy-to-understand advice.
`;
}

/* =========================================================
   GEMINI
========================================================= */

async function callGemini(prompt: string): Promise<string> {
    if (!GEMINI_API_KEY) {
        throw new Error("Gemini API key is not configured.");
    }

    /*
     * Current stable Gemini Flash model.
     *
     * Google recommends the Interactions API for new
     * Gemini integrations.
     */
    const model = "gemini-3.8-flash";

    const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/interactions",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": GEMINI_API_KEY,
            },
            body: JSON.stringify({
                model,
                system_instruction: SYSTEM_PROMPT,
                input: prompt,
                generation_config: {
                    thinking_level: "low",
                },
                store: false,
            }),
        }
    );

    const rawText = await response.text();

    let data: unknown = null;

    try {
        data = rawText ? JSON.parse(rawText) : null;
    } catch {
        data = null;
    }

    if (!response.ok) {
        const errorMessage =
            typeof data === "object" &&
                data !== null &&
                "error" in data &&
                typeof (data as Record<string, unknown>).error === "object"
                ? JSON.stringify(
                    (data as Record<string, unknown>).error
                )
                : rawText || "Gemini request failed.";

        throw new Error(
            `Gemini ${response.status}: ${errorMessage}`
        );
    }

    const answer = cleanAnswer(
        extractGeminiText(data)
    );

    if (!answer) {
        throw new Error(
            "Gemini returned an empty response."
        );
    }

    return answer;
}

/* =========================================================
   OPENROUTER
========================================================= */

async function callOpenRouter(prompt: string): Promise<string> {
    if (!OPENROUTER_API_KEY) {
        throw new Error(
            "OpenRouter API key is not configured."
        );
    }

    const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer":
                    process.env.NEXT_PUBLIC_SITE_URL ||
                    "http://localhost:3000",
                "X-Title": "FinPilot",
            },
            body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                    {
                        role: "system",
                        content: SYSTEM_PROMPT,
                    },
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                temperature: 0.4,
                max_tokens: 2048,
            }),
        }
    );

    const rawText = await response.text();

    let data: unknown = null;

    try {
        data = rawText ? JSON.parse(rawText) : null;
    } catch {
        data = null;
    }

    if (!response.ok) {
        const errorMessage =
            typeof data === "object" &&
                data !== null &&
                "error" in data
                ? JSON.stringify(
                    (data as Record<string, unknown>).error
                )
                : rawText || "OpenRouter request failed.";

        throw new Error(
            `OpenRouter ${response.status}: ${errorMessage}`
        );
    }

    const answer =
        typeof data === "object" &&
            data !== null &&
            "choices" in data &&
            Array.isArray(
                (data as Record<string, unknown>).choices
            )
            ? (
                (data as Record<string, unknown>)
                    .choices as Array<Record<string, unknown>>
            )
                .map((choice) => {
                    const message = choice.message;

                    if (
                        typeof message === "object" &&
                        message !== null &&
                        "content" in message
                    ) {
                        return (message as Record<string, unknown>)
                            .content;
                    }

                    return "";
                })
                .filter(
                    (value): value is string =>
                        typeof value === "string"
                )
                .join("\n")
            : "";

    const cleaned = cleanAnswer(answer);

    if (!cleaned) {
        throw new Error(
            "OpenRouter returned an empty response."
        );
    }

    return cleaned;
}

/* =========================================================
   FINPILOT FALLBACK
========================================================= */

function getFinPilotFallback(
    question: string,
    context: any
): string {
    const lowerQuestion = question.toLowerCase();

    /*
     * The frontend sends a pre-computed FinancialContext object
     * (income, expenses, balance, goals[], etc.).
     * Raw transaction/budget arrays are NOT present — use the
     * computed fields directly.
     */
    const totalIncome = Number(context?.income) || 0;
    const totalExpense = Number(context?.expenses) || 0;
    const balance = Number(context?.balance) ?? (totalIncome - totalExpense);

    const goals = Array.isArray(context?.goals)
        ? context.goals
        : [];

    const budgets: unknown[] = []; // budgets are not passed as an array; use totalBudget instead
    const totalBudget = Number(context?.totalBudget) || 0;
    const budgetUsed = Number(context?.budgetUsed) || 0;
    const budgetRemaining = Number(context?.budgetRemaining) || 0;
    const budgetUsagePercent = Number(context?.budgetUsagePercent) || 0;

    const categorySpending: Record<string, number> =
        context?.categorySpending && typeof context.categorySpending === "object"
            ? context.categorySpending
            : {};

    // Build a top-spending-categories summary when available
    const categoryLines = Object.entries(categorySpending)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([cat, amt]) => `  • ${cat}: ₹${Number(amt).toFixed(2)}`)
        .join("\n");

    const month = context?.month ? `for ${context.month}` : "";

    if (
        lowerQuestion.includes("budget") &&
        totalBudget > 0
    ) {
        return `
Here is your budget summary ${month}:

• Total budget: ₹${totalBudget.toFixed(2)}
• Spent so far: ₹${budgetUsed.toFixed(2)}
• Remaining: ₹${budgetRemaining.toFixed(2)}
• Usage: ${budgetUsagePercent.toFixed(1)}%

${budgetRemaining < 0
                ? "⚠️ You have exceeded your total budget. Consider reducing discretionary spending."
                : budgetUsagePercent > 80
                    ? "You are close to your budget limit. Monitor spending carefully for the rest of the month."
                    : "You are within budget. Keep up the good work."
            }

${categoryLines ? `Top spending categories:\n${categoryLines}` : ""}
`.trim();
    }

    if (
        lowerQuestion.includes("goal") &&
        goals.length > 0
    ) {
        const goalLines = goals
            .slice(0, 5)
            .map(
                (g: any) =>
                    `  • ${g.name}: ₹${Number(g.saved).toFixed(2)} saved of ₹${Number(g.target).toFixed(2)} (${Number(g.progress).toFixed(1)}%)`
            )
            .join("\n");

        return `
You have ${goals.length} financial goal${goals.length === 1 ? "" : "s"} ${month}:

${goalLines}

${balance > 0
                ? `You currently have a positive balance of ₹${balance.toFixed(2)}. Consider directing part of it toward your highest-priority goal.`
                : "Your expenses currently exceed your income this month. Focus on reducing costs before increasing goal contributions."
            }
`.trim();
    }

    if (
        lowerQuestion.includes("saving") ||
        lowerQuestion.includes("save")
    ) {
        return `
Here is your savings picture ${month}:

• Income: ₹${totalIncome.toFixed(2)}
• Expenses: ₹${totalExpense.toFixed(2)}
• Net balance: ₹${balance.toFixed(2)}

${balance > 0
                ? `You are saving ₹${balance.toFixed(2)} this month (${totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0}% of income). A good target is 20% of income.`
                : "Your expenses are exceeding your income this month. Review the largest expense categories and look for areas to cut back."
            }

${categoryLines ? `Top spending categories:\n${categoryLines}` : ""}
`.trim();
    }

    // Overview / general question
    return `
Here is your financial overview ${month}:

• Income: ₹${totalIncome.toFixed(2)}
• Expenses: ₹${totalExpense.toFixed(2)}
• Net balance: ₹${balance.toFixed(2)}
${totalBudget > 0 ? `• Budget used: ${budgetUsagePercent.toFixed(1)}% of ₹${totalBudget.toFixed(2)}` : ""}
${goals.length > 0 ? `• Active savings goals: ${goals.length}` : ""}

${categoryLines ? `Top spending categories:\n${categoryLines}` : "No expense transactions recorded this month yet."}

Ask me about your spending habits, budgets, savings goals, or financial forecast for more details.
`.trim();
}

/* =========================================================
   POST /api/ai-coach
========================================================= */

export async function POST(
    request: NextRequest
) {
    try {
        /* -----------------------------------------------------
           1. AUTHENTICATE USER
        ----------------------------------------------------- */

        const authorization =
            request.headers.get("authorization");

        if (!authorization) {
            return NextResponse.json(
                {
                    error:
                        "Authentication required.",
                },
                {
                    status: 401,
                }
            );
        }

        const accessToken =
            authorization.startsWith("Bearer ")
                ? authorization
                    .substring(7)
                    .trim()
                : "";

        if (!accessToken) {
            return NextResponse.json(
                {
                    error:
                        "Authentication required.",
                },
                {
                    status: 401,
                }
            );
        }

        const {
            data: {
                user,
            },
            error: userError,
        } =
            await adminSupabase.auth.getUser(
                accessToken
            );

        if (userError || !user) {
            return NextResponse.json(
                {
                    error:
                        "Your session is invalid or expired. Please sign in again.",
                },
                {
                    status: 401,
                }
            );
        }

        /* -----------------------------------------------------
           2. CHECK AI INSIGHTS SETTING
        ----------------------------------------------------- */

        const {
            data: preferences,
            error: preferencesError,
        } =
            await adminSupabase
                .from("user_preferences")
                .select(
                    "ai_insights_enabled"
                )
                .eq(
                    "user_id",
                    user.id
                )
                .maybeSingle();

        if (preferencesError) {
            console.error(
                "Failed to load AI preferences:",
                preferencesError
            );

            return NextResponse.json(
                {
                    error:
                        "Unable to verify your AI Insights settings. Please try again.",
                },
                {
                    status: 500,
                }
            );
        }

        /*
         * If the user has an existing preference row and has
         * explicitly disabled AI Insights, block the request.
         *
         * If there is no preference row yet, allow access because
         * the database default is ai_insights_enabled = true.
         */

        if (
            preferences &&
            preferences.ai_insights_enabled === false
        ) {
            return NextResponse.json(
                {
                    error:
                        "AI Financial Insights are disabled. Enable them in Settings to use personalized financial analysis.",
                },
                {
                    status: 403,
                }
            );
        }

        /* -----------------------------------------------------
           3. READ REQUEST BODY
        ----------------------------------------------------- */

        const body =
            await request.json();

        const question =
            typeof body?.question === "string"
                ? body.question.trim()
                : "";

        const context =
            body?.context ?? {};

        const history =
            body?.history ?? [];

        if (!question) {
            return NextResponse.json(
                {
                    error:
                        "Question is required.",
                },
                {
                    status: 400,
                }
            );
        }

        /* -----------------------------------------------------
           4. BUILD AI PROMPT
        ----------------------------------------------------- */

        const prompt =
            buildPrompt(
                question,
                context,
                history
            );

        /* -----------------------------------------------------
           5. GEMINI
        ----------------------------------------------------- */

        try {
            const answer =
                await callGemini(prompt);

            return NextResponse.json({
                success: true,
                provider: "gemini",
                answer,
            });
        } catch (geminiError) {
            console.error(
                "Gemini unavailable. Trying OpenRouter.",
                geminiError
            );
        }

        /* -----------------------------------------------------
           6. OPENROUTER FALLBACK
        ----------------------------------------------------- */

        try {
            const answer =
                await callOpenRouter(
                    prompt
                );

            return NextResponse.json({
                success: true,
                provider: "openrouter",
                answer,
            });
        } catch (
        openRouterError
        ) {
            console.error(
                "OpenRouter unavailable. Using FinPilot fallback.",
                openRouterError
            );
        }

        /* -----------------------------------------------------
           7. FINPILOT LOCAL FALLBACK
        ----------------------------------------------------- */

        const fallbackAnswer =
            getFinPilotFallback(
                question,
                context
            );

        return NextResponse.json({
            success: true,
            provider: "finpilot",
            answer: fallbackAnswer,
        });
    } catch (error) {
        console.error(
            "AI Coach API error:",
            error
        );

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Something went wrong while processing your request.",
            },
            {
                status: 500,
            }
        );
    }
}