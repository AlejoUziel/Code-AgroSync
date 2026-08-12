export type DepartmentLocation = {
  key: string;
  city: string;
  department: string;
  region: string;
  latitude: number;
  longitude: number;
};

export type AgroClimateData = {
  location: DepartmentLocation;
  observedAt: string;
  weather: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
    precipitationProbability: number;
    weatherCode: number;
    condition: string;
  };
  soil: {
    moistureSurface: number;
    moistureRootZone: number;
    evapotranspiration: number;
    precipitationToday: number;
    waterBalance: number;
    status: string;
  };
  agriculturalRisk: string;
  recommendation: string;
  source: "Open-Meteo";
  modelNotice: string;
};

export const HONDURAS_DEPARTMENTS: DepartmentLocation[] = [
  { key: "atlantida", city: "La Ceiba", department: "Atlántida", region: "Litoral Atlántico", latitude: 15.7597, longitude: -86.7822 },
  { key: "colon", city: "Trujillo", department: "Colón", region: "Nororiente", latitude: 15.9167, longitude: -85.9533 },
  { key: "comayagua", city: "Comayagua", department: "Comayagua", region: "Centro", latitude: 14.4514, longitude: -87.6375 },
  { key: "copan", city: "Santa Rosa de Copán", department: "Copán", region: "Occidente", latitude: 14.7667, longitude: -88.7797 },
  { key: "cortes", city: "San Pedro Sula", department: "Cortés", region: "Norte", latitude: 15.5042, longitude: -88.025 },
  { key: "choluteca", city: "Choluteca", department: "Choluteca", region: "Sur", latitude: 13.3003, longitude: -87.1908 },
  { key: "el-paraiso", city: "Yuscarán", department: "El Paraíso", region: "Oriente", latitude: 13.9439, longitude: -86.8527 },
  { key: "francisco-morazan", city: "Tegucigalpa", department: "Francisco Morazán", region: "Centro", latitude: 14.0723, longitude: -87.1921 },
  { key: "gracias-a-dios", city: "Puerto Lempira", department: "Gracias a Dios", region: "La Mosquitia", latitude: 15.2667, longitude: -83.7722 },
  { key: "intibuca", city: "La Esperanza", department: "Intibucá", region: "Occidente", latitude: 14.3068, longitude: -88.1803 },
  { key: "islas-de-la-bahia", city: "Roatán", department: "Islas de la Bahía", region: "Insular", latitude: 16.3167, longitude: -86.5333 },
  { key: "la-paz", city: "La Paz", department: "La Paz", region: "Centro", latitude: 14.3194, longitude: -87.6792 },
  { key: "lempira", city: "Gracias", department: "Lempira", region: "Occidente", latitude: 14.5903, longitude: -88.5819 },
  { key: "ocotepeque", city: "Nueva Ocotepeque", department: "Ocotepeque", region: "Occidente", latitude: 14.4333, longitude: -89.1833 },
  { key: "olancho", city: "Juticalpa", department: "Olancho", region: "Oriente", latitude: 14.6667, longitude: -86.2194 },
  { key: "santa-barbara", city: "Santa Bárbara", department: "Santa Bárbara", region: "Occidente", latitude: 14.9194, longitude: -88.2361 },
  { key: "valle", city: "Nacaome", department: "Valle", region: "Sur", latitude: 13.5361, longitude: -87.4875 },
  { key: "yoro", city: "Yoro", department: "Yoro", region: "Centro-norte", latitude: 15.1375, longitude: -87.1278 },
];

export function weatherCondition(code: number) {
  if (code === 0) return "Despejado";
  if (code <= 3) return "Parcialmente nublado";
  if (code === 45 || code === 48) return "Niebla";
  if (code <= 57) return "Llovizna";
  if (code <= 67) return "Lluvia";
  if (code <= 77) return "Precipitación sólida";
  if (code <= 82) return "Chubascos";
  if (code <= 86) return "Chubascos fuertes";
  if (code >= 95) return "Tormenta eléctrica";
  return "Condición variable";
}

export function soilMoistureStatus(moisture: number) {
  if (moisture < 0.15) return "Muy seco";
  if (moisture < 0.25) return "Humedad baja";
  if (moisture <= 0.4) return "Humedad adecuada";
  if (moisture <= 0.5) return "Humedad alta";
  return "Posible saturación";
}

export function agriculturalAssessment(input: {
  temperature: number;
  precipitationProbability: number;
  soilMoisture: number;
  waterBalance: number;
}) {
  const { temperature, precipitationProbability, soilMoisture, waterBalance } = input;
  if (precipitationProbability >= 75 && soilMoisture >= 0.45) {
    return { risk: "Anegamiento probable", recommendation: "Revisar drenajes y posponer riego o fertilización superficial." };
  }
  if (temperature >= 34 && soilMoisture < 0.2) {
    return { risk: "Estrés hídrico alto", recommendation: "Priorizar riego temprano, cobertura del suelo y vigilancia de marchitez." };
  }
  if (soilMoisture < 0.2 || waterBalance < -3) {
    return { risk: "Riego recomendado", recommendation: "Verificar humedad en campo y programar riego según cultivo y textura real." };
  }
  if (soilMoisture > 0.45) {
    return { risk: "Humedad elevada", recommendation: "Evitar labores que compacten el suelo y comprobar drenaje en zonas bajas." };
  }
  return { risk: "Condición estable", recommendation: "Mantener monitoreo y confirmar la humedad antes de aplicar fertilizante." };
}

export function percentMoisture(value: number) {
  return Math.round(value * 1000) / 10;
}
