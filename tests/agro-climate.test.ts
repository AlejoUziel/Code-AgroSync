import { describe, expect, it } from "vitest";
import {
  HONDURAS_DEPARTMENTS,
  agriculturalAssessment,
  soilMoistureStatus,
  weatherCondition,
} from "@/lib/agro-climate";

describe("agro-climate", () => {
  it("incluye los 18 departamentos de Honduras", () => {
    expect(HONDURAS_DEPARTMENTS).toHaveLength(18);
    expect(new Set(HONDURAS_DEPARTMENTS.map((item) => item.key)).size).toBe(18);
  });

  it("traduce códigos meteorológicos y clasifica humedad", () => {
    expect(weatherCondition(0)).toBe("Despejado");
    expect(weatherCondition(95)).toBe("Tormenta eléctrica");
    expect(soilMoistureStatus(0.12)).toBe("Muy seco");
    expect(soilMoistureStatus(0.32)).toBe("Humedad adecuada");
  });

  it("prioriza riesgo de anegamiento y estrés hídrico", () => {
    expect(
      agriculturalAssessment({ temperature: 29, precipitationProbability: 85, soilMoisture: 0.5, waterBalance: 8 }).risk
    ).toBe("Anegamiento probable");
    expect(
      agriculturalAssessment({ temperature: 36, precipitationProbability: 5, soilMoisture: 0.12, waterBalance: -5 }).risk
    ).toBe("Estrés hídrico alto");
  });
});
