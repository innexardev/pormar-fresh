---
name: freshbox-orchestrator
description: Orchestrates Fresh Box Online development — combos hortifruti, estoque, entregas 2x/semana, site e admin. Use when planning features, splitting work, or coordinating API + web + admin changes.
---

# Fresh Box Orchestrator

## Quick start

1. Read `README.md`
2. Read `apps/api/prisma/schema.prisma`
3. Confirm impact on estoque, janelas de entrega e fluxo de pedido

## Delegation

| Task type | Skill |
|-----------|-------|
| Architecture | `freshbox-architect` |
| API / services | `freshbox-backend` |
| Site publico | `freshbox-frontend` |
| Admin panel | `freshbox-frontend` |
| Prisma / schema | `freshbox-database` |
| UX cardapio/checkout | `freshbox-ui-ux` |
| Auth / pagamentos | `freshbox-security` |
| Deploy / Docker | `freshbox-devops` |
| Testes / QA | `freshbox-qa` |

## Prioridades do produto

1. Cardapio (combos + avulsos)
2. Checkout com escolha de entrega (terca/sexta)
3. Pagamento Pix
4. Painel pedidos + estoque
