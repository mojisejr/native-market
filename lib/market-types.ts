export type MarketBulkPromotionRule = {
  type: "bulk";
  threshold: number;
  price: number;
};

export type MarketBuyXGetYPromotionRule = {
  type: "buy_x_get_y";
  buy: number;
  free: number;
};

export type MarketPromotionRule = MarketBulkPromotionRule | MarketBuyXGetYPromotionRule;

export type MarketInventoryRow = {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  promo_rule: MarketPromotionRule | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MarketTransactionType = "sale" | "expense" | "float" | "withdraw";

export type MarketPaymentMethod = "cash" | "transfer";

export type MarketSaleItem = {
  id: string;
  name: string;
  qty: number;
  price: number;
};

export type MarketTransactionRow = {
  id: string;
  created_at: string;
  type: MarketTransactionType;
  amount: number;
  items: MarketSaleItem[] | null;
  note: string | null;
  payment_method: MarketPaymentMethod | null;
  event_tag: string | null;
};

export type MarketSummary = {
  salesToday: number;
  expenseToday: number;
  floatToday: number;
  withdrawToday: number;
  cashInDrawer: number;
  inventoryCount: number;
};
