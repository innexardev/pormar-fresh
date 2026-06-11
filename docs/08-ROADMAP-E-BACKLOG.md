# 08 — Roadmap e Backlog

## Fase 0 — MVP atual (concluido)

- [x] Monorepo api + web + admin
- [x] Cardapio combos + avulsos
- [x] Carrinho e checkout
- [x] Entrega terca/sexta com cutoff
- [x] Pedidos + status
- [x] Pix simulado
- [x] Admin pedidos, produtos, combos, estoque (leitura)
- [x] Seed demo
- [x] Documentacao completa

---

## Fase 1 — Operacao completa (2-4 semanas)

### P1 — Alta prioridade

| ID | Feature | Descricao |
|----|---------|-----------|
| P1.1 | Formulario produtos admin | Criar/editar produto com peso, unidade, estoque |
| P1.2 | Formulario combos admin | Criar/editar combo + itens |
| P1.3 | Entrada de estoque UI | Registrar compra fornecedor |
| P1.4 | Pix Asaas real | Cobranca + webhook producao |
| P1.5 | Editar quantidade carrinho | UX checkout |
| P1.6 | Impressao lista separacao | PDF/termica pedidos do dia |

### Criterio gate Fase 1
- Operacao real consegue rodar 1 semana sem planilha paralela.

---

## Fase 2 — Crescimento (4-8 semanas)

### P2 — Media prioridade

| ID | Feature | Descricao |
|----|---------|-----------|
| P2.1 | Areas entrega CEP/bairro | Validar endereco + taxa variavel |
| P2.2 | WhatsApp transacional | Confirmacao + status entrega |
| P2.3 | Fotos combos/produtos | Upload S3 |
| P2.4 | CRM clientes | Historico pedidos por telefone |
| P2.5 | Dashboard receita | Graficos semana/janela |
| P2.6 | Explosao BOM combo | Baixa estoque por item do combo |
| P2.7 | Feriados / excecoes janela | Desativar entrega |
| P2.8 | Cupom desconto | Codigo promocional |
| P2.9 | SEO + Google | Meta tags, sitemap |

---

## Fase 3 — Escala (8-16 semanas)

### P3 — Baixa prioridade / expansao

| ID | Feature | Descricao |
|----|---------|-----------|
| P3.1 | Assinatura semanal | Combo fixo recorrente |
| P3.2 | Cartao credito | Stripe/Pagar.me |
| P3.3 | App PWA instalavel | Push notifications |
| P3.4 | Multi-ponto producao | Filiais |
| P3.5 | Nota fiscal | Integracao contabil |

---

## Backlog tecnico

- Testes E2E Playwright (checkout completo).
- CI GitHub Actions.
- Observabilidade (Sentry).
- Rate limit rotas publicas.
- Backup automatico Postgres.

---

## Priorizacao (matriz)

| Impacto / Esforco | Baixo esforco | Alto esforco |
|-------------------|---------------|--------------|
| **Alto impacto** | Pix Asaas, forms admin | WhatsApp, areas CEP |
| **Baixo impacto** | SEO basico | Assinatura, multi-loja |
