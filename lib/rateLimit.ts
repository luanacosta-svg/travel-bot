/**
 * Rate limiting centralizado.
 *
 * Usa memória por enquanto (reinicia a cada deploy). Para escalar para
 * múltiplas instâncias, adicione UPSTASH_REDIS_REST_URL e
 * UPSTASH_REDIS_REST_TOKEN nas variáveis de ambiente e instale:
 *   npm i @upstash/ratelimit @upstash/redis
 * Depois troque a implementação aqui — sem alterar nenhum outro arquivo.
 */

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number; // segundos até liberar
}

// Estado em memória compartilhado por rota
const stores = new Map<string, Map<string, { count: number; resetAt: number }>>();

function getStore(name: string) {
  if (!stores.has(name)) stores.set(name, new Map());
  return stores.get(name)!;
}

/**
 * Verifica e incrementa o contador para uma chave (IP, e-mail, etc.).
 *
 * @param name    Nome do limiter (ex: "login", "check-email", "scan")
 * @param key     Chave de identificação (IP ou e-mail)
 * @param limit   Máximo de requisições permitidas na janela
 * @param windowS Janela de tempo em segundos
 */
export function rateLimit(
  name: string,
  key: string,
  limit: number,
  windowS: number,
): RateLimitResult {
  const store = getStore(name);
  const now   = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowS * 1000 });
    return { allowed: true };
  }

  entry.count++;

  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}
