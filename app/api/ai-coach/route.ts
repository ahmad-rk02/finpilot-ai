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

    const transactions = Array.isArray(
        context?.transactions
    )
        ? context.transactions
        : [];

    const budgets = Array.isArray(context?.budgets)
        ? context.budgets
        : [];

    const goals = Array.isArray(context?.goals)
        ? context.goals
        : [];

    let totalIncome = 0;
    let totalExpense = 0;

    for (const transaction of transactions) {
        const amount =
            Number(transaction?.amount) || 0;

        const type = String(
            transaction?.type ||
            transaction?.transaction_type ||
            ""
        ).toLowerCase();

        if (
            type === "income" ||
            type === "credit" ||
            type === "deposit"
        ) {
            totalIncome += amount;
        } else {
            totalExpense += amount;
        }
    }

    const balance =
        totalIncome - totalExpense;

    if (
        lowerQuestion.includes("budget") &&
        budgets.length > 0
    ) {
        return `
You currently have ${budgets.length} budget${budgets.length === 1 ? "" : "s"
            } configured.

Review each budget against your recent spending and focus first on categories where spending is closest to or above the planned limit.

Your current transaction data shows approximately:

• Income: ₹${totalIncome.toFixed(2)}
• Expenses: ₹${totalExpense.toFixed(2)}
• Difference: ₹${balance.toFixed(2)}

Consider reducing discretionary spending in categories that are consistently exceeding their limits.
`.trim();
    }

    if (
        lowerQuestion.includes("goal") &&
        goals.length > 0
    ) {
        return `
You currently have ${goals.length} financial goal${goals.length === 1 ? "" : "s"
            }.

A good approach is to prioritize goals by urgency and importance, then assign a realistic recurring amount toward each goal.

Based on the available transaction data:

• Income: ₹${totalIncome.toFixed(2)}
• Expenses: ₹${totalExpense.toFixed(2)}
• Difference: ₹${balance.toFixed(2)}

If the difference is positive, consider directing part of it toward your highest-priority goal.
`.trim();
    }

    if (
        lowerQuestion.includes("saving") ||
        lowerQuestion.includes("save")
    ) {
        return `
Based on the available transaction data:

• Income: ₹${totalIncome.toFixed(2)}
• Expenses: ₹${totalExpense.toFixed(2)}
• Difference: ₹${balance.toFixed(2)}

A practical starting point is to review your largest recurring expenses and identify categories where you can reduce spending without affecting essential needs.

Try setting a specific monthly savings target and treating it as a planned expense.
`.trim();
    }

    return `
I can help you analyze your FinPilot financial data.

Based on the currently available transaction information:

• Income: ₹${totalIncome.toFixed(2)}
• Expenses: ₹${totalExpense.toFixed(2)}
• Difference: ₹${balance.toFixed(2)}

For a more detailed answer, ask me about your spending, budgets, savings goals, or financial habits.
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