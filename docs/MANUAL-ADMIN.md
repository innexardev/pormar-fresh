# Manual do Painel Admin — Pomar Fresh

Guia operacional completo do painel em **https://admin.onnshoppe.com**

---

## 1. Acesso

| Campo | Valor |
|-------|-------|
| URL | `https://admin.onnshoppe.com` |
| Login demo | `admin@freshbox.com` |
| Senha demo | `admin123` |

Após login, o token fica salvo no navegador. Use **Sair** no rodapé da sidebar para encerrar a sessão.

---

## 2. Visão geral do painel

O menu lateral está organizado em **5 grupos**:

```
VISÃO GERAL     → Dashboard
OPERAÇÃO        → Pedidos, Fornecedores, Notas fiscais, Estoque, Clientes, Assinaturas
CATÁLOGO        → Produtos, Combos, Mídia do site, Cupons
CONFIGURAÇÃO    → Áreas de entrega, Integrações, Mensagens WhatsApp
CUSTOS & PREÇOS → Visão geral, Ingredientes, Embalagens, Receitas, Produção, Relatórios, Alertas, Configurações
```

### Dois “mundos” que o operador precisa entender

| Mundo | O que é | Onde gerenciar |
|-------|---------|----------------|
| **Catálogo (venda)** | O que o cliente vê e compra no site | Produtos, Combos, Cupons |
| **Produção (custo)** | Ingredientes, receitas, plano de produção | Custos & preços |

**Importante:** existem **dois tipos de estoque**:

- **Estoque de produtos** (`/estoque`) — unidades vendáveis do cardápio (ex.: “Melancia 250g avulsa”).
- **Estoque de ingredientes** (`/custos/ingredientes`) — kg líquido/bruto para produção e custo.

---

## 3. Receitas — como funcionam e vínculo com produto/combo

### 3.1 Sim, a receita é associada a produto OU combo

No banco de dados, cada **Receita** pode ter **no máximo um vínculo de catálogo**:

```
Receita
├── productId  →  Produto avulso (ex.: Melancia 250g)
├── comboId    →  Combo (ex.: Kit Família — Clássico)
├── packagingId → Embalagem (pote, bandeja…)
└── items[]    →  Ingredientes + gramas (BOM de produção)
```

- **Produto avulso** → receita com `productId`.
- **Combo** → receita com `comboId`.
- Uma receita **não** vincula produto e combo ao mesmo tempo.

### 3.2 Para que serve o vínculo

| Sem vínculo | Com vínculo (productId ou comboId) |
|-------------|-------------------------------------|
| Simula custo e margem | Tudo acima **+** |
| — | **Aplicar preço** atualiza o preço no catálogo |
| — | **Pedidos** descontam ingredientes corretamente (BOM) |
| — | **Plano de produção** calcula lista de compras |

### 3.3 O que aparece na tela de Combos ≠ Receita

Na página **Combos**, cada item do combo é **texto livre** (nome + gramas) — serve para **mostrar ao cliente** o que vem no kit.

Na página **Receitas**, os itens são **ingredientes cadastrados** com gramas — serve para **custo, estoque e produção**.

São duas listas **independentes**. O sistema **não sincroniza** automaticamente quando você edita um combo no admin.

### 3.4 Como as receitas são criadas hoje

| Forma | Quando acontece |
|-------|-----------------|
| **Seed automático** | Na instalação: `seedComboRecipes()` cria receita para combos cujo nome de item bate com nome de ingrediente |
| **Seed manual** | Exemplo: receita “Pote Tropical” vinculada ao combo Individual Tropical |
| **Pelo admin** | Formulário em `/custos/receitas` — **cria receita sem vínculo** (limitação atual) |

### 3.5 Limitação atual do painel (importante)

O formulário **Custos → Receitas** permite:

- Nome, embalagem, margem, ingredientes em gramas
- **Simular** custo e preço sugerido
- **Aplicar preço** — só se a receita já estiver vinculada a produto/combo

O formulário **não permite** (ainda):

- Escolher produto ou combo ao criar a receita
- Editar ou excluir receita existente
- Alterar vínculo depois de criada

**Consequência prática:** receitas criadas pelo admin ficam “soltas”. Para vincular, hoje é necessário ajuste via banco/API ou rodar o seed que gera receitas para combos existentes.

**Workaround operacional:**

1. Cadastre **ingredientes** com o **mesmo nome** dos itens do combo (ex.: Melancia, Melão, Abacaxi, Manga).
2. Peça ao suporte técnico para rodar a geração automática de receitas dos combos, **ou**
3. Defina preço manualmente em **Produtos/Combos** até o vínculo de receita ser implementado na UI.

### 3.6 Fluxo ideal de precificação (quando receita está vinculada)

```
1. Cadastrar ingredientes + registrar compras (atualiza custo/kg)
2. Cadastrar embalagens (custo unitário)
3. Criar receita VINCULADA ao produto ou combo
4. Simular → ver custo, margem e preço sugerido
5. Aplicar preço → atualiza preço no cardápio
6. Cliente compra → pedido usa BOM da receita → produção e estoque de ingredientes
```

---

## 4. Guia por seção do menu

### 4.1 Dashboard (`/dashboard`)

**Objetivo:** visão rápida da operação.

- Pedidos do dia / pendentes
- Receita recente
- Resumo do catálogo

**Quando usar:** início do turno, conferência rápida antes das entregas.

---

### 4.2 Pedidos (`/pedidos`)

**Objetivo:** gerenciar todo o ciclo de vida dos pedidos.

**Ações principais:**

| Ação | Descrição |
|------|-----------|
| Filtrar | Por status, data de entrega, busca |
| Ver detalhe | Cliente, endereço, itens, total, histórico de status |
| Avançar status | `confirmado → preparando → pronto → saiu p/ entrega → entregue` |
| Cancelar | Restaura estoque se já confirmado |
| Exportar CSV | Por intervalo de datas |
| WhatsApp | Link rápido para falar com o cliente |

**Fluxo de status:**

```
pendente → confirmado → preparando → pronto → saiu p/ entrega → entregue
                ↘ cancelado (em qualquer etapa permitida)
```

**Lista de separação** (`/pedidos/separacao`):

- Acesse pelo botão na página de Pedidos (não aparece no menu lateral).
- Mostra lista consolidada por ingrediente/produto + lista por cliente.
- Use para **montar os kits** no dia da produção.
- Botão **Imprimir** para levar à cozinha.

---

### 4.3 Fornecedores (`/fornecedores`)

**Objetivo:** cadastro de fornecedores (CEASA, atacado, etc.).

- Buscar por nome/CNPJ
- Criar novo fornecedor (nome, CNPJ, contato, observações)

**Próximo passo natural:** importar NF-e em **Notas fiscais** vinculada ao fornecedor.

---

### 4.4 Notas fiscais (`/notas-fiscais`)

**Objetivo:** importar XML de NF-e de compra.

| Passo | Ação |
|-------|------|
| 1 | Colar conteúdo XML ou fazer upload |
| 2 | Sistema extrai fornecedor, itens, valores |
| 3 | Revisar e marcar como **revisada** ou **lançada** |

**Atenção:** itens da NF **não entram automaticamente** no estoque de ingredientes. Após revisar, vá em **Custos → Ingredientes** e registre a **compra** manualmente com peso bruto/líquido e rendimento.

---

### 4.5 Estoque (`/estoque`)

**Objetivo:** estoque de **produtos do cardápio** (unidades vendáveis).

- Ver produtos com estoque baixo
- Registrar **entrada** de estoque em produto avulso
- Ver movimentações recentes

**Não confundir** com estoque de ingredientes (Custos → Ingredientes).

---

### 4.6 Clientes (`/clientes`)

**Objetivo:** lista de clientes e histórico resumido.

- Busca por nome ou telefone
- Ver pedidos recentes de cada cliente
- Telefone é a chave de login OTP no site (`/conta`)

---

### 4.7 Assinaturas (`/assinaturas`)

**Objetivo:** combos recorrentes semanais.

| Ação | Quando |
|------|--------|
| Pausar / reativar / cancelar | Cliente pediu pausa |
| **Gerar pedidos da semana** | Antes de cada janela (terça/sexta) — cria pedidos automaticamente |

---

### 4.8 Produtos (`/produtos`)

**Objetivo:** CRUD de produtos avulsos do cardápio.

| Campo | Uso |
|-------|-----|
| Nome, descrição, categoria | Exibição no site |
| Preço | Valor de venda |
| Peso (g), unidade | Porção vendida |
| Estoque, estoque mínimo | Controle de disponibilidade |
| Imagem | Upload ou URL |
| Ativo | Aparece ou não no cardápio |

**Dica:** produto avulso com receita vinculada pode ter preço atualizado via **Custos → Receitas → Aplicar preço**.

---

### 4.9 Combos (`/combos`)

**Objetivo:** CRUD de kits (Individual, Médio, Família, Sopas, etc.).

| Campo | Uso |
|-------|-----|
| Nome, descrição, categoria | Exibição no site |
| Preço | Valor do kit |
| Itens do combo | **Texto livre** — o que o cliente vê (ex.: “Melancia 900g”) |
| Destaque / Ativo | Banner no cardápio e visibilidade |
| Imagem | Foto do kit |

**Itens do combo ≠ receita de produção.** Para custo e produção, configure a receita em Custos (com vínculo ao combo).

---

### 4.10 Mídia do site (`/midia`)

**Objetivo:** conteúdo visual da home pública.

- Imagem hero (banner principal)
- URLs de fallback
- Cards da home (título, descrição, imagem)

Alterações refletem em **onnshoppe.com** após salvar.

---

### 4.11 Cupons (`/cupons`)

**Objetivo:** códigos promocionais.

- Criar cupom (% ou valor fixo, pedido mínimo, limite de usos)
- Ativar/desativar
- Cliente usa no checkout (`POMAR10` no seed = 10% off, mín. R$ 49)

---

### 4.12 Áreas de entrega (`/entrega`)

**Objetivo:** onde entregamos e quanto cobramos.

**Abas / seções:**

| Seção | Função |
|-------|--------|
| Configurações da loja | Taxa padrão, pedido mínimo, WhatsApp de contato |
| Zonas | CEPs/bairros atendidos + taxa por zona |
| Bloqueios | Datas sem entrega (feriados) |
| Teste de CEP | Simular se endereço é atendido |

**Exemplo atual:** zona Praia Grande — CEP 11700–11707.

---

### 4.13 Integrações (`/integracoes`)

**Objetivo:** status dos serviços externos.

| Serviço | O que fazer |
|---------|-------------|
| MinIO | Armazenamento de imagens — deve estar **Ativo** |
| Pix Asaas | Pagamento real — configurar chave API |
| WhatsApp | Conectar Evolution API |
| Push PWA | Notificações no celular do cliente |

**WhatsApp — passo a passo:**

1. Verificar badge **WhatsApp: Conectado**
2. Se desconectado: **Gerar QR Code** → escanear no celular
3. Se falhar: **Reiniciar instância** → gerar QR novamente
4. **Enviar teste** com número (DDD + número, ex.: `13996189772`)
5. **Abrir Manager** → painel Evolution em `evolution.onnshoppe.com/manager`

Chave API (Evolution): definida em `.env` como `WHATSAPP_API_KEY`.

---

### 4.14 Mensagens WhatsApp (`/mensagens`)

**Objetivo:** editar textos automáticos enviados ao cliente.

Templates disponíveis (exemplos):

| Chave | Quando dispara |
|-------|----------------|
| `order_created` | Pedido criado |
| `payment_pending` | Aguardando Pix |
| `payment_confirmed` | Pagamento OK |
| `order_preparing` | Em preparo |
| `order_ready` | Pronto |
| `order_out_for_delivery` | Saiu para entrega |
| `order_delivered` | Entregue |
| `otp_login` | Código de acesso à conta |
| `tracking_link` | Link de rastreio |

**Variáveis** que pode usar no texto: `{nome}`, `{pedido}`, `{total}`, `{entrega}`, `{data}`, `{link}`, `{pix}`, `{codigo}`.

---

### 4.15 Custos — Visão geral (`/custos`)

Dashboard de margens: custo total das receitas, receitas mais/menos lucrativas, preview de alertas.

---

### 4.16 Ingredientes (`/custos/ingredientes`)

**Objetivo:** matéria-prima para produção e custo.

| Ação | Descrição |
|------|-----------|
| Criar ingrediente | Nome, categoria, unidade de compra, rendimento médio |
| Registrar compra | Fornecedor, peso bruto/líquido, preço pago → atualiza **custo/kg líquido** |
| Registrar rendimento | Ajuste de % de aproveitamento após produção |
| Ver movimentações | Entradas, saídas por pedido, ajustes |

**Estoque aqui é em kg** (líquido e bruto), diferente de `/estoque`.

---

### 4.17 Embalagens (`/custos/embalagens`)

Potes PET, bandejas, sacos — custo unitário usado no cálculo da receita.

---

### 4.18 Receitas (`/custos/receitas`)

**Objetivo:** BOM (lista de materiais) + simulador de preço.

**Criar receita:**

1. Nome (ex.: “Receita — Kit Família Clássico”)
2. Embalagem (opcional)
3. Margem desejada (%)
4. Ingredientes + gramas por unidade vendida

**Após criar:**

- **Simular** — breakdown de custo por ingrediente, preço sugerido, margens segura/ideal/premium
- **Aplicar preço** — só aparece se receita estiver **vinculada** a produto ou combo

---

### 4.19 Produção (`/custos/producao`)

**Objetivo:** plano do dia/semana de entrega.

| Passo | Ação |
|-------|------|
| 1 | Escolher slot de entrega (terça ou sexta + data) |
| 2 | **Gerar plano** — consolida pedidos confirmados |
| 3 | Ver lista de compras (kg bruto por ingrediente) |
| 4 | Ver quantidades por receita/combo |
| 5 | **Finalizar plano** quando produção concluída |

**Avisos comuns:** “Sem receita para {nome do combo}” — falta receita vinculada ao item vendido.

---

### 4.20 Relatórios (`/custos/relatorios`)

Análise de 4 a 12 semanas: receita, margem, desperdício, ranking de vendas, evolução de preços.

---

### 4.21 Alertas (`/custos/alertas`)

Alertas automáticos: margem abaixo do mínimo, ingrediente sem compra recente, preço desatualizado.

- **Escanear agora** — força nova verificação
- Marcar como lido

---

### 4.22 Configurações de custo (`/custos/configuracoes`)

Regras globais: margem mínima, arredondamento de preço, atualização automática ao registrar compra.

---

## 5. Fluxos do dia a dia

### 5.1 Manhã — preparar entrega do dia

```
Dashboard → Pedidos (filtrar data de hoje)
         → Pedidos → Lista de separação → Imprimir
         → Custos → Produção → Gerar plano (se ainda não gerou)
```

### 5.2 Durante produção

```
Separar conforme lista
Atualizar status dos pedidos: preparando → pronto
WhatsApp notifica cliente automaticamente (se conectado)
```

### 5.3 Saída para entrega

```
Pedidos → saiu p/ entrega → entregue
```

### 5.4 Após compra no CEASA

```
Notas fiscais → importar XML
Ingredientes → registrar compra (peso + preço)
Receitas → simular (custo mudou?) → aplicar preço se necessário
```

### 5.5 Novo combo no cardápio

```
Combos → criar combo + itens descritivos
Ingredientes → garantir que existem com mesmo nome (ou cadastrar)
[Suporte] vincular receita ao combo OU rodar seed de receitas
Receitas → simular → aplicar preço
```

### 5.6 Assinaturas semanais

```
Assinaturas → Gerar pedidos da semana (antes do cutoff)
Pedidos → conferir pedidos gerados
```

---

## 6. Mapa de interações entre módulos

```
                    ┌─────────────┐
                    │   SITE      │
                    │  (cliente)  │
                    └──────┬──────┘
                           │ compra
                           ▼
┌──────────┐    ┌──────────────────┐    ┌─────────────┐
│ Catálogo │◄───│     PEDIDOS      │───►│  WhatsApp   │
│ Produtos │    │  status/entrega  │    │  mensagens  │
│ Combos   │    └────────┬─────────┘    └─────────────┘
└────┬─────┘             │
     │ preço             │ consome BOM
     │ (aplicar)         ▼
     │          ┌──────────────────┐
     └─────────►│     RECEITAS     │◄─── Ingredientes
                │  (product/combo) │◄─── Embalagens
                └────────┬─────────┘
                           │
                           ▼
                ┌──────────────────┐
                │    PRODUÇÃO      │
                │ lista compras    │
                └──────────────────┘

Fornecedores ──► Notas fiscais ──► Ingredientes (compra manual)
```

---

## 7. Perguntas frequentes

### A receita é obrigatória para vender?

Não. O checkout funciona sem receita. Porém, **sem receita vinculada**:
- Não há desconto automático de ingredientes no pedido
- Plano de produção mostra aviso
- “Aplicar preço” não funciona para aquele item

### Por que o combo tem itens e a receita tem ingredientes?

Combo = marketing (o cliente lê). Receita = operação (cozinha e custo). Deveriam ser iguais na prática, mas hoje são cadastros separados.

### Onde vejo se um combo tem receita?

Custos → Receitas → procure “Vinculado: Kit Família — Clássico”. Se não aparecer, não há vínculo.

### Lista de separação vs Plano de produção?

- **Separação** (`/pedidos/separacao`): foco operacional imediato — o que separar por pedido.
- **Produção** (`/custos/producao`): foco de compras e kg totais — o que comprar/preparar em escala.

### Pedido mínimo e taxa de entrega?

Configurados em **Áreas de entrega** (configurações da loja + zonas por CEP).

---

## 8. Melhorias planejadas (painel)

| Item | Situação |
|------|----------|
| Vincular produto/combo ao criar receita | Pendente na UI |
| Editar/excluir receita | Pendente na UI |
| Sincronizar itens do combo → receita | Pendente |
| Indicador “tem receita?” em Produtos/Combos | Pendente |
| Lista de separação no menu lateral | Pendente |
| NF-e → ingrediente automático | Pendente |

---

## 9. Referências técnicas

| Recurso | Caminho |
|---------|---------|
| Schema receita | `apps/api/prisma/schema.prisma` → model `Recipe` |
| BOM / validação pedido | `apps/api/src/pricing/bom.service.ts` |
| Seed receitas combos | `apps/api/prisma/seed.ts` → `seedComboRecipes()` |
| Página receitas admin | `apps/admin/src/app/custos/receitas/page.tsx` |
| API custos | `apps/api/src/pricing/pricing.controller.ts` |

---

*Última atualização: junho/2026 — Pomar Fresh / onnshoppe.com*
