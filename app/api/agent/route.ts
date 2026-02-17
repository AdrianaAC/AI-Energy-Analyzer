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

function draftEmailToFacilityManager(params: {
  facilityName: string;
  month: string;
  anomalyConsumption: number;
  threshold: number;
  cost?: number;
  recommendations: string[];
}) {
  const {
    facilityName,
    month,
    anomalyConsumption,
    threshold,
    cost,
    recommendations,
  } = params;

  const recs = recommendations.map((r) => `- ${r}`).join("\n");

  return {
    subject: `Energy consumption alert — ${facilityName} — ${month}`,
    body: `Hi team,

We detected an unusual energy consumption spike for ${facilityName} in ${month}.

Details:
- Consumption: ${anomalyConsumption} units (threshold: ${threshold.toFixed(2)} units)${
      typeof cost === "number" ? `\n- Cost: ${cost}` : ""
    }

Recommended next steps:
${recs}

If you'd like, I can help set up monitoring alerts and a monthly anomaly report.

Best regards,
Energy Analyzer AI`,
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { message: string; rows: unknown };

    const rows = RowsSchema.parse(body.rows);
    const message = String(body.message ?? "");

    // We will store tool outputs here so we can always produce a final answer
    const toolOutputs: Record<string, unknown> = {};

    // 1) "Planner" step: ask model what to do (it can call tools)
    // Note: Some OpenRouter/tool-call flows may not output final text, so we only use this step
    // to collect tool outputs, not as the final response.
    await generateText({
      model: openaiProvider(modelId),
      system: `
You are an agent that can analyze energy datasets and take actions using tools.

Rules:
- If the user asks for anomalies/spikes, call detectAnomalies.
- If the user asks to notify someone / email / message / report to a facility manager, call draftEmailToFacilityManager.
- You may call tools in any order.
- It's OK if you do NOT produce a final natural language answer in this step. Your goal is to use tools when needed.
`,
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
          inputSchema: z.object({ rows: RowsSchema }),
          execute: async ({ rows }: { rows: Row[] }) => {
            const out = detectAnomalies(rows);
            toolOutputs.detectAnomalies = out;
            return out;
          },
        },

        draftEmailToFacilityManager: {
          description:
            "Drafts an email to the facility manager about detected anomalies and recommended actions.",
          inputSchema: z.object({
            facilityName: z.string().default("Main Facility"),
            month: z.string(),
            anomalyConsumption: z.number(),
            threshold: z.number(),
            cost: z.number().optional(),
            recommendations: z.array(z.string()).min(1),
          }),
          execute: async (args) => {
            const out = draftEmailToFacilityManager(args);
            toolOutputs.draftEmailToFacilityManager = out;
            return out;
          },
        },
      },
    });

    // 2) Guarantee a final response: "Writer" step
    // If the agent never called detectAnomalies, we still provide a sensible response.
    const fallbackAnomalies =
      toolOutputs.detectAnomalies ?? detectAnomalies(rows);

    const final = await generateText({
      model: openaiProvider(modelId),
      system: `
You are an energy analyst.
Write a clear final answer in plain text with bullet points.

You will receive:
- the user request
- tool outputs (if any)

Output format:
1) Summary
2) Findings
3) 3 Recommendations
4) If an email draft exists, include it under "Draft email" with Subject + Body.
`,
      prompt: `
User request:
${message}

Tool outputs:
${JSON.stringify({ ...toolOutputs, fallbackAnomalies }, null, 2)}
`,
    });

    const text =
      final.text?.trim() ||
      `⚠️ Model returned empty text.\n\nTool outputs:\n${JSON.stringify(
        { ...toolOutputs, fallbackAnomalies },
        null,
        2,
      )}`;

    return new Response(text, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    const msg = err instanceof Error ? (err.stack ?? err.message) : String(err);
    return new Response(`❌ API crashed:\n${msg}`, { status: 500 });
  }
}
