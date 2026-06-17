# Pomar Fresh — Plano Master Completo

> Documento consolidado: operação, cliente, WhatsApp (Evolution API), fornecedores e custos.  
> Atualizado: junho/2026

---

## 1. Visão geral

O Pomar Fresh opera delivery de hortifruti cortado no dia (terça e sexta). Este plano cobre:

| Frente | Objetivo |
|--------|----------|
| **A** | Experiência do cliente pós-pedido |
| **B** | Fornecedores e notas fiscais |
| **C** | Painel admin operacional |
| **D** | Integração operacional (pedido → produção → compra) |
| **E** | Evolution API + WhatsApp transacional |

---

## 2. Estado atual vs implementado neste ciclo

### Já existia (base)
- Ingredientes, compras manuais, receitas, BOM, produção, relatórios de custo
- Checkout guest + registro `Customer` por telefone
- Rastreio por URL `/pedido/{uuid}`
- `WhatsappService` básico (3 mensagens, mock se env vazio)
- Admin custos, pedidos, clientes

### Implementado neste ciclo
- [x] Documento master (este arquivo)
- [x] Evolution API no Docker Compose
- [x] Templates de mensagem editáveis no admin
- [x] Mensagens automáticas com link de rastreio
- [x] Login cliente por OTP WhatsApp
- [x] Página `/conta` — Meus pedidos
- [x] Auto-refresh na página do pedido
- [x] Cadastro de fornecedores
- [x] Upload e parse de NF-e XML
- [x] Webhook Evolution (respostas + status conexão)
- [x] Admin: integrações WhatsApp, mensagens, fornecedores, notas

---

## 3. Frente A — Cliente pós-pedido

### Fluxo alvo

```
Checkout → Pix → WhatsApp (pedido + link)
    → /pedido/{id} (auto-refresh)
    → /conta (OTP WhatsApp) → histórico
```

### A1 — Melhorias imediatas ✅
- Campo e-mail no checkout
- WhatsApp na criação do pedido e Pix pendente (com `{link}`)
- Polling 30s em `/pedido/[id]` enquanto `pending`
- Banner “Guarde o link ou acesse Minha conta”

### A2 — Minha conta por telefone ✅
- `POST /public/auth/otp/request` — envia código via WhatsApp
- `POST /public/auth/otp/verify` — JWT cliente 30 dias
- `GET /public/customers/me/orders` — histórico autenticado

### A3 — Área assinante (próximo sprint)
- Ver assinatura, próximas entregas
- Pausar / cancelar
- Histórico de cobranças Pix

### A4 — Segurança (próximo sprint)
- Opcional: exigir OTP para ver pedido por ID
- Desabilitar `/payments/simulate` em produção (`NODE_ENV=production`)

---

## 4. Frente E — Evolution API + WhatsApp

### Infra ✅

```yaml
# docker-compose.prod.yml
evolution:
  image: atendai/evolution-api:v2.2.3
  → pomar-redis, volume evolution_data
  → Traefik: evolution.${DOMAIN} (admin)
```

**Variáveis (.env):**
```env
WHATSAPP_API_URL=http://evolution:8080          # interno Docker
WHATSAPP_PUBLIC_URL=https://evolution.onnshoppe.com  # QR no admin
WHATSAPP_API_KEY=...
WHATSAPP_INSTANCE=pomar-fresh
NEXT_PUBLIC_SITE_URL=https://onnshoppe.com
```

### Catálogo de templates ✅

| Key | Evento |
|-----|--------|
| `order_created` | Pedido criado |
| `payment_pending` | Pix gerado |
| `payment_confirmed` | Pagamento confirmado |
| `order_confirmed` | Status confirmado |
| `order_preparing` | Em separação |
| `order_ready` | Pronto |
| `order_out_for_delivery` | Saiu para entrega |
| `order_delivered` | Entregue |
| `subscription_created` | Assinatura criada |
| `otp_login` | Código de acesso |
| `tracking_link` | Reenvio manual |

Variáveis: `{nome}`, `{total}`, `{entrega}`, `{data}`, `{link}`, `{pix}`, `{codigo}`, `{pedido}`

### Admin ✅
- `/integracoes` — status, QR code, teste de envio
- `/mensagens` — editar templates
- Log de mensagens (`whatsapp_message_logs`)

### Webhook ✅
- `POST /webhooks/whatsapp` — mensagens recebidas
- Bot: `status`, `pedido`, `cardapio`, `ajuda`

### Próximo
- Inbox de conversas no admin
- Push PWA por telefone (vincular no `/conta`)
- Lembrete 2h antes do cutoff

---

## 5. Frente B — Fornecedores e notas

### B1 — Fornecedores ✅
- Modelo `Supplier` (CNPJ, contatos, categorias)
- Admin `/fornecedores` — CRUD
- Compras vinculam `supplierId`

### B2 — Notas fiscais ✅ (MVP)
- Upload XML NF-e
- Parse automático: CNPJ, itens, totais
- Status: `pending` → `reviewed` → `posted`
- Admin `/notas-fiscais`

### B3 — Próximo sprint
- OCR PDF/foto
- Tabela mapeamento descrição NF → ingrediente
- Confirmação multi-item → N compras em lote
- Custo médio ponderado

---

## 6. Frente C — Admin

### Melhorado ✅
- Login split-screen, sidebar agrupada, dashboard cards
- FormFields padronizados

### Próximo
- Kanban de pedidos por status
- Ficha cliente enriquecida
- Botão “Reenviar link WhatsApp” no pedido

---

## 7. Frente D — Integração operacional

```
Pedido confirmado → BOM → Plano produção → Lista compras
    → Nota fornecedor → Estoque ingredientes → Cliente notificado
```

**Próximo:** botão “Registrar compras do plano” na produção.

---

## 8. Roadmap de sprints

| Sprint | Entregas | Status |
|--------|----------|--------|
| S1 | Evolution Docker + templates + msgs com link | ✅ |
| S2 | OTP + /conta + pedido polling + e-mail checkout | ✅ |
| S3 | Fornecedores + NF-e XML upload | ✅ |
| S4 | Área assinante + mapeamento NF→ingrediente | 🔲 |
| S5 | OCR + custo médio + inbox WhatsApp | 🔲 |
| S6 | Kanban pedidos + integração produção→compra | 🔲 |

---

## 9. Configuração Evolution API (produção)

1. Subir stack: `docker compose -f docker-compose.prod.yml up -d evolution`
2. Acessar `https://evolution.${DOMAIN}/manager`
3. Criar instância `pomar-fresh` ou usar API:
   ```bash
   curl -X POST "https://evolution.${DOMAIN}/instance/create" \
     -H "apikey: $WHATSAPP_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"instanceName":"pomar-fresh","integration":"WHATSAPP-BAILEYS","qrcode":true}'
   ```
4. Escanear QR no admin → Integrações
5. Configurar webhook na instância apontando para `/api/v1/webhooks/whatsapp`
6. Preencher `.env` e reiniciar API

---

## 10. Arquivos principais

| Área | Paths |
|------|-------|
| Schema | `apps/api/prisma/schema.prisma` |
| WhatsApp | `apps/api/src/notifications/` |
| OTP | `apps/api/src/customer-auth/` |
| Fornecedores | `apps/api/src/suppliers/` |
| Admin mensagens | `apps/admin/src/app/mensagens/` |
| Admin fornecedores | `apps/admin/src/app/fornecedores/` |
| Admin notas | `apps/admin/src/app/notas-fiscais/` |
| Conta cliente | `apps/web/src/app/conta/` |
| Docker Evolution | `docker-compose.prod.yml` |

---

## 11. Métricas de sucesso

- % pedidos com WhatsApp entregue com sucesso
- Tempo médio checkout → pagamento confirmado
- % clientes que acessam `/conta` vs link direto
- Notas importadas vs compras manuais
- Variação de custo/kg por ingrediente (relatório existente)

---

*Innexar · Pomar Fresh · Plano vivo — revisar a cada sprint.*
