# Setup — 49 Educação Viagens

## Pré-requisitos
- Node.js 18+ instalado
- Conta no Amadeus for Developers (gratuita)
- Gmail com verificação em duas etapas ativa

## 1. Instalar dependências

```bash
cd travel-bot
npm install
```

## 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` com os valores reais:

### Amadeus API
1. Acesse https://developers.amadeus.com e crie uma conta
2. Crie uma nova aplicação (Self-Service)
3. Copie o **Client ID** e **Client Secret**
4. Use `https://test.api.amadeus.com` para testes — troque por `https://api.amadeus.com` em produção

### Gmail — Senha de app
1. Acesse sua Conta Google → Segurança
2. Ative a **Verificação em duas etapas** (se não tiver)
3. Vá em **Senhas de app** → escolha "Email" e "Mac/PC"
4. Copie a senha gerada (16 caracteres) e cole em `GMAIL_APP_PASSWORD`

### ADMIN_SECRET
Escolha uma senha forte para acessar `/admin`.

### NEXT_PUBLIC_BASE_URL
Em desenvolvimento: `http://localhost:3000`
Em produção: `https://seudominio.com`

## 3. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse:
- **Formulário** (equipe): http://localhost:3000
- **Painel admin** (você): http://localhost:3000/admin

## 4. Deploy (Vercel — recomendado)

```bash
npm install -g vercel
vercel
```

Configure as variáveis de ambiente no painel da Vercel.
Troque `AMADEUS_BASE_URL` para `https://api.amadeus.com` em produção.

## Fluxo de uso

1. Membro da equipe acessa o site e preenche o formulário
2. Sistema busca voos via Amadeus e envia e-mail para você
3. Você acessa `/admin`, revisa as opções e clica em "Enviar opções por e-mail"
4. O membro recebe as sugestões no e-mail dele
5. Você compra manualmente e encaminha a confirmação
