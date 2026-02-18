"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";

type Row = Record<string, unknown>;

const SAMPLE_ROWS: Row[] = [
  { month: "2025-01", consumption: 1200, cost: 230.5 },
  { month: "2025-02", consumption: 1180, cost: 225.1 },
  { month: "2025-03", consumption: 1800, cost: 340.0 },
  { month: "2025-04", consumption: 1210, cost: 232.2 },
  { month: "2025-05", consumption: 1195, cost: 228.9 },
];

function coerceValue(raw: unknown) {
  if (raw === null || raw === undefined) return null;

  const s = String(raw).trim();
  if (s === "") return null;

  // boolean
  if (s.toLowerCase() === "true") return true;
  if (s.toLowerCase() === "false") return false;

  // number (supports "1234", "1234.56", "1,234.56", "1234,56")
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  // If it has comma but no dot => likely decimal comma: "1234,56"
  // If it has both, we assume comma is thousands: "1,234.56"
  let normalized = s;
  if (hasComma && !hasDot) {
    normalized = s.replace(",", ".");
  } else if (hasComma && hasDot) {
    normalized = s.replace(/,/g, "");
  }

  // remove spaces inside numbers "1 234" -> "1234"
  normalized = normalized.replace(/\s+/g, "");

  if (/^-?\d+(\.\d+)?$/.test(normalized)) {
    const n = Number(normalized);
    if (!Number.isNaN(n)) return n;
  }

  return s;
}

function normalizeRows(inputRows: Row[]) {
  return inputRows.map((row) => {
    const out: Row = {};
    for (const [k, v] of Object.entries(row)) {
      out[k] = coerceValue(v);
    }
    return out;
  });
}
function normalizeHeaderKey(key: string) {
  const k = key.trim().toLowerCase();

  const monthKeys = ["month", "date", "period", "mes", "m\u00EAs", "data"];
  const consumptionKeys = [
    "consumption",
    "kwh",
    "usage",
    "energy",
    "consumo",
    "energia",
  ];
  const costKeys = [
    "cost",
    "price",
    "amount",
    "value",
    "custo",
    "preco",
    "pre\u00E7o",
    "valor",
  ];

  if (monthKeys.includes(k)) return "month";
  if (consumptionKeys.includes(k)) return "consumption";
  if (costKeys.includes(k)) return "cost";

  return k.replace(/\s+/g, "_");
}

function normalizeRowKeys(row: Row): Row {
  const out: Row = {};
  for (const [key, value] of Object.entries(row)) {
    out[normalizeHeaderKey(key)] = value;
  }
  return out;
}

function normalizeRowsKeys(rows: Row[]) {
  return rows.map(normalizeRowKeys);
}

function detectDelimiter(firstLine: string) {
  const commaCount = (firstLine.match(/,/g) ?? []).length;
  const semicolonCount = (firstLine.match(/;/g) ?? []).length;

  if (semicolonCount > commaCount) return ";";
  return ",";
}

export default function Home() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string>("");

  const previewRows = useMemo(() => rows.slice(0, 10), [rows]);

  function handleJson(text: string) {
    const parsed = JSON.parse(text);
    const data = Array.isArray(parsed) ? parsed : parsed?.data;

    if (!Array.isArray(data)) {
      throw new Error(
        "JSON must be an array of rows, or an object with a 'data' array.",
      );
    }

    return normalizeRows(normalizeRowsKeys(data as Row[]));
  }

  function handleCsv(text: string) {
    const firstLine =
      text.split(/\r?\n/).find((l) => l.trim().length > 0) ?? "";
    const delimiter = detectDelimiter(firstLine);

    const result = Papa.parse<Row>(text, {
      header: true,
      skipEmptyLines: true,
      delimiter,
      transform: (value) => value.trim(),
    });

    if (result.errors?.length) {
      // show first error only (keeps UI clean)
      throw new Error(`CSV parse error: ${result.errors[0].message}`);
    }

    // PapaParse may return empty rows if headers are weird; filter just in case
    const clean = (result.data ?? []).filter((r) => Object.keys(r).length > 0);
    if (clean.length === 0) {
      throw new Error(
        "CSV parsed but no rows were found. Check headers/format.",
      );
    }

    return normalizeRows(normalizeRowsKeys(clean));
  }

  function handleFile(file: File) {
    setError("");
    setRows([]);
    setFileName(file.name);

    const lower = file.name.toLowerCase();
    const isJson = lower.endsWith(".json");
    const isCsv = lower.endsWith(".csv");

    if (!isJson && !isCsv) {
      setError("Please upload a .json or .csv file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const text = String(reader.result ?? "");

        const parsedRows = isJson ? handleJson(text) : handleCsv(text);
        setRows(parsedRows);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Could not parse file.";
        setError(msg);
      }
    };

    reader.onerror = () => setError("Could not read file.");
    reader.readAsText(file);
  }

  const avgConsumption =
    rows.length > 0
      ? rows.reduce((sum, r) => sum + Number(r.consumption ?? 0), 0) /
        rows.length
      : 0;

  const threshold = avgConsumption * 1.3;

  const peakRow =
    rows.length > 0
      ? rows.reduce((max, r) =>
          Number(r.consumption ?? 0) > Number(max.consumption ?? 0) ? r : max,
        )
      : null;

  const peakMonth = peakRow ? String(peakRow.month ?? "-") : "-";
  const peakValue = peakRow ? Number(peakRow.consumption ?? 0) : 0;

  return (
    <main className="min-h-screen bg-(--color-surface) p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-(--color-brand)/10 flex items-center justify-center text-(--color-brand) font-bold">
              G2C
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-(--color-text-primary)">
                Energy Intelligence Dashboard
              </h1>
              <p className="text-sm text-(--color-text-secondary)">
                Corporate-grade insights for sustainability & operational
                efficiency
              </p>
            </div>
          </div>
        </header>

        {/* Responsive 2-column layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* LEFT: Upload + Preview */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-(--color-text-primary)">
                1) Upload
              </h2>
              <p className="text-sm text-(--color-text-secondary)">
                Accepted: <span className="font-medium">.json</span>,{" "}
                <span className="font-medium">.csv</span> (auto-detect comma or
                semicolon delimiter).
              </p>

              <div className="mt-4">
                <div
                  className={`relative rounded-2xl border-2 p-8 text-center transition ${
                    fileName
                      ? "border-(--color-brand)/30 bg-(--color-brand)/5"
                      : "border-dashed border-gray-300 bg-(--color-surface) hover:border-(--color-brand) hover:bg-white"
                  }`}
                >
                  <input
                    type="file"
                    accept=".json,application/json,.csv,text/csv"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    title="Upload energy report file"
                    placeholder="Select a .json or .csv file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />

                  <div className="space-y-2 pointer-events-none">
                    <div
                      className={`text-3xl ${
                        fileName ? "text-green-600" : "text-(--color-text-secondary)"
                      }`}
                    >
                      {fileName ? "✓" : "↑"}
                    </div>

                    <p className="text-sm font-medium text-(--color-text-primary)">
                      {fileName ? "Data ready" : "Upload Energy Report"}
                    </p>

                    <p className="text-xs text-(--color-text-secondary)">
                      {fileName
                        ? "You can now preview the data and run the AI analysis."
                        : "Drag & drop your CSV or JSON file here"}
                    </p>

                    {!fileName ? (
                      <p className="text-xs text-(--color-text-secondary)">
                        or{" "}
                        <span className="text-(--color-brand) font-medium">
                          click to select a file
                        </span>
                      </p>
                    ) : null}
                  </div>
                </div>

                {fileName ? (
                  <div className="mt-3 rounded-lg border border-(--color-brand)/25 bg-(--color-brand)/5 px-4 py-2 text-sm text-(--color-brand)">
                    File loaded:{" "}
                    <span className="font-medium">{fileName}</span>
                  </div>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setError("");
                    setFileName("sample (in-app)");
                    setRows(SAMPLE_ROWS);
                  }}
                >
                  Use sample data
                </button>

                <button
                  type="button"
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setError("");
                    setFileName("");
                    setRows([]);
                  }}
                >
                  Clear
                </button>
              </div>

              {fileName ? (
                <p className="mt-2 text-sm text-neutral-600">
                  Selected: <span className="font-medium">{fileName}</span>
                </p>
              ) : null}

              {error ? (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              ) : null}
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-(--color-text-primary)">
                    2) Preview
                  </h2>
                  <p className="text-sm text-(--color-text-secondary)">
                    Showing up to 10 rows.
                  </p>
                </div>

                {rows.length > 0 ? (
                  <span className="rounded-full bg-(--color-brand)/10 px-3 py-1 text-xs font-medium text-(--color-brand)">
                    Loaded {rows.length} rows
                  </span>
                ) : null}
              </div>

              {/* KPI cards (OUTSIDE the table container) */}
              {rows.length > 0 ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-(--color-brand)/20 bg-(--color-brand)/5 p-4">
                    <div className="text-xs text-(--color-text-secondary)">
                      Average
                    </div>
                    <div className="mt-1 text-xl font-semibold text-(--color-text-primary)">
                      {avgConsumption.toFixed(0)}
                    </div>
                    <div className="mt-1 text-xs text-(--color-text-secondary)">
                      units per period
                    </div>
                  </div>

                  <div className="rounded-2xl border border-(--color-brand)/20 bg-(--color-brand)/5 p-4">
                    <div className="text-xs text-(--color-text-secondary)">
                      Threshold
                    </div>
                    <div className="mt-1 text-xl font-semibold text-(--color-text-primary)">
                      {threshold.toFixed(0)}
                    </div>
                    <div className="mt-1 text-xs text-(--color-text-secondary)">
                      avg x 1.3
                    </div>
                  </div>

                  <div className="rounded-2xl border border-(--color-brand)/20 bg-(--color-brand)/5 p-4">
                    <div className="text-xs text-(--color-text-secondary)">
                      Peak Month
                    </div>
                    <div className="mt-1 text-xl font-semibold text-(--color-text-primary)">
                      {peakMonth}
                    </div>
                    <div className="mt-1 text-xs text-(--color-text-secondary)">
                      {peakValue ? `${peakValue.toFixed(0)} units` : "-"}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Table container (ONLY table / empty state) */}
              <div className="mt-4 overflow-hidden rounded-2xl border border-(--color-brand)/20 bg-white">
                {previewRows.length === 0 ? (
                  <div className="p-6 text-sm text-(--color-text-secondary)">
                    No data yet. Upload a file or use sample data.
                  </div>
                ) : (
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-(--color-brand)/10 border-b border-(--color-brand)/15">
                          {Object.keys(previewRows[0]).map((key) => (
                            <th
                              key={key}
                              className="px-4 py-3 text-left font-semibold text-(--color-brand)"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {previewRows.map((row, idx) => (
                          <tr
                            key={idx}
                            className={`transition-colors hover:bg-(--color-brand)/5 ${
                              idx % 2 === 0
                                ? "bg-white"
                                : "bg-(--color-brand)/5"
                            }`}
                          >
                            {Object.keys(previewRows[0]).map((key) => (
                              <td
                                key={key}
                                className="px-4 py-3 text-(--color-text-primary)"
                              >
                                {row[key] === null ? "" : String(row[key])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT: Agent Panel */}
          <AgentPanel
            hasData={rows.length > 0}
            rows={rows}
          />
        </div>
      </div>
    </main>
  );
}

function AgentPanel({
  hasData,
  rows,
}: {
  hasData: boolean;
  rows: Row[];
}) {
  const [message, setMessage] = useState(
    "Find anomalies and suggest 3 optimization ideas.",
  );
  const [facilityName, setFacilityName] = useState("Main Facility");
  const [resultText, setResultText] = useState<string>("");
  type AgentResult = {
    finalText?: string;
    toolsUsed?: string[];
    toolOutputs?: {
      draftEmailToFacilityManager?: {
        subject?: string;
        body?: string;
      };
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };

  const [resultJson, setResultJson] = useState<AgentResult | null>(null);
  const email = resultJson?.toolOutputs?.draftEmailToFacilityManager ?? null;
  const finalText: string = resultJson?.finalText ?? resultText ?? "";
  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  }

  function downloadTextFile(filename: string, content: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  const toolsUsed = (resultJson?.toolsUsed ?? []).join(", ") || "-";

  const reportText = resultJson
    ? [
        "Energy Intelligence Dashboard - Report",
        `Generated: ${new Date().toISOString()}`,
        "",
        "User request:",
        message || "-",
        "",
        `Tools used: ${toolsUsed}`,
        "",
        "Agent answer:",
        finalText || "-",
        "",
        email
          ? [
              "Draft email:",
              `Subject: ${email.subject}`,
              "",
              email.body,
              "",
            ].join("\n")
          : "Draft email: -",
        "",
        "Tool outputs (raw):",
        JSON.stringify(resultJson.toolOutputs ?? {}, null, 2),
      ].join("\n")
    : "";

  function stripEmailSection(text: string) {
    const markers = ["draft email", "email draft", "subject:", "body:"];
    const lower = text.toLowerCase();

    const idx = markers
      .map((m) => lower.indexOf(m))
      .filter((i) => i >= 0)
      .sort((a, b) => a - b)[0];

    return idx >= 0 ? text.slice(0, idx).trim() : text.trim();
  }

  const answerText = email ? stripEmailSection(finalText) : finalText;
  const answerSections = (() => {
    const text = answerText.trim();
    if (!text) return [];

    const lines = text.split("\n");
    const sections: string[] = [];
    let current: string[] = [];

    for (const line of lines) {
      if (/^\s*\d+\)\s+/.test(line) && current.length > 0) {
        sections.push(current.join("\n").trim());
        current = [line];
      } else {
        current.push(line);
      }
    }

    if (current.length > 0) {
      sections.push(current.join("\n").trim());
    }

    return sections.filter(Boolean);
  })();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-(--color-text-primary)">
              3) Ask the Agent
            </h2>
            <p className="text-sm text-(--color-text-secondary)">
              Data loaded: {rows.length} rows.
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              rows.length > 0
                ? "bg-(--color-brand)/10 text-(--color-brand)"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {rows.length > 0 ? "Ready" : "Waiting for data"}
          </span>
        </div>
        <div className="mt-4 space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-700">
                Facility name
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-(--color-brand) focus:ring-2 focus:ring-(--color-brand)/20"
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                placeholder="e.g., Lisbon HQ"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="quick-prompts"
                className="text-xs font-medium text-neutral-700"
              >
                Quick prompts
              </label>
              <select
                id="quick-prompts"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-(--color-brand) focus:ring-2 focus:ring-(--color-brand)/20"
                onChange={(e) => {
                  const v = e.target.value;
                  if (v) setMessage(v);
                }}
                defaultValue=""
              >
                <option value="" disabled>
                  Choose...
                </option>
                <option value="Find anomalies and suggest 3 optimization ideas.">
                  Anomalies + optimizations
                </option>
                <option value="Find anomalies and draft an email to the facility manager.">
                  Anomalies + email draft
                </option>
                <option value="Create an executive summary for leadership.">
                  Executive summary
                </option>
              </select>
            </div>
          </div>

          <textarea
            className="mt-3 min-h-[120px] w-full resize-y rounded-xl border border-gray-300 bg-(--color-surface) p-3 text-sm outline-none transition focus:border-(--color-brand) focus:ring-2 focus:ring-(--color-brand)/20"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask something like: Detect anomalies, suggest improvements, generate a summary..."
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg bg-(--color-brand) px-4 py-2 text-sm font-medium text-white hover:bg-(--color-brand-dark) transition-colors disabled:opacity-50"
              disabled={!hasData || message.trim().length === 0}
              onClick={async () => {
                try {
                  setResultText("Analyzing...");
                  setResultJson(null);

                  const res = await fetch("/api/agent", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message, rows, facilityName }),
                  });

                  const text = await res.text();

                  if (!res.ok) {
                    setResultText(`[ERROR] API error (${res.status})\n${text}`);
                    return;
                  }

                  try {
                    const parsed = JSON.parse(text);
                    setResultJson(parsed);
                    setResultText(parsed.finalText ?? "");
                  } catch {
                    // fallback if server responds with plain text
                    setResultText(
                      text.trim() ? text : "[WARN] Empty response from API.",
                    );
                  }
                } catch (err) {
                  setResultText(`[ERROR] Request failed\n${String(err)}`);
                }
              }}
            >
              Analyze
            </button>

            <button
              type="button"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => {
                setResultText("");
                setResultJson(null);
              }}
            >
              Clear result
            </button>
          </div>

          <p className="mt-3 text-xs text-(--color-text-secondary)">
            Tip: try asking for anomalies, optimizations, or an email draft for
            the facility manager.
          </p>
        </div>
      </section>
      <section className="rounded-2xl border border-(--color-brand)/25 bg-(--color-brand)/3 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-(--color-text-primary)">
              4) Results
            </h2>
            <p className="text-sm text-(--color-text-secondary)">
              AI agent output and tool execution proof.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {resultJson ? (
              <button
                type="button"
                onClick={() =>
                  downloadTextFile(
                    `energy-report-${new Date().toISOString().slice(0, 10)}.txt`,
                    reportText,
                  )
                }
                className="rounded-lg bg-(--color-brand) px-3 py-2 text-xs font-medium text-white hover:bg-(--color-brand-dark) transition"
              >
                Download report
              </button>
            ) : null}
          </div>
          {resultJson?.toolsUsed?.length ? (
            <span className="rounded-full bg-(--color-brand)/10 px-3 py-1 text-xs font-medium text-(--color-brand)">
              Tools: {resultJson.toolsUsed.length}
            </span>
          ) : null}
        </div>

        {/* Empty state */}
        {!finalText ? (
          <div className="mt-4 rounded-xl border border-gray-200 bg-(--color-surface) p-5 text-sm text-(--color-text-secondary)">
            No results yet. Run an analysis to see the agent output here.
          </div>
        ) : (
          <div className="mt-4 grid gap-4">
            {/* Summary / Answer */}
            <div className="rounded-2xl border border-(--color-brand)/25 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-medium uppercase tracking-wide text-(--color-brand)">
                  Agent answer
                </div>
                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-(--color-text-secondary)">
                  Generated
                </span>
              </div>
              <div className="mt-4 space-y-4 text-sm text-(--color-text-primary)">
                {(answerSections.length > 0 ? answerSections : [answerText])
                  .filter((chunk) => chunk.trim().length > 0)
                  .map((chunk, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-(--color-surface) p-4"
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {chunk}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Email preview (if tool used) */}
            {email ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-(--color-brand)">
                    Draft email
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        `Subject: ${email.subject ?? ""}\n\n${email.body ?? ""}`,
                      )
                    }
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    Copy all
                  </button>
                </div>

                <div className="mt-3 space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-(--color-text-secondary)">
                        Subject
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(email.subject ?? "")}
                        className="rounded-md bg-(--color-brand)/10 px-2 py-1 text-[10px] font-semibold text-(--color-brand) hover:bg-(--color-brand)/15 transition"
                      >
                        Copy
                      </button>
                    </div>

                    <div className="mt-1 rounded-lg bg-(--color-surface) p-3 text-sm text-(--color-text-primary)">
                      {email.subject}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-(--color-text-secondary)">
                        Body
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(email.body ?? "")}
                        className="rounded-md bg-(--color-brand)/10 px-2 py-1 text-[10px] font-semibold text-(--color-brand) hover:bg-(--color-brand)/15 transition"
                      >
                        Copy
                      </button>
                    </div>

                    <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-(--color-surface) p-3 text-xs text-(--color-text-primary)">
                      {email.body}
                    </pre>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Tool proof (collapsible) */}
            {resultJson ? (
              <details className="rounded-2xl border border-gray-200 bg-white p-5">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs font-medium uppercase tracking-wide text-(--color-brand)">
                      Tool proof (debug)
                    </div>
                    <div className="text-xs text-(--color-text-secondary)">
                      Tools used:{" "}
                      {(resultJson.toolsUsed ?? []).join(", ") || "-"}
                    </div>
                  </div>
                </summary>

                <div className="mt-4 space-y-3">
                  <div>
                    <div className="text-xs text-(--color-text-secondary)">
                      Tool outputs
                    </div>
                    <pre className="mt-2 overflow-auto rounded-lg bg-(--color-surface) p-3 text-xs text-(--color-text-primary)">
                      {JSON.stringify(resultJson.toolOutputs, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <div className="text-xs text-(--color-text-secondary)">
                      Raw response
                    </div>
                    <pre className="mt-2 overflow-auto rounded-lg bg-(--color-surface) p-3 text-xs text-(--color-text-primary)">
                      {JSON.stringify(resultJson, null, 2)}
                    </pre>
                  </div>
                </div>
              </details>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}

