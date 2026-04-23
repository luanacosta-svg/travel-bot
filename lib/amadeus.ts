import type { FlightOption } from "@/types";

interface AmadeusTokenResponse {
  access_token: string;
}

interface FlightSegment {
  departure: { iataCode: string; at: string };
  arrival: { iataCode: string; at: string };
  carrierCode: string;
  duration?: string;
  numberOfStops?: number;
}

interface FlightItinerary {
  duration: string;
  segments: FlightSegment[];
}

interface FlightOffer {
  id: string;
  price: { grandTotal: string; currency: string };
  itineraries: FlightItinerary[];
  validatingAirlineCodes?: string[];
}

async function getToken(): Promise<string> {
  const res = await fetch(
    `${process.env.AMADEUS_BASE_URL}/v1/security/oauth2/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.AMADEUS_CLIENT_ID!,
        client_secret: process.env.AMADEUS_CLIENT_SECRET!,
      }),
    }
  );
  const data: AmadeusTokenResponse = await res.json();
  return data.access_token;
}

function formatDuration(iso: string): string {
  return iso.replace("PT", "").replace("H", "h ").replace("M", "min").trim();
}

function parseOffer(offer: FlightOffer): FlightOption {
  const out = offer.itineraries[0];
  const outFirst = out.segments[0];
  const outLast = out.segments[out.segments.length - 1];

  const result: FlightOption = {
    id: offer.id,
    price: offer.price.grandTotal,
    currency: offer.price.currency,
    airline:
      offer.validatingAirlineCodes?.[0] ?? outFirst.carrierCode,
    departure: {
      airport: outFirst.departure.iataCode,
      time: outFirst.departure.at,
    },
    arrival: {
      airport: outLast.arrival.iataCode,
      time: outLast.arrival.at,
    },
    duration: formatDuration(out.duration),
    stops: out.segments.length - 1,
  };

  if (offer.itineraries[1]) {
    const ret = offer.itineraries[1];
    const retFirst = ret.segments[0];
    const retLast = ret.segments[ret.segments.length - 1];
    result.returnFlight = {
      departure: {
        airport: retFirst.departure.iataCode,
        time: retFirst.departure.at,
      },
      arrival: {
        airport: retLast.arrival.iataCode,
        time: retLast.arrival.at,
      },
      duration: formatDuration(ret.duration),
      stops: ret.segments.length - 1,
    };
  }

  return result;
}

export async function searchFlights(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate?: string,
  adults: number = 1
): Promise<FlightOption[]> {
  try {
    const token = await getToken();
    const params = new URLSearchParams({
      originLocationCode: origin.toUpperCase(),
      destinationLocationCode: destination.toUpperCase(),
      departureDate,
      adults: String(adults),
      max: "5",
      currencyCode: "BRL",
    });
    if (returnDate) params.set("returnDate", returnDate);

    const res = await fetch(
      `${process.env.AMADEUS_BASE_URL}/v2/shopping/flight-offers?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) return [];
    const data = await res.json();
    if (!data.data) return [];

    return (data.data as FlightOffer[]).slice(0, 5).map(parseOffer);
  } catch {
    return [];
  }
}
