# Pomar Fresh — Módulo de Cálculo de Custo e Preço

Documento de referência do módulo de custo, rendimento, margem e precificação automática.

> Marca operacional: **Pomar Fresh** (repositório mantém nome técnico `fresh-box-online`).

---

## 1. Gap analysis — o que já existe vs. blueprint

| Área | Blueprint | Status atual | Fase |
|------|-----------|--------------|------|
| Catálogo vendável | Produtos + combos | ✅ Implementado | — |
| Estoque avulsos | `StockMovement` + baixa no pagamento | ✅ Implementado | — |
| Ingredientes base (compra bruta) | Cadastro + fornecedor + validade | 🟡 Schema + API + UI básica | **P0** |
| Compras / custo líquido | Preço ÷ peso líquido | 🟡 Registro de compra + cálculo | **P0** |
| Rendimento / desperdício | Histórico + média últimos 20 | 🟡 `YieldRecord` + média automática | **P0** |
| Embalagens | Pote, bandeja, custo unitário | 🟡 CRUD + uso em receita | **P0** |
| Receitas (BOM) | Ingredientes + embalagem | 🟡 CRUD + simulação | **P0** |
| Margem / markup | Lucro %, preço sugerido | 🟡 `PricingSettings` + calculadora | **P0** |
| Markup inteligente | Sugestão por perecibilidade | ⬜ Planejado | P1 |
| Simulação de preço | Trocar itens em tempo real | 🟡 Endpoint `simulate` | **P0** |
| Estoque ingrediente | Entrada bruta → líquido → baixa | 🟡 Movimentos separados | P1 |
| **Produção por dia** | Lista compras pós-cutoff | ✅ Plano + lista compras | **P1** |
| **Relatórios** | Lucro, desperdício, evolução preço, vendas | ✅ `/admin/pricing/reports` | **P1** |
| **Alertas automáticos** | Margem, validade, estoque, custo | ✅ scan + UI alertas | **P1** |
| **Baixa estoque ingrediente** | Ao confirmar pedido (BOM) | ✅ `BomService` | **P1** |
| Preço dinâmico automático | Recalcular ao subir custo | 🟡 flag `autoUpdatePrices` | P2 |
| **Integração pedidos → produção** | Agregar BOM dos pedidos | ✅ `ProductionPlan` | **P1** |

**Legenda:** ✅ pronto · 🟡 em implementação nesta entrega · ⬜ backlog

---

## 2. Modelo de dados (novas entidades)

```
Ingredient ──< IngredientPurchase
     │
     └──< YieldRecord
     └──< IngredientStockMovement

Packaging

Recipe ──< RecipeItem ──> Ingredient
  ├── packagingId → Packaging
  ├── productId? → Product
  └── comboId? → Combo

PricingSettings (singleton)
PricingAlert
ProductionPlan ──< ProductionPlanItem   [P1]
```

---

## 3. Fórmulas oficiais

### Custo líquido por kg

```
custo_liquido_kg = valor_pago / (peso_liquido_g / 1000)
```

### Rendimento

```
rendimento_% = (peso_liquido_g / peso_bruto_g) × 100
```

### Média de rendimento (aprendizado)

Últimos **20** registros (`YieldRecord` ou compras com peso) → atualiza `Ingredient.avgYieldPercent`.

### Custo da receita

```
custo_ingredientes = Σ (gramas_item / 1000 × custo_liquido_kg_ingrediente)
custo_total = custo_ingredientes + custo_embalagem + taxa_perda_media
```

### Preço de venda

```
markup = 1 + (lucro_desejado_% / 100)
preco_bruto = custo_total × markup
preco_final = arredondar(preco_bruto, incremento)  // default R$ 0,10
```

**Exemplo:** custo R$ 5,30 · lucro 120% → R$ 5,30 × 2,2 = R$ 11,66 → **R$ 11,70**

---

## 4. API (prefixo `/api/v1/admin/pricing`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/dashboard` | KPIs custo, margem, alertas |
| GET/POST/PATCH | `/ingredients` | CRUD ingredientes |
| POST | `/ingredients/:id/purchases` | Registrar compra + atualizar custo |
| GET/POST | `/ingredients/:id/yields` | Registrar rendimento/perda |
| GET/POST/PATCH | `/packaging` | CRUD embalagens |
| GET/POST/PATCH | `/recipes` | CRUD receitas |
| POST | `/recipes/:id/simulate` | Simular custo/preço com alterações |
| POST | `/recipes/:id/apply-price` | Aplicar preço sugerido em Product/Combo |
| GET/PATCH | `/settings` | Margens globais e arredondamento |

### Produção (`/api/v1/admin/production`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/upcoming` | Próximas entregas + pedidos + plano existente |
| POST | `/generate` | Gera/recalcula plano (BOM + lista compras) |
| GET | `/plans` | Histórico de planos |
| GET | `/plans/:id` | Detalhe: compras, produzir, embalagens |
| PATCH | `/plans/:id/finalize` | Marca plano como finalizado |

### Relatórios e alertas

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/admin/pricing/reports?weeks=8` | Relatório completo |
| GET | `/admin/pricing/alerts` | Listar alertas |
| POST | `/admin/pricing/alerts/scan` | Executar verificação |
| PATCH | `/admin/pricing/alerts/:id/read` | Marcar lido |
| GET | `/admin/pricing/ingredients/:id/movements` | Movimentos estoque ingrediente |

---

## 5. Admin UI

| Rota | Tela |
|------|------|
| `/custos` | Dashboard Pomar Fresh |
| `/custos/ingredientes` | Lista + compras |
| `/custos/embalagens` | Embalagens |
| `/custos/receitas` | Receitas + simulador |
| `/custos/producao` | Plano de produção + lista de compras |
| `/custos/relatorios` | Relatórios analíticos |
| `/custos/alertas` | Alertas + verificação manual |
| `/custos/configuracoes` | Margens, arredondamento, auto-preço |

---

## 6. Roadmap interno do módulo

### P0 ✅
- Schema Prisma + migration
- Calculadora de custo/preço
- CRUD ingredientes, embalagens, receitas
- Simulação e apply-price
- Dashboard básico admin

### P1 ✅
- ✅ Plano de produção pós-cutoff (ter/sex 18h)
- ✅ Integração pedidos confirmados → BOM
- ✅ Baixa estoque ingrediente na confirmação do pedido
- ✅ Relatórios completos (lucro, desperdício, vendas, evolução preço)
- ✅ Alertas automáticos (margem, validade, estoque, custo)
- ✅ Configurações de margem + auto-update preços
- Estoque bruto/líquido integrado na baixa (parcial — movimentos registrados)

### P2
- Preço dinâmico (sugerir / auto / avisar)
- Markup inteligente por perecibilidade
- Assinatura, iFood, etiquetas (futuro blueprint)

---

## 7. Integração com módulos existentes

| Módulo existente | Integração |
|------------------|------------|
| `Product` | Receita pode vincular produto avulso; `apply-price` atualiza `price` |
| `Combo` | Receita pode vincular combo; `apply-price` atualiza `price` |
| `StockMovement` | MVP: só produtos avulsos; P1: `IngredientStockMovement` |
| `Order` | Pedidos confirmados+ → `ProductionPlan` via `/admin/production/generate` |
| `DeliveryWindow` | Cutoff (seg/qui 18h) usado no plano e slot `upcoming` |
