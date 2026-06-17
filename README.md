# Pomar Fresh

Site + cardápio + pedidos online para **combos de frutas, legumes e verduras cortados**, com painel administrativo, estoque, **MinIO** para imagens e entregas **2x por semana**.

## Stack

| Serviço | Tecnologia | Porta |
|---------|------------|-------|
| API | NestJS + Prisma | 3010 |
| Site | Next.js 15 | 3020 |
| Admin | Next.js 15 | 3021 |
| PostgreSQL | Docker | 5433 |
| Redis | Docker | 6380 |
| **MinIO** | Docker (S3) | 9000 / console 9001 |

## Como rodar

```bash
cd pormar-fresh

docker compose up -d

cp .env.example .env
cp .env apps/api/.env

npm install
npm run db:generate
cd apps/api && npx prisma migrate deploy && npm run prisma:seed && cd ../..

npm run dev
```

**MinIO console:** http://localhost:9001 — `minioadmin` / `minioadmin`

## URLs

| Serviço | URL |
|---------|-----|
| Site | http://localhost:3020 |
| Admin | http://localhost:3021 |
| API | http://localhost:3010/api/v1 |
| MinIO | http://localhost:9000/pomar-fresh/ |

## Login admin

- Email: `admin@freshbox.com`
- Senha: `admin123`

## Features

### Fase 1 — Operação
- Formulários admin produtos/combos
- Entrada de estoque
- Pix Asaas (fallback mock)
- Lista de separação imprimível
- Carrinho com editar quantidade

### Fase 2 — Crescimento
- **MinIO** — upload de imagens (produtos, combos, site)
- **Zonas de entrega** — CEP + bairro + taxa variável
- **ViaCEP** — busca automática no checkout
- **Cupons** de desconto
- **WhatsApp** — confirmação e status (Evolution API)
- **CRM clientes** — histórico por telefone
- **Dashboard receita** — últimos 7 dias
- **BOM** — validação de ingredientes no pedido
- **Feriados** — bloqueio de datas de entrega
- **SEO** — sitemap, robots, Open Graph
- **PWA** — manifest.json
- **Rate limit** — 120 req/min na API
- **E2E** — Playwright smoke tests

### Fase 3 — Retenção
- **Assinatura semanal** — combo fixo toda semana (`/assinatura` + admin `/assinaturas`)
- **Push PWA** — notificações quando pedido fica pronto/entregue (VAPID)
- **Export CSV** — pedidos no admin (`/admin/orders/export`)

## Upload de imagens (MinIO)

1. Suba o Docker: `docker compose up -d`
2. Configure no `.env`:
   ```env
   S3_ENDPOINT=http://localhost:9000
   S3_PUBLIC_URL=http://localhost:9000/pomar-fresh
   S3_BUCKET=pomar-fresh
   S3_ACCESS_KEY=minioadmin
   S3_SECRET_KEY=minioadmin
   ```
3. No admin: Produtos, Combos ou Mídia → **Upload MinIO**

## Pix Asaas

```env
ASAAS_API_KEY=sua_chave
ASAAS_SANDBOX=false
ASAAS_WEBHOOK_TOKEN=token
```

Webhook: `POST /api/v1/webhooks/asaas`

## WhatsApp (Evolution API)

```env
WHATSAPP_API_URL=https://sua-evolution-api.com
WHATSAPP_API_KEY=sua_chave
WHATSAPP_INSTANCE=pomar-fresh
```

## Push PWA (notificações)

```env
VAPID_PUBLIC_KEY=sua_chave_publica
VAPID_PRIVATE_KEY=sua_chave_privada
VAPID_SUBJECT=mailto:admin@pomarfresh.com
```

Gere chaves com: `npx web-push generate-vapid-keys`

## Assinaturas semanais

- **Site:** `/assinatura` — cliente escolhe combo + janela de entrega
- **Admin:** `/assinaturas` — listar, pausar/cancelar, **Gerar pedidos** da próxima entrega

## Áreas de entrega (Admin)

**Admin → Áreas de entrega** (`/entrega`):

1. **Zonas** — nome, prefixos CEP (`010, 011`), bairros opcionais, taxa por zona
2. **Configurações gerais** — taxa padrão, pedido mínimo, WhatsApp
3. **Testar CEP** — simula se o endereço é aceito
4. **Feriados** — bloqueia datas de entrega (terça/sexta)

Quando existir ao menos uma zona **ativa**, o checkout valida CEP + bairro contra as zonas. Sem zonas, usa `DELIVERY_ZIP_PREFIXES` do `.env`.

## Pedidos (Admin)

- Filtros: ativos, todos, pendentes, entregues, cancelados
- Detalhe com endereço, itens, cupom, timeline
- Cancelar pedido (restaura estoque se já confirmado)
- Link WhatsApp direto para o cliente

## Importar zonas CSV

Admin → Áreas de entrega → seção CSV. Exemplo:

```csv
label,zip_prefixes,neighborhoods,delivery_fee,sort_order
"Zona Sul","040;041","",15,1
```

## Testes E2E

```bash
npx playwright install chromium
npm run test:e2e
```

## Documentação

- [docs/PLANEJAMENTO-MASTER.md](./docs/PLANEJAMENTO-MASTER.md)
- [docs/08-ROADMAP-E-BACKLOG.md](./docs/08-ROADMAP-E-BACKLOG.md)
