export type TravelType = "flight" | "event" | "both";
export type RequestStatus = "pending" | "options_sent" | "purchased";

export interface TravelRequest {
  id: string;
  createdAt: string;
  status: RequestStatus;
  requester: {
    name: string;
    email: string;
    phone?: string;
  };
  travel: {
    type: TravelType;
    origin?: string;
    destination: string;
    departureDate?: string;
    returnDate?: string;
    preferredTimes?: string;
    passengers: number;
    eventName?: string;
    notes?: string;
  };
  flightOptions?: FlightOption[];
}

export interface FlightOption {
  id: string;
  price: string;
  currency: string;
  airline: string;
  departure: {
    airport: string;
    time: string;
  };
  arrival: {
    airport: string;
    time: string;
  };
  duration: string;
  stops: number;
  returnFlight?: {
    departure: { airport: string; time: string };
    arrival: { airport: string; time: string };
    duration: string;
    stops: number;
  };
}
