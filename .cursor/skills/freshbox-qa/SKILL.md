---
name: freshbox-qa
description: Defines test paths for Fresh Box — cardapio, checkout, delivery windows, stock deduction, admin order flow. Use for QA checklists and regression.
---

# Fresh Box QA

## Critical paths

1. Cardapio carrega combos e produtos
2. Checkout exige janela terca/sexta
3. Pedido abaixo do minimo e rejeitado
4. Pix simulado confirma pedido
5. Estoque baixa apos pagamento (produtos avulsos)
6. Admin avanca status ate entregue
7. Estoque baixo aparece no admin

## Template

Given / When / Then com dados demo do seed.
