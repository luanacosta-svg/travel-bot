/**
 * Lista de e-mails autorizados a acessar o 49Pay.
 *
 * Carregada de data/allowed-emails.json (disco persistente, fora do git).
 * Para adicionar ou remover alguém, edite esse arquivo no servidor ou
 * use o endpoint /api/admin/allowed-emails (se implementado).
 *
 * Na primeira execução, o arquivo é criado automaticamente com a lista padrão.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR    = process.env.DATA_DIR ?? join(process.cwd(), "data");
const CONFIG_FILE = join(DATA_DIR, "allowed-emails.json");

// Lista padrão usada apenas para o seed inicial — não exposta em runtime
const DEFAULT_EMAILS = [
  "leandro.piazza@49educacao.com.br",
  "rafael.peck@49educacao.com.br",
  "marcelo.camara@49educacao.com.br",
  "tiago.toigo@49educacao.com.br",
  "maicon.silveira@49educacao.com.br",
  "lukas.tassi@49educacao.com.br",
  "gabriel.boff@49educacao.com.br",
  "emanuel.bueno@49educacao.com.br",
  "luana.costa@49educacao.com.br",
  "victor.motta@49educacao.com.br",
  "tamara.moraes@49educacao.com.br",
  "caio.montes@49educacao.com.br",
  "matheus.goulart@49educacao.com.br",
  "alan.nascimento@49educacao.com.br",
  "mauricio.pernidji@49educacao.com.br",
  "contact@49educacao.com.br",
];

function loadEmails(): Set<string> {
  try {
    if (existsSync(CONFIG_FILE)) {
      const list = JSON.parse(readFileSync(CONFIG_FILE, "utf8"));
      if (Array.isArray(list) && list.length > 0) {
        return new Set(list.map((e: string) => e.toLowerCase().trim()));
      }
    }
  } catch { /* continua para o seed */ }

  // Arquivo não existe — cria com a lista padrão
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_EMAILS, null, 2), "utf8");
  } catch { /* non-blocking */ }

  return new Set(DEFAULT_EMAILS);
}

// Carregada uma vez no start do servidor; para recarregar sem restart use getAllowedEmails()
export const ALLOWED_EMAILS: Set<string> = loadEmails();

/** Recarrega a lista do disco (útil se o arquivo foi editado manualmente). */
export function getAllowedEmails(): Set<string> {
  return loadEmails();
}
