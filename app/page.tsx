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

function detectDelimiter(firstLine: string) {
  const commaCount = (firstLine.match(/,/g) ?? []).length;
  const semicolonCount = (firstLine.match(/;/g) ?? []).length;

  if (semicolonCount > commaCount) return ";";
  return ",";
}

export default function Home() {
  const [fileName, setFileName] = useState<string>("");
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

    return normalizeRows(data as Row[]);
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

    return normalizeRows(clean);
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

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Energy Report Analyzer</h1>
          <p className="text-sm text-neutral-600">
            Upload a JSON/CSV report, preview it, then ask an AI agent to
            analyze anomalies and suggest actions.
          </p>
        </header>

        {/* Responsive 2-column layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* LEFT: Upload + Preview */}
          <div className="space-y-6">
            <section className="rounded-xl border p-4">
              <h2 className="text-lg font-medium">1) Upload</h2>
              <p className="text-sm text-neutral-600">
                Accepted: <span className="font-medium">.json</span>,{" "}
                <span className="font-medium">.csv</span> (auto-detect “,” /
                “;”).
              </p>

              <div className="mt-3">
                <input
                  type="file"
                  accept=".json,application/json,.csv,text/csv"
                  className="block w-full text-sm"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-black/5"
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
                  className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-black/5"
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

            <section className="rounded-xl border p-4">
              <h2 className="text-lg font-medium">2) Preview</h2>
              <p className="text-sm text-neutral-600">Showing up to 10 rows.</p>

              <div className="mt-4 overflow-auto rounded-lg border bg-white">
                {previewRows.length === 0 ? (
                  <div className="p-4 text-sm text-neutral-600">
                    No data yet.
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-black/5">
                      <tr>
                        {Object.keys(previewRows[0]).map((key) => (
                          <th
                            key={key}
                            className="px-3 py-2 text-left font-medium"
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, idx) => (
                        <tr key={idx} className="border-t">
                          {Object.keys(previewRows[0]).map((key) => (
                            <td key={key} className="px-3 py-2">
                              {row[key] === null ? "" : String(row[key])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {rows.length > 0 ? (
                <p className="mt-2 text-xs text-neutral-500">
                  Loaded {rows.length} rows.
                </p>
              ) : null}
            </section>
          </div>

          {/* RIGHT: Agent Panel */}
          <AgentPanel hasData={rows.length > 0} rowsCount={rows.length} />
        </div>
      </div>
    </main>
  );
}

function AgentPanel({
  hasData,
  rowsCount,
}: {
  hasData: boolean;
  rowsCount: number;
}) {
  const [message, setMessage] = useState(
    "Find anomalies and suggest 3 optimization ideas. Summarize in bullet points.",
  );
  const [result, setResult] = useState<string>("");

  return (
    <div className="space-y-6">
      <section className="rounded-xl border p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium">3) Ask the Agent</h2>
            <p className="text-sm text-neutral-600">
              {hasData ? (
                <>
                  Data loaded: <span className="font-medium">{rowsCount}</span>{" "}
                  rows.
                </>
              ) : (
                "Load data first (upload or sample) to enable analysis."
              )}
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              hasData
                ? "bg-green-100 text-green-800"
                : "bg-neutral-100 text-neutral-700"
            }`}
          >
            {hasData ? "Ready" : "Waiting for data"}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          <textarea
            className="min-h-[120px] w-full resize-y rounded-lg border p-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask something like: Detect anomalies, suggest improvements, generate a summary..."
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-50"
              disabled={!hasData || message.trim().length === 0}
              onClick={() => {
                // Stub: Day 2 will call our API route (agent + tool)
                setResult(
                  "✅ (Stub)\n- Anomaly detected in 2025-03 (consumption spike)\n- Suggestion: shift usage to off-peak hours\n- Suggestion: investigate HVAC efficiency\n- Suggestion: set monthly budget alerts",
                );
              }}
            >
              Analyze
            </button>

            <button
              type="button"
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-black/5"
              onClick={() => setResult("")}
            >
              Clear result
            </button>
          </div>

          <p className="text-xs text-neutral-500">
            Next step: connect this button to an API route that runs an AI agent
            with tool calling.
          </p>
        </div>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="text-lg font-medium">4) Results</h2>
        <p className="text-sm text-neutral-600">
          Agent output will appear here.
        </p>

        <div className="mt-4 min-h-[180px] whitespace-pre-wrap rounded-lg border bg-white p-4 text-sm">
          {result ? (
            result
          ) : (
            <span className="text-neutral-500">No results yet.</span>
          )}
        </div>
      </section>
    </div>
  );
}
