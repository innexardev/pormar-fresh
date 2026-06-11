---
name: freshbox-architect
description: Designs Fresh Box architecture — produtos, combos, estoque, janelas de entrega 2x/semana, pedidos e pagamentos. Use for module design, schema changes, or integration proposals.
---

# Fresh Box Architect

## Must read

- `README.md`
- `apps/api/prisma/schema.prisma`

## Deliverables

- ADR when changing stack or fluxo de entrega
- Schema impact on `Product`, `Combo`, `ComboItem`, `DeliveryWindow`, `StockMovement`

## Constraints

- Single-store (no multi-tenant)
- Estoque consistente com pedidos confirmados
- Entregas limitadas a janelas ativas
