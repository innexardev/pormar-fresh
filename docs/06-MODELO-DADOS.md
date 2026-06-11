# 06 — Modelo de Dados

Referencia completa das entidades. Schema fonte: `apps/api/prisma/schema.prisma`.

---

## User
Administrador do painel.

| Campo | Tipo | Notas |
|-------|------|-------|
| email | string unique | Login |
| passwordHash | string | bcrypt |
| role | string | default `admin` |

---

## StoreSettings
Configuracao global (1 registro `id=default`).

| Campo | Tipo | Notas |
|-------|------|-------|
| storeName | string | Nome exibido |
| tagline | string? | Subtitulo |
| deliveryFee | decimal | Taxa fixa |
| minOrderValue | decimal | Pedido minimo |
| whatsapp | string? | Contato |
| aboutText | string? | Sobre |

---

## Category
Organizacao do cardapio.

| Campo | Tipo | Notas |
|-------|------|-------|
| slug | string unique | combos, frutas, legumes, verduras |
| position | int | Ordem exibicao |

---

## Product
Produto avulso.

| Campo | Tipo | Notas |
|-------|------|-------|
| unitType | string | kg, g, unit, portion |
| weightGrams | int? | Peso porcao |
| price | decimal | Preco |
| stockQty | decimal(10,3) | Estoque |
| minStock | decimal(10,3) | Alerta |
| isPreCut | bool | Cortado |

---

## Combo
Kit fechado.

| Campo | Tipo | Notas |
|-------|------|-------|
| price | decimal | Preco fechado |
| weightLabel | string? | "~1,2 kg" |
| servesPeople | int? | Porcoes |
| featured | bool | Destaque cardapio |

---

## ComboItem
Item dentro do combo.

| Campo | Tipo | Notas |
|-------|------|-------|
| itemName | string | Ex: Morango |
| quantity | decimal | 300 |
| unitLabel | string | g, kg, un |
| productId | uuid? | Vinculo futuro estoque |

---

## DeliveryWindow
Janela de entrega 2x/semana.

| Campo | Tipo | Notas |
|-------|------|-------|
| weekday | int | 2=terca, 5=sexta |
| cutoffWeekday | int | Dia limite pedido |
| cutoffHour | int | Hora limite (18) |
| label | string | "Terca-feira" |

---

## Customer

| Campo | Tipo | Notas |
|-------|------|-------|
| phone | string unique | Identificador |
| name | string | |
| email | string? | |

---

## Order

| Campo | Tipo | Notas |
|-------|------|-------|
| deliveryWindowId | uuid | Janela escolhida |
| deliveryDate | date | Data entrega |
| status | string | Ver F6 |
| subtotal | decimal | |
| deliveryFee | decimal | |
| total | decimal | |
| addressJson | json | Endereco completo |

---

## OrderItem

| Campo | Tipo | Notas |
|-------|------|-------|
| productId | uuid? | Se avulso |
| comboId | uuid? | Se combo |
| itemName | string | Snapshot nome |
| quantity | decimal | |
| unitLabel | string | |
| unitPrice | decimal | Snapshot preco |
| lineTotal | decimal | |

---

## OrderStatusHistory
Auditoria de mudancas de status.

---

## Payment

| Campo | Tipo | Notas |
|-------|------|-------|
| method | string | pix |
| status | string | pending, confirmed |
| pixCopyPaste | string? | |
| idempotencyKey | string? unique | |

---

## StockMovement

| Campo | Tipo | Notas |
|-------|------|-------|
| type | string | in, out, adjustment |
| quantity | decimal | |
| reason | string? | |
| orderId | uuid? | Se saida por pedido |

---

## Diagrama ER (simplificado)

```
Category ──< Product
Category ──< Combo ──< ComboItem >── Product?

DeliveryWindow ──< Order ──< OrderItem
Customer ──< Order
Order ──< Payment
Order ──< OrderStatusHistory
Product ──< StockMovement
```
