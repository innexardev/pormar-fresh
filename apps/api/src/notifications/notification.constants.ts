export type AdminNotifyEvent =
  | 'new_order'
  | 'new_customer'
  | 'new_subscription'
  | 'payment_received'
  | 'payment_failed'
  | 'support_open'
  | 'order_cancelled';

export const DEFAULT_ADMIN_NOTIFY_EVENTS: Record<AdminNotifyEvent, boolean> = {
  new_order: true,
  new_customer: true,
  new_subscription: true,
  payment_received: true,
  payment_failed: true,
  support_open: true,
  order_cancelled: true,
};

export const ADMIN_NOTIFY_TEMPLATE_KEYS: Record<AdminNotifyEvent, string> = {
  new_order: 'admin_new_order',
  new_customer: 'admin_new_customer',
  new_subscription: 'admin_new_subscription',
  payment_received: 'admin_payment_received',
  payment_failed: 'admin_payment_failed',
  support_open: 'admin_support_open',
  order_cancelled: 'admin_order_cancelled',
};

export const DEFAULT_BOT_MENU_OPTIONS = [
  { trigger: 'menu', label: 'Menu principal', action: 'show_menu', sortOrder: 0 },
  { trigger: '0', label: 'Menu principal', action: 'show_menu', sortOrder: 0 },
  { trigger: 'ajuda', label: 'Ajuda', action: 'show_menu', sortOrder: 1 },
  { trigger: 'help', label: 'Help', action: 'show_menu', sortOrder: 1 },
  { trigger: '1', label: 'Ver cardápio', action: 'open_cardapio', sortOrder: 10 },
  { trigger: 'cardapio', label: 'Cardápio', action: 'open_cardapio', sortOrder: 10 },
  { trigger: 'cardápio', label: 'Cardápio', action: 'open_cardapio', sortOrder: 10 },
  { trigger: '2', label: 'Status do pedido', action: 'show_status', sortOrder: 20 },
  { trigger: 'status', label: 'Status', action: 'show_status', sortOrder: 20 },
  { trigger: 'pedido', label: 'Pedido', action: 'show_status', sortOrder: 20 },
  { trigger: '3', label: 'Minha conta', action: 'open_conta', sortOrder: 30 },
  { trigger: 'conta', label: 'Conta', action: 'open_conta', sortOrder: 30 },
  { trigger: 'login', label: 'Login', action: 'open_conta', sortOrder: 30 },
  { trigger: 'pedidos', label: 'Pedidos', action: 'open_conta', sortOrder: 30 },
  { trigger: '4', label: 'Falar com suporte', action: 'open_support', sortOrder: 40 },
  { trigger: 'suporte', label: 'Suporte', action: 'open_support', sortOrder: 40 },
  { trigger: 'atendimento', label: 'Atendimento', action: 'open_support', sortOrder: 40 },
  { trigger: '5', label: 'Promoções', action: 'open_promo', sortOrder: 50 },
  { trigger: 'promo', label: 'Promoções', action: 'open_promo', sortOrder: 50 },
  { trigger: 'cupom', label: 'Cupom', action: 'open_promo', sortOrder: 50 },
];
