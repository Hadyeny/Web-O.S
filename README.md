# Plioou - Sistema de Gestão de Ordens de Serviço (TI)

Sistema B2B multi-tenant para empresas de suporte e infraestrutura de TI. Inclui portal de atendimentos, portal público de assinatura remota de O.S. com validação criptográfica (HMAC-SHA256), notificações em tempo real (Socket.io), logs de auditoria e persistência integral em PostgreSQL.

---

## 🔒 Auditoria de Segurança & LGPD (Concluída)

Todas as vulnerabilidades P0, P1, P2 e P3 foram mitigadas:

1. **Remoção de Senhas Hardcoded**: Credenciais gerenciadas por variáveis de ambiente ou geradas dinamicamente com bootstrap criptográfico.
2. **Sanitização de PII (LGPD)**: Fixtures contendo 100% de dados sintéticos em `server/seed/fixtures/`.
3. **Eliminação de Backdoor de Autenticação**: O header `x-dev-user-id` e token `demo_token` foram permanentemente removidos. Autenticação estritamente via JWT verificado.
4. **Proteção de Senhas de Clientes**: Senhas em texto livre são redigidas para `[REDACTED]` e armazenadas com criptografia **AES-256-GCM** em `clientPasswordEncrypted`.
5. **Mitigação de XSS (Cookies HttpOnly)**: Tokens JWT não trafegam mais no `localStorage`. Armazenamento em cookies `HttpOnly + Secure + SameSite=Strict/Lax` com rotação periódica de Refresh Token.
6. **Assinatura Digital com Validade Jurídica (MP 2.200-2/2001)**: Links de assinatura remota geram tokens HMAC-SHA256 com TTL de 7 dias (`?assinar=OS-XXXX&exp=...&sig=...`).
7. **Arquitetura 100% PostgreSQL**: Camada de repositórios parametrizados (`$1, $2, ...`) prevenindo SQL Injection.
8. **Logging Estruturado & Headers**: Adoção de **Pino** + `pino-http` com ID de correlação por requisição e **Helmet** para headers HTTP defensivos.

---

## 🛠️ Stack Tecnológica

- **Backend**: Node.js 20+, Express 4, TypeScript, Socket.io 4, PostgreSQL 16 (`pg`), Zod, Pino, Helmet, bcryptjs, jsonwebtoken.
- **Frontend**: React 19, Vite 6, Tailwind CSS 4, TanStack Query 5 (React Query), Lucide React, react-hot-toast.
- **Infraestrutura**: Docker Compose, PostgreSQL 16 Alpine, Redis 7 Alpine, Caddy 2 Alpine (TLS automático).

---

## 🚀 Deploy em Produção (Docker Compose)

### 1. Configurar Variáveis de Ambiente
Copie o arquivo de exemplo e preencha as chaves:
```bash
cp .env.example .env
```

Gere chaves seguras para produção:
```bash
# JWT Secret
openssl rand -base64 32

# Encryption Key (AES-256-GCM)
openssl rand -base64 32

# Signature Secret (HMAC)
openssl rand -base64 32
```

### 2. Subir os Containers
```bash
docker compose up -d --build
```

O compose iniciará:
- **Caddy** (portas 80 e 443 com certificado HTTPS automático)
- **App** (Node.js non-root, porta 3000, com healthcheck `/healthz`)
- **Postgres 16** (com volume persistente `pgdata`)
- **Redis 7** (com persistência AOF)

### 3. Popular Banco com Dados Sintéticos (Seed Seguro)
```bash
docker compose exec app npm run seed
```

---

## 🧹 Higienização de Histórico Git (Remover PII antiga)

Caso o repositório antigo possua commits com dados sensíveis, utilize o `git-filter-repo` para expurgar o arquivo `server/initialData.ts` de todas as revisões:

```bash
# 1. Instalar git-filter-repo
pip install git-filter-repo

# 2. Criar cópia de segurança (clone bare)
git clone --bare git@github.com:seu-usuario/plioou.git plioou-backup.git

# 3. Remover histórico do arquivo com dados sensíveis
git filter-repo --path server/initialData.ts --invert-paths

# 4. Forçar push nas branches protegidas
git push origin --force --all
git push origin --force --tags
```

---

## 📡 Endpoints de Monitoramento & Saúde

- `GET /healthz`: Healthcheck da aplicação (HTTP 200 `{ status: "ok" }`).
- `GET /api/dashboard/stats`: Métricas em tempo real de O.S., chamados travados e produtividade de técnicos.
