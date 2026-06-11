# Pomar Fresh — Planejamento Master

Documento central que consolida contexto, escopo e status do produto **Pomar Fresh**.

> Detalhamento completo de **cada feature** em [04-FEATURES-DETALHADAS.md](./04-FEATURES-DETALHADAS.md).

---

## 1. Resumo executivo

**Pomar Fresh** vende combos e produtos avulsos de frutas, legumes e verduras **já cortados**, com entrega **2 vezes por semana** (terça e sexta). O cliente pede pelo site, paga via Pix e recebe tudo **cortado no dia da entrega**.

---

## 2. Modulos do sistema

| Modulo | Feature IDs | Status |
|--------|-------------|--------|
| Site publico | F1 Home, F2 Cardapio, F3 Carrinho, F4 Checkout, F8 Acompanhamento | Implementado |
| Entrega | F5 Janelas 2x/semana | Implementado |
| Pedidos | F6 Pedidos + status | Implementado |
| Pagamentos | F7 Pix mock | Mock OK / Asaas P1 |
| Catalogo | F9 Produtos, F10 Combos, F12 Categorias | Leitura OK / CRUD UI P1 |
| Estoque | F11 Estoque + movimentacoes | Implementado |
| **Custo & Preco (Pomar Fresh)** | F21 Ingredientes, receitas, margem, producao, relatorios, alertas | P0 + P1 |
| Clientes | F13 | Implementado |
| Config loja | F14 StoreSettings | Leitura OK |
| Admin | F15 Auth, F16 Dashboard | Implementado |
| Futuro | F17 WhatsApp, F18 Areas, F19 Assinatura, F20 SEO | Planejado |

---

## 3. Stack e repositorio

- **API** NestJS + Prisma — `apps/api`
- **Site** Next.js — `apps/web` (3020)
- **Admin** Next.js — `apps/admin` (3021)
- **Docs** — `docs/` (este diretorio)

---

## 4. Regras de negocio criticas

1. Entrega apenas **terca ou sexta** (janelas configuraveis).
2. Cutoff: pedido ate **18h do dia anterior** (segunda/quinta).
3. Pedido minimo **R$ 49** + taxa entrega **R$ 12** (configuravel).
4. Estoque de produto avulso validado no pedido; baixa ao **confirmar pagamento**.
5. Combo = **preco fechado**; itens descritos no cardapio.
6. Corte e montagem no **dia da entrega** (operacao fisica).

---

## 5. Mapa de features → arquivos

| Feature | Backend | Web | Admin |
|---------|---------|-----|-------|
| Cardapio | `catalog/` | `cardapio/page.tsx` | `combos`, `produtos` |
| Checkout | `orders/`, `delivery/` | `checkout/page.tsx` | — |
| Pix | `payments/` | `pedido/[id]/page.tsx` | — |
| Pedidos admin | `orders/` | — | `pedidos/page.tsx` |
| Estoque | `admin/` | — | `estoque/page.tsx` |
| Custo & Preco | `pricing/` | — | `custos/` |
| Producao / compras | `production/` | — | `custos/producao` |
| Janelas | `delivery/` | checkout | — |
| Loja config | `store/` | home | — |

---

## 6. Proximas entregas recomendadas (ordem)

1. **P1.1 + P1.2** — Formularios admin produtos/combos.
2. **P1.4** — Pix Asaas producao.
3. **P1.3** — Entrada estoque UI.
4. **P2.2** — WhatsApp confirmacao pedido.
5. **P2.1** — Validacao area entrega.

Ver [08-ROADMAP-E-BACKLOG.md](./08-ROADMAP-E-BACKLOG.md).

---

## 7. Indice completo

| Doc | Conteudo |
|-----|----------|
| [INDEX.md](./INDEX.md) | Indice geral |
| [01-CONTEXTO-E-VISAO.md](./01-CONTEXTO-E-VISAO.md) | Visao e ICP |
| [02-MODELO-NEGOCIO.md](./02-MODELO-NEGOCIO.md) | Precos e entrega |
| [03-ARQUITETURA-TECNICA.md](./03-ARQUITETURA-TECNICA.md) | Stack |
| [04-FEATURES-DETALHADAS.md](./04-FEATURES-DETALHADAS.md) | **20 features** |
| [05-FLUXOS-E-JORNADAS.md](./05-FLUXOS-E-JORNADAS.md) | Fluxos |
| [06-MODELO-DADOS.md](./06-MODELO-DADOS.md) | Banco |
| [07-API-ENDPOINTS.md](./07-API-ENDPOINTS.md) | API REST |
| [08-ROADMAP-E-BACKLOG.md](./08-ROADMAP-E-BACKLOG.md) | Fases P0-P3 |
| [09-OPERACAO-E-METRICAS.md](./09-OPERACAO-E-METRICAS.md) | KPIs e checklists |

---

## 8. Credenciais demo

- Admin: `admin@freshbox.com` / `admin123`
- Site: http://localhost:3020
- Admin: http://localhost:3021
