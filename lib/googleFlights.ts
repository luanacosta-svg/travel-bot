export function buildGoogleFlightsUrl(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate?: string,
  passengers: number = 1
): string {
  const base = "https://www.google.com/flights?hl=pt-BR&gl=BR&curr=BRL";
  const pax = passengers > 1 ? `&travelers=${passengers}` : "";

  if (returnDate) {
    return `${base}${pax}#flt=${origin.toUpperCase()}.${destination.toUpperCase()}.${departureDate}*${destination.toUpperCase()}.${origin.toUpperCase()}.${returnDate};tt:r`;
  }

  return `${base}${pax}#flt=${origin.toUpperCase()}.${destination.toUpperCase()}.${departureDate};tt:o`;
}
