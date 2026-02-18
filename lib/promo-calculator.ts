import { z } from "zod";
import type { MarketPromotionRule } from "@/lib/market-types";

const positiveIntegerSchema = z.number().int().positive();
const nonNegativeNumberSchema = z.number().nonnegative();

const bulkPromotionRuleSchema = z.object({
  type: z.literal("bulk"),
  threshold: positiveIntegerSchema,
  price: nonNegativeNumberSchema,
});

const buyXGetYPromotionRuleSchema = z.object({
  type: z.literal("buy_x_get_y"),
  buy: positiveIntegerSchema,
  free: positiveIntegerSchema,
});

export const promotionRuleSchema = z.discriminatedUnion("type", [
  bulkPromotionRuleSchema,
  buyXGetYPromotionRuleSchema,
]);

const calculatorInputSchema = z.object({
  unitPrice: nonNegativeNumberSchema,
  qty: positiveIntegerSchema,
  promoRule: promotionRuleSchema.nullable(),
});

export type PromotionCalculationResult = {
  subtotal: number;
  total: number;
  discount: number;
  paidQty: number;
  freeQty: number;
  promotionApplied: boolean;
};

function roundCurrency(value: number): number {
  return Number(value.toFixed(2));
}

function calculateBulkPrice(unitPrice: number, qty: number, rule: Extract<MarketPromotionRule, { type: "bulk" }>): number {
  const bundles = Math.floor(qty / rule.threshold);
  const leftovers = qty % rule.threshold;

  return bundles * rule.price + leftovers * unitPrice;
}

function calculateBuyXGetYPrice(
  unitPrice: number,
  qty: number,
  rule: Extract<MarketPromotionRule, { type: "buy_x_get_y" }>,
): { total: number; paidQty: number; freeQty: number } {
  const setSize = rule.buy + rule.free;
  const fullSets = Math.floor(qty / setSize);
  const remainder = qty % setSize;

  const freeQty = fullSets * rule.free;
  const paidQty = fullSets * rule.buy + remainder;

  return {
    total: paidQty * unitPrice,
    paidQty,
    freeQty,
  };
}

export function parsePromotionRule(value: unknown): MarketPromotionRule | null {
  if (value === null || value === undefined) {
    return null;
  }

  return promotionRuleSchema.parse(value);
}

export function calculatePromotionForItem(input: {
  unitPrice: number;
  qty: number;
  promoRule: MarketPromotionRule | null;
}): PromotionCalculationResult {
  const parsed = calculatorInputSchema.parse(input);

  const subtotal = roundCurrency(parsed.unitPrice * parsed.qty);

  if (parsed.promoRule === null) {
    return {
      subtotal,
      total: subtotal,
      discount: 0,
      paidQty: parsed.qty,
      freeQty: 0,
      promotionApplied: false,
    };
  }

  if (parsed.promoRule.type === "bulk") {
    const total = roundCurrency(calculateBulkPrice(parsed.unitPrice, parsed.qty, parsed.promoRule));
    const discount = roundCurrency(Math.max(0, subtotal - total));

    return {
      subtotal,
      total,
      discount,
      paidQty: parsed.qty,
      freeQty: 0,
      promotionApplied: discount > 0,
    };
  }

  const buyXGetY = calculateBuyXGetYPrice(parsed.unitPrice, parsed.qty, parsed.promoRule);
  const total = roundCurrency(buyXGetY.total);
  const discount = roundCurrency(Math.max(0, subtotal - total));

  return {
    subtotal,
    total,
    discount,
    paidQty: buyXGetY.paidQty,
    freeQty: buyXGetY.freeQty,
    promotionApplied: buyXGetY.freeQty > 0,
  };
}

export function calculateSaleTotals(
  items: Array<{
    unitPrice: number;
    qty: number;
    promoRule: MarketPromotionRule | null;
  }>,
): { subtotal: number; total: number; discount: number } {
  const totals = items.reduce(
    (acc, item) => {
      const result = calculatePromotionForItem(item);

      return {
        subtotal: acc.subtotal + result.subtotal,
        total: acc.total + result.total,
        discount: acc.discount + result.discount,
      };
    },
    { subtotal: 0, total: 0, discount: 0 },
  );

  return {
    subtotal: roundCurrency(totals.subtotal),
    total: roundCurrency(totals.total),
    discount: roundCurrency(totals.discount),
  };
}
