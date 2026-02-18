import { describe, expect, it } from "vitest";
import { detectAnomalies, draftEmailToFacilityManager } from "./energy-tools";

describe("detectAnomalies", () => {
  it("detects rows above 130% of average consumption", () => {
    const rows = [
      { month: "2025-01", consumption: 1200, cost: 230.5 },
      { month: "2025-02", consumption: 1180, cost: 225.1 },
      { month: "2025-03", consumption: 1800, cost: 340.0 },
      { month: "2025-04", consumption: 1210, cost: 232.2 },
      { month: "2025-05", consumption: 1195, cost: 228.9 },
    ];

    const out = detectAnomalies(rows);

    expect(out.average).toBeCloseTo(1317, 5);
    expect(out.threshold).toBeCloseTo(1712.1, 5);
    expect(out.anomalies).toHaveLength(1);
    expect(out.anomalies[0]?.month).toBe("2025-03");
    expect(out.summary).toContain("Detected 1 anomaly/anomalies");
  });

  it("returns no anomalies when all rows are below threshold", () => {
    const rows = [
      { month: "2025-01", consumption: 1000 },
      { month: "2025-02", consumption: 1050 },
      { month: "2025-03", consumption: 1100 },
    ];

    const out = detectAnomalies(rows);

    expect(out.anomalies).toHaveLength(0);
    expect(out.summary).toBe("No major anomalies detected.");
  });
});

describe("draftEmailToFacilityManager", () => {
  it("builds a subject and body with recommendations and optional cost", () => {
    const out = draftEmailToFacilityManager({
      facilityName: "Lisbon HQ",
      month: "2025-03",
      anomalyConsumption: 1800,
      threshold: 1712.1,
      cost: 340,
      recommendations: ["Inspect HVAC schedule", "Review night baseline"],
    });

    expect(out.subject).toContain("Lisbon HQ");
    expect(out.subject).toContain("2025-03");
    expect(out.body).toContain("Consumption: 1800 units");
    expect(out.body).toContain("threshold: 1712.10 units");
    expect(out.body).toContain("- Cost: 340");
    expect(out.body).toContain("- Inspect HVAC schedule");
    expect(out.body).toContain("- Review night baseline");
  });

  it("omits the cost line when cost is not provided", () => {
    const out = draftEmailToFacilityManager({
      facilityName: "Main Facility",
      month: "2025-04",
      anomalyConsumption: 1500,
      threshold: 1200,
      recommendations: ["Check meter calibration"],
    });

    expect(out.body).not.toContain("- Cost:");
  });
});
