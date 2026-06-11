# 07 — API Endpoints

Base: `http://localhost:3010/api/v1`

---

## Publico (sem auth)

### Loja
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/public/store` | Nome, taxas, pedido minimo |

### Cardapio
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/public/menu` | Combos + produtos + categorias |
| GET | `/public/combos/:id` | Detalhe combo |

### Entrega
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/public/delivery/windows` | Janelas terca/sexta disponiveis |

### Pedidos
| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/public/orders` | Criar pedido |
| GET | `/public/orders/:id` | Consultar pedido + timeline |

**Body POST /public/orders:**
```json
{
  "customer": { "name": "Maria", "phone": "11999999999", "email": "maria@email.com" },
  "delivery_window_id": "uuid",
  "delivery_date": "2026-06-10",
  "address": {
    "street": "Rua A", "number": "100", "complement": "",
    "neighborhood": "Centro", "city": "Sao Paulo", "zip_code": "01001000"
  },
  "notes": "Sem cebola",
  "items": [
    { "type": "combo", "id": "uuid-combo", "quantity": 1 },
    { "type": "product", "id": "uuid-prod", "quantity": 2 }
  ]
}
```

### Pagamentos
| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/public/orders/:id/payments/pix` | Gerar Pix |
| POST | `/public/orders/:id/payments/simulate` | Simular pagamento (demo) |

---

## Auth

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/auth/login` | `{ email, password }` → JWT |

---

## Admin (Bearer JWT)

### Dashboard
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/admin/dashboard` | Metricas resumo |

### Pedidos
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/admin/orders?status=active` | Lista pedidos |
| PATCH | `/admin/orders/:id/status` | `{ status }` |

### Produtos
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/admin/products` | Lista |
| POST | `/admin/products` | Criar |
| PATCH | `/admin/products/:id` | Atualizar |
| POST | `/admin/products/:id/stock` | Ajustar estoque |

### Combos
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/admin/combos` | Lista |
| POST | `/admin/combos` | Criar |
| PATCH | `/admin/combos/:id` | Atualizar |

### Estoque
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/admin/stock/low` | Produtos abaixo do minimo |
| GET | `/admin/stock/movements` | Historico |

### Categorias
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/admin/categories` | Lista |

---

## Codigos de erro comuns

| Codigo / mensagem | Causa |
|-------------------|-------|
| Pedido minimo | Subtotal abaixo de minOrderValue |
| Estoque insuficiente | Produto avulso sem stock |
| Transicao invalida | Status incorreto no admin |
| Credenciais invalidas | Login admin |

---

## Status de pedido (valores)

`pending` | `confirmed` | `preparing` | `ready` | `out_for_delivery` | `delivered` | `cancelled`
