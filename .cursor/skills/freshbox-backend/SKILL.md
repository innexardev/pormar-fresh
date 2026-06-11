---
name: freshbox-backend
description: Implements Fresh Box NestJS API — catalog, combos, orders, delivery windows, stock, Pix payments. Use for endpoints, services, Prisma queries, and order status logic.
---

# Fresh Box Backend

## Layering

`controller → DTO → service → Prisma`

## Key files

- `apps/api/src/orders/orders.service.ts`
- `apps/api/src/delivery/delivery.service.ts`
- `apps/api/src/admin/admin.service.ts`
- `apps/api/src/payments/payments.service.ts`

## Hard rules

- Validate order status transitions
- Check stock before creating order for products
- Deduct stock on `confirmed` (after payment)
- Decimal for money and stock quantities
- Idempotent Pix payments
