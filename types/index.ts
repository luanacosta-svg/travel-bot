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
  paymentDueDate?: string;
  history?: HistoryEntry[];
}

export interface InvoiceUpload {
  id: string;
  createdAt: string;
  status: InvoiceStatus;
  requester: { name: string; email: string };
  invoice: {
    description: string;
    companyName?: string;
    cnpj?: string;
    amount: number;
    invoiceFile: string;
    invoiceNumber?: string;
    invoiceDate?: string;
  };
  adminNote?: string;
  paymentDueDate?: string;
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

/* ─── Employee / Contract ────────────────────────────────────── */
export interface Employee {
  id: string;
  createdAt: string;
  updatedAt: string;

  // Pessoal
  name: string;
  cpf?: string;
  rg?: string;
  birthDate?: string;
  photoUrl?: string;
  photoConsent?: boolean;

  // Contato
  email: string;
  personalEmail?: string;
  phone?: string;
  cep?: string;
  address?: string;
  city?: string;

  // Empresa
  role?: string;
  squad?: string;
  startDate?: string;
  manager?: string;

  // Contrato
  contractStart?: string;
  contractEnd?: string;

  // Formação
  education?: string;

  // PJ & PIX
  razaoSocial?: string;
  cnpj?: string;
  pixCnpj?: string;
  pixPf?: string;

  // Extras
  emergencyName?: string;
  emergencyPhone?: string;
  shirtSize?: string;
  linkedin?: string;

  // Computed / meta
  completion?: number;

  // Auth
  passwordHash?: string;
}

export type ContractStatusKey = "ok" | "atencao" | "vencendo" | "vencido";

export interface ContractStatus {
  key: ContractStatusKey;
  days: number;
  label: string;
  color: "green" | "blue" | "amber" | "red";
}
