import {
  HONDURAS_DEPARTMENTS,
  agriculturalAssessment,
  percentMoisture,
  soilMoistureStatus,
  weatherCondition,
} from "@/lib/agro-climate";
import { requireSession } from "@/lib/authorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OpenMeteoResponse = {
  current?: {
    time?: string;
    temperature_2m?: number;
    relative_humidity_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    precipitation?: number;
  };
  hourly?: {
    time?: string[];
    precipitation_probability?: number[];
    soil_moisture_0_to_1cm?: number[];
    soil_moisture_3_to_9cm?: number[];
  };
  daily?: {
    et0_fao_evapotranspiration?: number[];
    precipitation_sum?: number[];
  };
};

function finite(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function closestHourIndex(times: string[] = [], currentTime = "") {
  if (!times.length) return 0;
  const current = Date.parse(currentTime);
  if (!Number.isFinite(current)) return 0;
  return times.reduce((best, value, index) => {
    const distance = Math.abs(Date.parse(value) - current);
    const bestDistance = Math.abs(Date.parse(times[best]) - current);
    return distance < bestDistance ? index : best;
  }, 0);
}

export async function GET(request: Request) {
  await requireSession();
  const requested = new URL(request.url).searchParams.get("department") ?? "francisco-morazan";
  const location = HONDURAS_DEPARTMENTS.find((item) => item.key === requested);
  if (!location) return Response.json({ message: "Departamento no válido." }, { status: 400 });

  const apiKey = process.env.OPEN_METEO_API_KEY;
  const endpoint = apiKey ? "https://customer-api.open-meteo.com/v1/forecast" : "https://api.open-meteo.com/v1/forecast";
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    timezone: "America/Tegucigalpa",
    forecast_days: "1",
    current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation",
    hourly: "precipitation_probability,soil_moisture_0_to_1cm,soil_moisture_3_to_9cm",
    daily: "et0_fao_evapotranspiration,precipitation_sum",
  });
  if (apiKey) params.set("apikey", apiKey);

  try {
    const response = await fetch(`${endpoint}?${params}`, {
      signal: AbortSignal.timeout(8_000),
      next: { revalidate: 600 },
    });
    if (!response.ok) throw new Error(`Open-Meteo respondió ${response.status}`);
    const data = (await response.json()) as OpenMeteoResponse;
    if (!data.current || !data.hourly || !data.daily) throw new Error("Respuesta meteorológica incompleta");

    const index = closestHourIndex(data.hourly.time, data.current.time);
    const temperature = finite(data.current.temperature_2m);
    const rootMoisture = finite(data.hourly.soil_moisture_3_to_9cm?.[index]);
    const precipitationProbability = finite(data.hourly.precipitation_probability?.[index]);
    const evapotranspiration = finite(data.daily.et0_fao_evapotranspiration?.[0]);
    const precipitationToday = finite(data.daily.precipitation_sum?.[0]);
    const waterBalance = Math.round((precipitationToday - evapotranspiration) * 10) / 10;
    const assessment = agriculturalAssessment({
      temperature,
      precipitationProbability,
      soilMoisture: rootMoisture,
      waterBalance,
    });

    return Response.json(
      {
        location,
        observedAt: data.current.time ?? new Date().toISOString(),
        weather: {
          temperature: Math.round(temperature),
          humidity: Math.round(finite(data.current.relative_humidity_2m)),
          windSpeed: Math.round(finite(data.current.wind_speed_10m)),
          precipitation: finite(data.current.precipitation),
          precipitationProbability: Math.round(precipitationProbability),
          weatherCode: finite(data.current.weather_code),
          condition: weatherCondition(finite(data.current.weather_code)),
        },
        soil: {
          moistureSurface: percentMoisture(finite(data.hourly.soil_moisture_0_to_1cm?.[index])),
          moistureRootZone: percentMoisture(rootMoisture),
          evapotranspiration,
          precipitationToday,
          waterBalance,
          status: soilMoistureStatus(rootMoisture),
        },
        agriculturalRisk: assessment.risk,
        recommendation: assessment.recommendation,
        source: "Open-Meteo",
        modelNotice: "Estimación meteorológica por coordenada departamental; no sustituye muestreo ni análisis de laboratorio del suelo.",
      },
      { headers: { "Cache-Control": "private, max-age=0, s-maxage=600, stale-while-revalidate=1800" } }
    );
  } catch (error) {
    console.error("[AgroSync:agro-climate]", error);
    return Response.json(
      { message: "No fue posible obtener datos agroclimáticos actuales. Intenta nuevamente." },
      { status: 503 }
    );
  }
}
