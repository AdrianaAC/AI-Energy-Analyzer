import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { z } from "zod";

export const runtime = "nodejs";

const openaiProvider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL, // https://openrouter.ai/api/v1
});

const modelId = process.env.OPENAI_MODEL ?? "openai/gpt-4o-mini";

const RowsSchema = z.array(
  z.object({
    month: z.string(),
    consumption: z.number(),
    cost: z.number().optional(),
  })
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
  const body = (await req.json()) as { message: string; rows: unknown };

  // Validate input coming from the frontend
  const rows = RowsSchema.parse(body.rows);
  const message = String(body.message ?? "");

  const result = await generateText({
    model: openaiProvider(modelId),
    system:
      "You are an energy analysis agent. Use the detectAnomalies tool when anomaly detection is relevant. Then provide concise bullet points and actionable suggestions.",
    messages: [
      {
        role: "user",
        content: `User request:\n${message}\n\nDataset:\n${JSON.stringify(rows)}`,
      },
    ],
    tools: {
      detectAnomalies: {
        description:
          "Detects energy consumption anomalies using a threshold based on average consumption.",
        inputSchema: z.object({
          rows: RowsSchema,
        }),
        execute: async ({ rows }: { rows: Row[] }) => detectAnomalies(rows),
      },
    },
  });

  return new Response(result.text, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
