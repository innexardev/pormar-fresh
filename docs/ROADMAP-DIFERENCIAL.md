# Roadmap Diferencial — Pomar Fresh

O que foi implementado e o que falta para ser referência no mercado.

---

## ✅ Implementado agora (comunicação inteligente)

### Alertas para equipe (`/equipe`)
- **2 números WhatsApp** configuráveis no admin
- Eventos com toggle individual:
  - Novo pedido
  - Novo cadastro
  - Nova assinatura
  - Pagamento recebido
  - Erro de pagamento
  - Suporte aberto
  - Pedido cancelado

### Bot WhatsApp com menu 1–5
Cliente envia *menu*, *ajuda* ou número:

| Opção | Ação |
|-------|------|
| **1** | Link do cardápio |
| **2** | Status do pedido |
| **3** | Minha conta |
| **4** | Abrir suporte |
| **5** | Promoções (cupom POMAR10) |

Mensagem livre (texto longo) → abre chamado de suporte automaticamente.

### Sistema de suporte (`/suporte`)
- Chamados com histórico de mensagens
- Resposta via WhatsApp direto do painel
- Status: aberto → em atendimento → resolvido → fechado
- Alerta para equipe quando abre

### Lembretes de reengajamento
- Clientes sem pedido há X dias (padrão: 14)
- Template `reminder_inactive` editável
- Envio automático 1×/dia + botão manual no admin

### Mensagens expandidas (`/mensagens`)
Abas: Pedidos | Bot | Lembretes | Alertas equipe | Opções do menu

---

## 💡 Ideias diferenciais — próximas fases

### P0 — Curto prazo (alto impacto)
| Feature | Descrição |
|---------|-----------|
| Vincular receita ao combo no admin | Fechar lacuna de custo/produção |
| Pix real Asaas + alerta falha automático | Webhook Asaas → `payment_failed` |
| Badge suporte no menu admin | Contador de chamados abertos |
| Lembrete antes do cutoff | "Últimas horas para pedir terça/sexta" |
| Pós-entrega NPS | "Como foi? 1-5" via WhatsApp |

### P1 — Médio prazo
| Feature | Descrição |
|---------|-----------|
| Campanhas segmentadas | "Comprou kit família → sugerir assinatura" |
| Lista de espera por produto esgotado | Aviso quando voltar |
| Cashback / pontos fidelidade | Saldo na `/conta` |
| Rastreio entregador em tempo real | Link mapa quando saiu p/ entrega |
| NF-e automática para cliente | Integração emissor |

### P2 — Diferencial forte
| Feature | Descrição |
|---------|-----------|
| Assistente IA no WhatsApp | Responde dúvidas sobre produtos com catálogo |
| Previsão de demanda | ML sobre histórico → sugerir compra CEASA |
| App entregador | Confirmar entrega + foto |
| Multi-loja / franquia | Vários pontos Pomar Fresh |
| OCR nota fiscal → estoque | Upload NF → ingredientes automaticamente |

---

## O que ainda falta no sistema (visão geral)

| Área | Gap |
|------|-----|
| **Receitas** | UI para vincular produto/combo |
| **Pagamentos** | Pix produção Asaas completo |
| **Assinaturas** | Cobrança recorrente automática + lembrete |
| **Produção** | Kanban visual de pedidos |
| **Marketing** | E-mail + push segmentado |
| **Analytics** | Funil conversão checkout |
| **Mobile admin** | PWA admin para operação na cozinha |

---

*Atualizado: junho/2026*
