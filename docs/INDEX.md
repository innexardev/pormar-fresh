# Documentação Pomar Fresh

Indice completo de contexto, planejamento e especificacao por feature.

## Ordem de leitura

| # | Documento | Conteudo |
|---|-----------|----------|
| 1 | [01-CONTEXTO-E-VISAO.md](./01-CONTEXTO-E-VISAO.md) | Problema, solucao, publico, proposta de valor |
| 2 | [02-MODELO-NEGOCIO.md](./02-MODELO-NEGOCIO.md) | Precificacao, entrega 2x/semana, operacao |
| 3 | [03-ARQUITETURA-TECNICA.md](./03-ARQUITETURA-TECNICA.md) | Stack, monorepo, modulos, portas |
| 4 | [04-FEATURES-DETALHADAS.md](./04-FEATURES-DETALHADAS.md) | **Cada feature** com escopo, regras e criterios |
| 5 | [05-FLUXOS-E-JORNADAS.md](./05-FLUXOS-E-JORNADAS.md) | Cliente, cozinha/operacao, admin |
| 6 | [06-MODELO-DADOS.md](./06-MODELO-DADOS.md) | Tabelas, campos, relacionamentos |
| 7 | [07-API-ENDPOINTS.md](./07-API-ENDPOINTS.md) | Contratos REST publicos e admin |
| 8 | [08-ROADMAP-E-BACKLOG.md](./08-ROADMAP-E-BACKLOG.md) | Fases, prioridades P0/P1/P2 |
| 9 | [09-OPERACAO-E-METRICAS.md](./09-OPERACAO-E-METRICAS.md) | KPIs, checklist diario, go-live |

## Status de implementacao (resumo)

| Feature | Status |
|---------|--------|
| Site home + cardapio | Implementado |
| Carrinho + checkout | Implementado |
| Janelas entrega terca/sexta | Implementado |
| Pedido + status | Implementado |
| Pix simulado | Implementado |
| Admin pedidos/produtos/combos/estoque | Implementado (leitura) |
| Cadastro produto/combo no admin | Planejado (P1) |
| Pix real Asaas | Planejado (P1) |
| Areas por CEP/bairro | Planejado (P2) |
| WhatsApp notificacoes | Planejado (P2) |
| Assinatura/recorrencia semanal | Planejado (P3) |

## Codigo relacionado

- API: `apps/api/src/`
- Site: `apps/web/src/app/`
- Admin: `apps/admin/src/app/`
- Schema: `apps/api/prisma/schema.prisma`
- Seed demo: `apps/api/prisma/seed.ts`
