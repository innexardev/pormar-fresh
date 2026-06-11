# 02 — Modelo de Negocio

## Receita

- Venda de **combos** (margem maior, ticket medio maior).
- Venda de **produtos avulsos** (complemento e upsell).
- Taxa de **entrega fixa** por pedido.

## Parametros comerciais (configuraveis)

| Parametro | Valor demo | Campo |
|-----------|------------|-------|
| Pedido minimo | R$ 49,00 | `StoreSettings.minOrderValue` |
| Taxa entrega | R$ 12,00 | `StoreSettings.deliveryFee` |
| Entregas/semana | 2 (terca + sexta) | `DeliveryWindow` |

## Calendario de entrega

### Janela 1 — Terca-feira
- Entrega: terca-feira.
- Cutoff: segunda-feira 18h (configuravel).
- Producao: segunda a noite / terca de madrugada (operacao fisica).

### Janela 2 — Sexta-feira
- Entrega: sexta-feira.
- Cutoff: quinta-feira 18h.
- Producao: quinta a noite / sexta de madrugada.

## Politica de frescor

- Pedidos confirmados entram na fila de producao da janela escolhida.
- Estoque de produto **inteiro** e reservado/baixado na confirmacao do pagamento.
- Corte e montagem dos recipientes ocorre no dia da entrega.

## Precificacao sugerida

### Combos
- Preco fechado por combo (ex: R$ 59,90 salada semanal).
- Exibir: peso total aproximado, serve X pessoas, lista de itens.

### Avulsos
- Por porcao/recipiente (preco fixo por unidade).
- Por kg (preco/kg, quantidade decimal no pedido futuro).
- Por unidade (ex: 1 coco, 1 abacaxi).

## Custos operacionais a considerar

- Perda/shrink (hortifruti).
- Embalagem (recipientes, rotulos).
- Mao de obra de corte e montagem.
- Logistica ultima milha (2 rotas/semana).
- Gateway pagamento (~2-4% Pix/cartao).

## Metricas de negocio

| Metrica | Descricao |
|---------|-----------|
| Ticket medio | Valor medio por pedido |
| Mix combo vs avulso | % receita por tipo |
| Pedidos por janela | Distribuicao terca vs sexta |
| Taxa recompra | Clientes que pedem 2+ vezes em 30 dias |
| Perda de estoque | kg descartados / kg comprados |
| Tempo corte/pedido | Eficiencia operacional |

## Expansao futura

- Plano **Fresh Semanal**: assinatura com desconto 10%.
- Combos sazonais (inverno: sopas; verao: frutas).
- B2B escritorios (pedido minimo maior, nota fiscal).
