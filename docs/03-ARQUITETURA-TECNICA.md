# 03 — Arquitetura Tecnica

## Visao geral

```
┌─────────────┐     ┌─────────────┐
│  apps/web   │     │ apps/admin  │
│  (3020)     │     │  (3021)     │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └─────────┬─────────┘
                 │ REST /api/v1
         ┌───────▼───────┐
         │   apps/api    │
         │   NestJS      │
         │   (3010)      │
         └───────┬───────┘
                 │
         ┌───────▼───────┐
         │  PostgreSQL   │
         │  (5433)       │
         └───────────────┘
```

## Monorepo

```
fresh-box-online/
├── apps/
│   ├── api/          # NestJS + Prisma
│   ├── web/          # Site cliente
│   └── admin/        # Painel operacao
├── docs/             # Planejamento (este diretorio)
├── docker-compose.yml
└── package.json
```

## Modulos da API

| Modulo | Responsabilidade |
|--------|------------------|
| `auth` | Login admin JWT |
| `store` | Configuracoes publicas da loja |
| `catalog` | Cardapio publico (menu, combos) |
| `delivery` | Janelas disponiveis terca/sexta |
| `orders` | Criacao e gestao de pedidos |
| `payments` | Pix (mock / futuro Asaas) |
| `admin` | CRUD operacional, estoque, dashboard |

## Stack

| Camada | Tecnologia |
|--------|------------|
| API | NestJS 11, class-validator, Prisma 6 |
| Banco | PostgreSQL 16 |
| Site/Admin | Next.js 15, Tailwind, Zustand (carrinho) |
| Auth | JWT Bearer |
| Pagamento | Pix mock (MVP) → Asaas (P1) |

## Portas locais

| Servico | Porta |
|---------|-------|
| API | 3010 |
| Web | 3020 |
| Admin | 3021 |
| Postgres | 5433 |

## Decisoes arquiteturais

1. **Single-store**: sem multi-tenant no MVP.
2. **Monolito modular**: API unica, facil operar no inicio.
3. **Decimal no banco**: precos e estoque sem float.
4. **Estoque na confirmacao**: baixa ao pagar, nao ao criar pedido pendente.
5. **Combos preco fechado**: nao recalcula preco por item no checkout.

## Seguranca (MVP)

- Rotas `/admin/*` protegidas com JWT.
- Rotas `/public/*` abertas para cardapio e pedido.
- Secrets em `.env` (nao commitar).
- Idempotencia em pagamento Pix.

## Evolucao tecnica planejada

- Fila (BullMQ) para WhatsApp e emails.
- Cache Redis para cardapio.
- Upload S3 para fotos de combos.
- CI/CD GitHub Actions + deploy VPS/Coolify.
