export type TravelType = "flight" | "event" | "both";
export type RequestStatus = "pending" | "options_sent" | "purchased";
export type ReimbursementStatus = "pending" | "approved" | "rejected";
export type InvoiceStatus = "pending" | "received";

export interface TravelRequest {
  id: string;
  createdAt: string;
  status: RequestStatus;
  requester: { name: string; email: string; phone?: string };
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
  flightSearchUrl?: string;
  managerMessage?: string;
  purchaseInfo?: string;
}

export interface ReimbursementRequest {
  id: string;
  createdAt: string;
  status: ReimbursementStatus;
  requester: { name: string; email: string };
  expense: {
    description: string;
    category: string;
    date: string;
    amount: number;
    receiptFile?: string;
  };
  adminNote?: string;
}

export interface InvoiceUpload {
  id: string;
  createdAt: string;
  status: InvoiceStatus;
  requester: { name: string; email: string };
  invoice: {
    description: string;
    companyName: string;
    cnpj?: string;
    amount: number;
    invoiceFile: string;
  };
  adminNote?: string;
}

export interface UserSession {
  name: string;
  email: string;
}
