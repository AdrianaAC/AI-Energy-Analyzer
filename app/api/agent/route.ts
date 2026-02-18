import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { z } from "zod";
import {
  detectAnomalies,
  draftEmailToFacilityManager,
} from "@/lib/energy-tools";

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

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      message: string;
      rows: unknown;
      facilityName?: string;
    };

    const facilityName = String(body.facilityName ?? "Main Facility");

    const rows = RowsSchema.parse(body.rows);
    const message = String(body.message ?? "");
    const normalizedMessage = message.toLowerCase();
    const wantsEmail =
      normalizedMessage.includes("email") ||
      normalizedMessage.includes("e-mail");

 
    const toolOutputs: Record<string, unknown> = {};

    
    await generateText({
      model: openaiProvider(modelId),
      system: `
You are an agent that can analyze energy datasets and take actions using tools.

Rules:
- If the user asks for anomalies/spikes, call detectAnomalies.
- Only call draftEmailToFacilityManager when the user explicitly asks for an email draft to the facility manager.
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

        ...(wantsEmail
          ? {
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
                  const out = draftEmailToFacilityManager({
                    ...args,
                    facilityName: args.facilityName || facilityName,
                  });
                  toolOutputs.draftEmailToFacilityManager = out;
                  return out;
                },
              },
            }
          : {}),
      },
    });


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
4) Include a "Draft email" section only if toolOutputs.draftEmailToFacilityManager exists.
If there is no draftEmailToFacilityManager output, do not mention draft email, subject, or body.
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
      `[WARN] Model returned empty text.\n\nTool outputs:\n${JSON.stringify(
        { ...toolOutputs, fallbackAnomalies },
        null,
        2,
      )}`;

    const payload = {
      toolsUsed: Object.keys(toolOutputs),
      toolOutputs: { ...toolOutputs, fallbackAnomalies },
      finalText: text,
    };

    return new Response(JSON.stringify(payload, null, 2), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (err) {
    const msg = err instanceof Error ? (err.stack ?? err.message) : String(err);
    return new Response(`[ERROR] API crashed:\n${msg}`, { status: 500 });
  }
}
