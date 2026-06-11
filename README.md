# Pomar Fresh

Site + cardápio + pedidos online para **combos de frutas, legumes e verduras cortados**, com painel administrativo, estoque e entregas **2x por semana**.

## Documentacao completa

**Planejamento e contexto de cada feature:**

- **[docs/PLANEJAMENTO-MASTER.md](./docs/PLANEJAMENTO-MASTER.md)** — visao geral consolidada
- **[docs/INDEX.md](./docs/INDEX.md)** — indice de todos os documentos
- **[docs/04-FEATURES-DETALHADAS.md](./docs/04-FEATURES-DETALHADAS.md)** — especificacao das 20 features (F1–F20)

## O que inclui

| Modulo | Descricao |
|--------|-----------|
| **Site publico** | Home, cardapio (combos + avulsos), checkout, pagamento Pix, acompanhamento |
| **Painel admin** | Dashboard, pedidos, produtos, combos, estoque |
| **API** | Produtos com peso/unidade, combos, janelas de entrega, estoque, pedidos |

## Modelo de negocio

- Combos prontos em recipientes (peso, porcoes, serve X pessoas)
- Produtos avulsos por kg, porcao ou unidade
- Cliente escolhe **entrega de terca ou sexta** (2x/semana)
- Corte no dia da entrega
- Estoque baixa automaticamente ao confirmar pagamento

## Como rodar

```bash
cd fresh-box-online

# Banco (Docker — porta 5433)
docker compose up -d

copy .env.example .env
copy .env apps\api\.env

npm install
npm run db:generate
cd apps/api && npx prisma migrate dev --name init && npm run prisma:seed && cd ../..

npm run dev
```

## URLs

| Servico | URL |
|---------|-----|
| Site | http://localhost:3020 |
| Admin | http://localhost:3021 |
| API | http://localhost:3010/api/v1 |

## Login admin

- Email: `admin@freshbox.com`
- Senha: `admin123`

## Fluxo demo

1. Acesse o site → Cardapio → adicione combos
2. Checkout → escolha entrega (terca ou sexta)
3. Finalize → simule Pix na pagina do pedido
4. Admin → Pedidos → avance status (cortando → pronto → entregue)
5. Admin → Estoque → veja movimentacoes e alertas

## Proximos passos

- Pix real (Asaas)
- Formulario de cadastro de produtos/combos no admin
- Areas de entrega por CEP
- Notificacao WhatsApp
