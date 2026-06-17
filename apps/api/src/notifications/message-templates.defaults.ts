export const DEFAULT_MESSAGE_TEMPLATES = [
  {
    key: 'order_created',
    label: 'Pedido criado',
    category: 'transactional',
    body: 'Olá {nome}! 🍎 Recebemos seu pedido Pomar Fresh #{pedido}.\n\nTotal: R$ {total}\nEntrega: {entrega} ({data})\n\nAcompanhe: {link}',
  },
  {
    key: 'payment_pending',
    label: 'Pix pendente',
    category: 'transactional',
    body: 'Olá {nome}! 💳 Seu Pix Pomar Fresh está pronto.\n\nValor: R$ {total}\n\nCopia e cola:\n{pix}\n\nAcompanhe: {link}',
  },
  {
    key: 'payment_confirmed',
    label: 'Pagamento confirmado',
    category: 'transactional',
    body: 'Olá {nome}! ✅ Pagamento confirmado!\n\nPedido #{pedido} — R$ {total}\nEntrega: {entrega} ({data})\n\nAcompanhe: {link}',
  },
  {
    key: 'order_confirmed',
    label: 'Pedido confirmado',
    category: 'transactional',
    body: 'Olá {nome}! ✅ Pedido confirmado no Pomar Fresh.\n\nEntrega: {entrega} ({data})\nTotal: R$ {total}\n\nAcompanhe: {link}',
  },
  {
    key: 'order_preparing',
    label: 'Em separação',
    category: 'transactional',
    body: 'Olá {nome}! 🔪 Seu pedido está sendo cortado no dia.\n\nEntrega: {entrega}\n\nAcompanhe: {link}',
  },
  {
    key: 'order_ready',
    label: 'Pedido pronto',
    category: 'transactional',
    body: 'Olá {nome}! 📦 Seu pedido Pomar Fresh está pronto.\n\nEntrega: {entrega}\n\nAcompanhe: {link}',
  },
  {
    key: 'order_out_for_delivery',
    label: 'Saiu para entrega',
    category: 'transactional',
    body: 'Olá {nome}! 🚚 Seu pedido saiu para entrega.\n\nEntrega: {entrega}\n\nAcompanhe: {link}',
  },
  {
    key: 'order_delivered',
    label: 'Pedido entregue',
    category: 'transactional',
    body: 'Olá {nome}! 🎉 Pedido entregue. Bom apetite!\n\nObrigado por comprar no Pomar Fresh.\n\nPeça de novo: {link}',
  },
  {
    key: 'order_cancelled',
    label: 'Pedido cancelado',
    category: 'transactional',
    body: 'Olá {nome}. Seu pedido #{pedido} foi cancelado.\n\nDúvidas? Responda *suporte* aqui no WhatsApp.',
  },
  {
    key: 'subscription_created',
    label: 'Assinatura criada',
    category: 'transactional',
    body: 'Olá {nome}! 🌿 Assinatura Pomar Fresh ativada.\n\nEntrega: {entrega}\n\nCardápio: {link}',
  },
  {
    key: 'otp_login',
    label: 'Código de acesso',
    category: 'transactional',
    body: 'Seu código Pomar Fresh: *{codigo}*\n\nVálido por 5 minutos. Não compartilhe.',
  },
  {
    key: 'tracking_link',
    label: 'Reenvio de link',
    category: 'transactional',
    body: 'Olá {nome}! Acompanhe seu pedido Pomar Fresh:\n{link}',
  },
  {
    key: 'reminder_inactive',
    label: 'Lembrete — cliente inativo',
    category: 'reminder',
    body: 'Oi {nome}! 🍊 Sentimos sua falta no Pomar Fresh.\n\nFaz {dias} dias desde seu último pedido. Frutas e legumes frescos, cortados no dia!\n\nPeça agora: {link}\n\nResponda *menu* para opções.',
  },
  {
    key: 'bot_support_open',
    label: 'Bot — chamado aberto',
    category: 'bot',
    body: 'Olá {nome}! ✅ Recebemos sua mensagem.\n\nChamado #{ticket} — nossa equipe responde em breve.\n\nEnquanto isso: {link}',
  },
  {
    key: 'bot_cardapio',
    label: 'Bot — cardápio',
    category: 'bot',
    body: '🛒 Veja nosso cardápio com combos e avulsos:\n{link}',
  },
  {
    key: 'bot_conta',
    label: 'Bot — minha conta',
    category: 'bot',
    body: '👤 Acesse seus pedidos e histórico:\n{link}',
  },
  {
    key: 'bot_promo',
    label: 'Bot — promoções',
    category: 'bot',
    body: '🎁 Use o cupom *{cupom}* no checkout!\n\nCardápio: {link}',
  },
  {
    key: 'bot_no_order',
    label: 'Bot — sem pedido ativo',
    category: 'bot',
    body: 'Não encontramos pedido ativo. Que tal fazer um novo?\n\n{link}',
  },
  {
    key: 'bot_no_customer',
    label: 'Bot — cadastro necessário',
    category: 'bot',
    body: 'Para ver seu pedido, acesse sua conta primeiro:\n{link}',
  },
  {
    key: 'admin_new_order',
    label: 'Admin — novo pedido',
    category: 'admin',
    body: '🆕 *Novo pedido* #{pedido}\nCliente: {nome} ({telefone})\nTotal: R$ {total}\nEntrega: {entrega} ({data})',
  },
  {
    key: 'admin_new_customer',
    label: 'Admin — novo cadastro',
    category: 'admin',
    body: '👤 *Novo cliente*\n{nome} — {telefone}',
  },
  {
    key: 'admin_new_subscription',
    label: 'Admin — nova assinatura',
    category: 'admin',
    body: '🌿 *Nova assinatura*\n{nome} ({telefone})\nEntrega: {entrega}',
  },
  {
    key: 'admin_payment_received',
    label: 'Admin — pagamento recebido',
    category: 'admin',
    body: '✅ *Pagamento confirmado*\nPedido #{pedido} — R$ {total}\n{nome} ({telefone})',
  },
  {
    key: 'admin_payment_failed',
    label: 'Admin — erro pagamento',
    category: 'admin',
    body: '⚠️ *Problema no pagamento*\nPedido #{pedido}\n{nome} ({telefone})\nMotivo: {motivo}',
  },
  {
    key: 'admin_support_open',
    label: 'Admin — suporte aberto',
    category: 'admin',
    body: '📩 *Suporte aberto* #{ticket_id}\n{nome} ({telefone})\nAssunto: {assunto}',
  },
  {
    key: 'admin_order_cancelled',
    label: 'Admin — pedido cancelado',
    category: 'admin',
    body: '❌ *Pedido cancelado* #{pedido}\n{nome} ({telefone}) — R$ {total}',
  },
];

export function renderTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? '');
}
