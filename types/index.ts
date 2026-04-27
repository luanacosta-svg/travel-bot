export type TravelType = "flight" | "event" | "both";
export type RequestStatus = "pending" | "options_sent" | "purchased";
export type ReimbursementStatus = "pending" | "approved" | "rejected" | "paid";
export type InvoiceStatus = "pending" | "received" | "rejected" | "paid";

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
  optionsFile?: string;
  purchaseFile?: string;
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
  batchId?: string;
  adminNote?: string;
  history?: HistoryEntry[];
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
  history?: HistoryEntry[];
}

export interface UserSession {
  name: string;
  email: string;
  phone?: string;
}

export interface HistoryEntry {
  date: string;
  action: string;
  by: string;
}
