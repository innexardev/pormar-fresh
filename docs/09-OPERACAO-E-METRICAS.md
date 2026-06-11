# 09 — Operacao e Metricas

## Checklist diario (dia de entrega)

### Manha (antes do corte)
- [ ] Conferir pedidos `confirmed` da janela do dia.
- [ ] Verificar estoque bruto vs demanda.
- [ ] Imprimir lista de separacao (quando P1.6 pronto).

### Producao
- [ ] Avancar pedidos para `preparing`.
- [ ] Cortar e montar recipientes no dia.
- [ ] Marcar `ready` quando embalados.

### Entrega
- [ ] Organizar rotas por bairro.
- [ ] Avancar `out_for_delivery` ao sair.
- [ ] Confirmar `delivered` ao entregar.

### Fim do dia
- [ ] Registrar perdas/desperdicio (ajuste estoque).
- [ ] Revisar produtos abaixo do minimo.

---

## Checklist segunda/quinta (cutoff)

- [ ] Avisar clientes 2h antes do cutoff (WhatsApp P2).
- [ ] Fechar pedidos pendentes nao pagos.
- [ ] Planejar compra fornecedor para dia D.

---

## KPIs semanais

| KPI | Meta inicial | Como medir |
|-----|--------------|------------|
| Pedidos/semana | 30+ | Count orders |
| Ticket medio | R$ 70+ | total / pedidos |
| % combos | > 60% receita | order_items tipo |
| Recompra 30d | > 25% | customers repeat |
| Pedidos terca vs sexta | equilibrio 40-60% | delivery_window |
| Ruptura estoque | < 5% pedidos | erros checkout |
| Tempo preparo | < 4h | preparing → ready |

---

## Go-live checklist

### Infra
- [ ] Postgres producao com backup.
- [ ] `.env` producao configurado.
- [ ] HTTPS no site e admin.
- [ ] Pix Asaas homologado.

### Produto
- [ ] Cardapio real com precos finais.
- [ ] Pedido minimo e taxa revisados.
- [ ] Janelas terca/sexta testadas.
- [ ] Fluxo pagamento real testado.

### Operacao
- [ ] Equipe treinada no admin.
- [ ] Processo de corte documentado.
- [ ] Rotas de entrega definidas.
- [ ] WhatsApp suporte ativo.

---

## Contatos operacionais (preencher)

| Funcao | Nome | Contato |
|--------|------|---------|
| Producao / corte | | |
| Entrega | | |
| Atendimento | | |
| Fornecedor hortifruti | | |

---

## Riscos operacionais

| Risco | Mitigacao |
|-------|-----------|
| Produto estraga | Comprar proximo ao corte; estoque bruto minimo |
| Pico pedidos terca | Limitar vagas por janela (P2) |
| Chuva/atraso entrega | Comunicacao WhatsApp |
| Falha Pix | Fallback copia-cola + confirmacao manual |
