export type EnergyRow = {
  month: string;
  consumption: number;
  cost?: number;
};

export function detectAnomalies(rows: EnergyRow[]) {
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

export function draftEmailToFacilityManager(params: {
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
    subject: `Energy consumption alert - ${facilityName} - ${month}`,
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
