/**
 * Mascaramento de dados pessoais para exibição em interfaces admin.
 * O dado completo permanece no servidor — só a apresentação é mascarada.
 */

export function maskCPF(value?: string | null): string {
  if (!value) return "—";
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11) return "***";
  return `***.${digits.slice(3, 6)}.***-**`;
}

export function maskCNPJ(value?: string | null): string {
  if (!value) return "—";
  const d = value.replace(/\D/g, "");
  if (d.length !== 14) return "**";
  return `**.***.***/****-${d.slice(12)}`;
}

export function maskPIX(value?: string | null): string {
  if (!value) return "—";
  // e-mail
  if (value.includes("@")) {
    const [local, domain] = value.split("@");
    return `${local[0]}***@${domain}`;
  }
  const digits = value.replace(/\D/g, "");
  // CPF (11 dígitos)
  if (digits.length === 11) return maskCPF(value);
  // CNPJ (14 dígitos)
  if (digits.length === 14) return maskCNPJ(value);
  // Celular (10 ou 11 dígitos)
  if (digits.length >= 10) return `(**) *****-${digits.slice(-4)}`;
  // Chave aleatória / UUID
  if (value.length > 8) return `${value.slice(0, 4)}...${value.slice(-4)}`;
  return "***";
}
