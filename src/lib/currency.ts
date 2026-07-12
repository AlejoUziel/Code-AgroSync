export const currencyCode = "HNL";
export const currencySymbol = "L";

export function formatLempiras(value: number, options?: Intl.NumberFormatOptions) {
  return `${currencySymbol} ${new Intl.NumberFormat("es-HN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  }).format(value)}`;
}

export function formatCompactLempiras(value: number) {
  return `${currencySymbol} ${new Intl.NumberFormat("es-HN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)}`;
}
