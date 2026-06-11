# 04 — Features Detalhadas

Especificacao completa de cada funcionalidade: objetivo, regras, telas, API, status e criterios de aceite.

---

## F1 — Site institucional (Home)

### Objetivo
Apresentar a marca, explicar entrega 2x/semana e direcionar para o cardapio.

### Escopo
- Hero com proposta de valor.
- Blocos: cortado no dia, 2 entregas/semana, combos praticos.
- CTAs: Ver cardapio, Combos da semana.
- Footer com informacoes da operacao.

### Regras
- Conteudo editavel futuramente via `StoreSettings.aboutText`.
- Mobile-first.

### Telas
- `apps/web/src/app/page.tsx`

### Status
**Implementado**

### Criterios de aceite
- [x] Pagina carrega em mobile e desktop.
- [x] Links para `/cardapio` funcionam.
- [ ] Conteudo editavel pelo admin (P2).

---

## F2 — Cardapio publico

### Objetivo
Exibir combos em destaque e produtos avulsos para montagem do pedido.

### Escopo
- Secao **Combos em destaque** (`featured: true`).
- Secao **Outros combos**.
- Secao **Produtos avulsos** com unidade, peso e estoque visivel.
- Botao adicionar ao carrinho.
- Barra fixa de carrinho com total.

### Regras de negocio
- So exibir produtos `active: true` e `stockQty > 0`.
- Combos inativos nao aparecem.
- Preco exibido sempre com 2 decimais.
- Unidades: `kg`, `g`, `unit`, `portion` traduzidas na UI.

### API
- `GET /api/v1/public/menu`

### Telas
- `apps/web/src/app/cardapio/page.tsx`

### Status
**Implementado**

### Criterios de aceite
- [x] Lista combos e produtos do seed.
- [x] Carrinho persiste (Zustand + localStorage).
- [ ] Fotos dos produtos/combos (P2).
- [ ] Filtro por categoria (P2).

---

## F3 — Carrinho

### Objetivo
Agrupar itens (combo ou produto) antes do checkout.

### Escopo
- Adicionar/remover itens.
- Quantidade por linha.
- Total parcial.
- Tipos: `product` | `combo`.

### Regras
- Combo: quantidade inteira (unidades de combo).
- Produto avulso: quantidade inteira no MVP (futuro: decimal para kg).
- Carrinho vazio bloqueia checkout.

### Implementacao
- `apps/web/src/store/cart.ts`

### Status
**Implementado**

### Criterios de aceite
- [x] Persiste ao recarregar pagina.
- [x] Total calculado corretamente.
- [ ] Editar quantidade no carrinho (P1).

---

## F4 — Checkout

### Objetivo
Coletar dados do cliente, endereco e **janela de entrega** (terca ou sexta).

### Escopo
- Resumo do pedido (itens, subtotal, taxa, total).
- Dados: nome, telefone, email opcional.
- Endereco completo.
- Selecao obrigatoria de janela de entrega.
- Observacoes (ex: preferencias de corte).
- Validacao pedido minimo.

### Regras
- Pedido minimo: `StoreSettings.minOrderValue` (R$ 49 demo).
- Taxa entrega: `StoreSettings.deliveryFee` (R$ 12 demo).
- Janela deve estar dentro do cutoff (`DeliveryService`).
- Telefone unico identifica cliente (upsert).

### API
- `GET /public/delivery/windows`
- `GET /public/store`
- `POST /public/orders`
- `POST /public/orders/:id/payments/pix`

### Telas
- `apps/web/src/app/checkout/page.tsx`

### Status
**Implementado**

### Criterios de aceite
- [x] Exige janela terca/sexta.
- [x] Rejeita abaixo do minimo.
- [x] Cria pedido + cobranca Pix.
- [ ] Validacao CEP e area de entrega (P2).
- [ ] Cupom de desconto (P2).

---

## F5 — Janelas de entrega (2x/semana)

### Objetivo
Permitir que o cliente escolha **terca** ou **sexta** e calcular datas/cutoffs automaticamente.

### Escopo
- Cadastro de janelas no banco (`DeliveryWindow`).
- API retorna proximas 4 janelas disponiveis.
- Cutoff configuravel por janela.

### Regras
- `weekday`: dia da entrega (2=terca, 5=sexta).
- `cutoffWeekday` + `cutoffHour`: limite para pedir.
- Nao mostrar janela apos cutoff expirado.
- Label amigavel: "Terca-feira — 10/06".

### Modelo
- `DeliveryWindow` em `schema.prisma`

### API
- `GET /public/delivery/windows`

### Servico
- `apps/api/src/delivery/delivery.service.ts`

### Status
**Implementado**

### Criterios de aceite
- [x] Retorna terca e sexta futuras.
- [x] Respeita cutoff.
- [ ] Admin CRUD de janelas (P1).
- [ ] Feriados / excecoes (P2).

---

## F6 — Pedidos

### Objetivo
Registrar compra, vincular entrega e acompanhar status ate entrega.

### Escopo
- Criacao com itens (combo ou produto).
- Endereco em JSON.
- Historico de status.
- Consulta publica por ID.

### Fluxo de status

```
pending → confirmed → preparing → ready → out_for_delivery → delivered
                ↘ cancelled (em etapas permitidas)
```

### Regras
- `pending`: aguardando Pix.
- `confirmed`: pagamento OK; **baixa estoque** produtos avulsos.
- `preparing`: equipe cortando/montando.
- `ready`: pronto para rota.
- `out_for_delivery`: saiu para entrega.
- `delivered`: concluido.
- Transicoes invalidas retornam erro.

### API
- `POST /public/orders`
- `GET /public/orders/:id`
- `GET /admin/orders?status=active`
- `PATCH /admin/orders/:id/status`

### Status
**Implementado**

### Criterios de aceite
- [x] Cria pedido com itens e totais corretos.
- [x] Timeline de status na consulta publica.
- [x] Admin lista e avanca status.
- [ ] Impressao lista de separacao (P2).
- [ ] Cancelamento pelo cliente (P2).

---

## F7 — Pagamento Pix

### Objetivo
Receber pagamento online e confirmar pedido automaticamente.

### Escopo MVP
- Geracao codigo Pix mock.
- Simulacao de pagamento (demo).
- Idempotencia por pedido.

### Escopo P1 (Asaas)
- Cobranca Pix real.
- Webhook confirmacao.
- Conciliacao admin.

### Regras
- Um pagamento pending por pedido.
- Confirmacao dispara `confirmed` + baixa estoque.
- Nao processar webhook duplicado.

### API
- `POST /public/orders/:id/payments/pix`
- `POST /public/orders/:id/payments/simulate`

### Status
**Implementado (mock)** | Asaas **planejado**

### Criterios de aceite
- [x] Pix gerado apos pedido.
- [x] Simulacao confirma e muda status.
- [ ] Webhook Asaas producao (P1).
- [ ] Cartao credito (P3).

---

## F8 — Acompanhamento do pedido (cliente)

### Objetivo
Cliente ve status e data de entrega apos compra.

### Escopo
- Numero resumido do pedido.
- Status traduzido (pt-BR).
- Data e label da entrega (terca/sexta).
- Lista de itens.
- Timeline de eventos.
- Botao simular Pix se ainda pending.

### Telas
- `apps/web/src/app/pedido/[id]/page.tsx`

### Status
**Implementado**

### Criterios de aceite
- [x] Exibe timeline.
- [x] Simula pagamento em demo.
- [ ] Notificacao WhatsApp a cada status (P2).

---

## F9 — Produtos avulsos

### Objetivo
Cadastro de itens vendidos separadamente com peso, unidade e estoque.

### Campos principais

| Campo | Descricao |
|-------|-----------|
| name | Nome comercial |
| unitType | kg, g, unit, portion |
| weightGrams | Peso da porcao (opcional) |
| price | Preco por unidade/kg |
| stockQty | Estoque atual |
| minStock | Alerta estoque baixo |
| isPreCut | Ja vem cortado |
| categoryId | Frutas, legumes, verduras |

### Regras
- Validar estoque no pedido.
- Baixa estoque na confirmacao pagamento.
- Produto inativo some do cardapio.

### API admin
- `GET /admin/products`
- `POST /admin/products` (backend pronto, UI P1)
- `PATCH /admin/products/:id`
- `POST /admin/products/:id/stock`

### Telas admin
- `apps/admin/src/app/produtos/page.tsx` (lista)

### Status
**API implementada** | **Formulario admin P1**

---

## F10 — Combos

### Objetivo
Vender kits fechados com lista de itens, peso total e preco fixo.

### Campos principais

| Campo | Descricao |
|-------|-----------|
| name | Nome do combo |
| price | Preco fechado |
| weightLabel | Ex: "~1,2 kg total" |
| servesPeople | Ex: 4 pessoas |
| featured | Destaque no cardapio |
| items[] | Lista ComboItem |

### ComboItem
- itemName, quantity, unitLabel (g, kg, un).
- productId opcional (vinculo estoque futuro).

### Regras
- Preco do combo nao soma precos avulsos no checkout.
- Combo inativo nao aparece no cardapio.
- MVP: combo **nao baixa estoque** item a item (P2: explosao BOM).

### API admin
- `GET /admin/combos`
- `POST /admin/combos`
- `PATCH /admin/combos/:id`

### Telas
- Cardapio web + `apps/admin/src/app/combos/page.tsx`

### Status
**Implementado (leitura)** | **CRUD UI P1** | **BOM estoque P2**

---

## F11 — Estoque

### Objetivo
Controlar quantidade disponivel e alertar ruptura.

### Escopo
- Campo `stockQty` e `minStock` por produto.
- Movimentacoes: `in`, `out`, `adjustment`.
- Baixa automatica em pedido confirmado (produto avulso).
- Tela admin: estoque baixo + ultimas movimentacoes.

### Regras
- `stockQty <= minStock` → alerta admin.
- Toda alteracao manual gera `StockMovement` com motivo.
- Quantidades Decimal(10,3) para kg.

### API
- `GET /admin/stock/low`
- `GET /admin/stock/movements`
- `POST /admin/products/:id/stock`

### Telas
- `apps/admin/src/app/estoque/page.tsx`

### Status
**Implementado**

### Criterios de aceite
- [x] Alerta estoque baixo.
- [x] Historico movimentacoes.
- [x] Baixa ao confirmar pagamento.
- [ ] Entrada de compra fornecedor (formulario P1).
- [ ] Explosao combo → produtos (P2).

---

## F12 — Categorias

### Objetivo
Organizar cardapio: Combos, Frutas, Legumes, Verduras.

### Campos
- name, slug, position, active.

### Status
**Implementado (seed)** | **Admin CRUD P2**

---

## F13 — Clientes

### Objetivo
Identificar comprador por telefone e reutilizar em pedidos futuros.

### Regras
- Telefone unico.
- Upsert no checkout (nome atualizado).
- Endereco salvo por pedido (JSON no Order).

### Status
**Implementado**

### Futuro (P2)
- Historico de pedidos por cliente.
- CRM / WhatsApp remarketing.

---

## F14 — Configuracoes da loja

### Objetivo
Parametros globais: nome, tagline, pedido minimo, taxa, WhatsApp.

### Modelo
- `StoreSettings` (id: default)

### API
- `GET /public/store`

### Status
**Implementado (leitura)** | **Edicao admin P2**

---

## F15 — Autenticacao admin

### Objetivo
Proteger painel operacional.

### Escopo
- Login email/senha.
- JWT 7 dias.
- Guard em rotas `/admin/*`.

### Credenciais demo
- `admin@freshbox.com` / `admin123`

### Status
**Implementado**

### Futuro
- Multi-usuario (separador, entregador).
- MFA (P3).

---

## F16 — Dashboard admin

### Objetivo
Visao rapida da operacao.

### Metricas atuais
- Total pedidos.
- Pedidos ativos.
- Qtd produtos.
- Qtd combos.

### API
- `GET /admin/dashboard`

### Status
**Implementado**

### Futuro (P2)
- Receita semana.
- Pedidos por janela terca/sexta.
- Produtos mais vendidos.

---

## F17 — Notificacoes WhatsApp (planejado)

### Objetivo
Confirmar pedido, lembrar cutoff, avisar "saiu para entrega".

### Eventos
- Pedido confirmado.
- Pedido pronto.
- Pedido entregue.

### Status
**Planejado P2**

---

## F18 — Areas de entrega (planejado)

### Objetivo
Restringir entrega por CEP/bairro e calcular taxa variavel.

### Status
**Planejado P2**

---

## F19 — Assinatura semanal (planejado)

### Objetivo
Cliente assina combo fixo toda semana (terca ou sexta automatico).

### Status
**Planejado P3**

---

## F20 — Fotos e SEO (planejado)

### Objetivo
Imagens dos combos, meta tags, Google indexacao.

### Status
**Planejado P2**
