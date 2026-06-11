---
name: freshbox-frontend
description: Builds Fresh Box Next.js UI — public site (cardapio, checkout, pedido) and admin panel (pedidos, produtos, combos, estoque). Use for pages, cart, checkout flow, and admin screens.
---

# Fresh Box Frontend

## Apps

- `apps/web` — cliente (3020)
- `apps/admin` — operacao (3021)

## Site routes

- `/`, `/cardapio`, `/checkout`, `/pedido/[id]`

## Admin routes

- `/dashboard`, `/pedidos`, `/produtos`, `/combos`, `/estoque`

## Hard rules

- Mobile-first on web cardapio/checkout
- Combos em destaque no cardapio
- Checkout must require delivery window selection
- API base: `NEXT_PUBLIC_API_URL` (default `http://localhost:3010/api/v1`)
