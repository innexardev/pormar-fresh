---
name: freshbox-database
description: Designs Prisma schema and migrations for Fresh Box — products, combos, stock, delivery windows, orders. Use for schema changes, indexes, or seed data.
---

# Fresh Box Database

## Core models

- `Product` — unitType, weightGrams, stockQty, minStock
- `Combo` + `ComboItem`
- `DeliveryWindow` — weekday, cutoffWeekday, cutoffHour
- `Order` + `OrderItem` + `OrderStatusHistory`
- `StockMovement` — audit trail
- `StoreSettings` — min order, delivery fee

## Rules

- Money: Decimal(10,2)
- Stock: Decimal(10,3) for kg fractions
- Seed: `apps/api/prisma/seed.ts`
