/**
 * Helper centralizado de autenticação admin.
 * Importar aqui em vez de checar o cookie diretamente em cada rota.
 */
import { NextRequest } from "next/server";
import { isValidAdminToken } from "@/lib/session";

export function isAdminRequest(req: NextRequest): boolean {
  const cookie = req.cookies.get("tb_admin");
  if (!cookie?.value) return false;
  return isValidAdminToken(cookie.value);
}
