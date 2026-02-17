import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { z } from "zod";

export const runtime = "nodejs";

const openaiProvider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
  headers: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Energy Analyzer MVP",
  },
});

const modelId = process.env.OPENAI_MODEL ?? "openai/gpt-4o-mini";

const RowsSchema = z.array(
  z.object({
    month: z.string(),
    consumption: z.number(),
    cost: z.number().optional(),
  }),
);

type Row = z.infer<typeof RowsSchema>[number];

function detectAnomalies(rows: Row[]) {
  const avg = rows.reduce((sum, r) => sum + r.consumption, 0) / rows.length;
  const threshold = avg * 1.3;
  const anomalies = rows.filter((r) => r.consumption > threshold);

  return {
    average: avg,
    threshold,
    anomalies,
    summary:
      anomalies.length === 0
        ? "No major anomalies detected."
        : `Detected ${anomalies.length} anomaly/anomalies above ${threshold.toFixed(2)}.`,
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { message: string; rows: unknown };

    const rows = RowsSchema.parse(body.rows);
    const message = String(body.message ?? "");

    // Step 1: deterministic tool execution (your business logic)
    const toolResult = detectAnomalies(rows);

    // Step 2: ask the model to produce a human-friendly answer based on toolResult
    const result = await generateText({
      model: openaiProvider(modelId),
      system: `
You are an energy analyst.
Write a clear, concise answer in plain text.
Use bullet points.
Include:
1) What was detected
2) Why it matters
3) 3 actionable recommendations
4) A short "next step" checklist
`,
      prompt: `
User request:
${message}

Tool result (anomaly detection):
${JSON.stringify(toolResult, null, 2)}
`,
    });

    const text =
      result.text?.trim() ||
      `⚠️ Model returned empty text.\n\nTool result:\n${JSON.stringify(
        toolResult,
        null,
        2
      )}`;

    return new Response(text, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.stack ?? err.message : String(err);
    return new Response(`❌ API crashed:\n${msg}`, { status: 500 });
  }
}

