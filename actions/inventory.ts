"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { MarketInventoryRow } from "@/lib/market-types";
import { getSupabaseServerClient } from "@/lib/supabase";

const updateStockInputSchema = z.object({
  id: z.string().uuid(),
  stock: z.number().int().nonnegative(),
});

const numericSchema = z.union([z.number(), z.string()]).transform((value) => {
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error("Invalid numeric value");
  }

  return parsed;
});

const bulkPromoRuleSchema = z.object({
  type: z.literal("bulk"),
  threshold: numericSchema.refine((value) => Number.isInteger(value) && value > 0, {
    message: "threshold must be positive integer",
  }),
  price: numericSchema.refine((value) => value >= 0, { message: "price must be nonnegative" }),
});

const buyXGetYPromoRuleSchema = z.object({
  type: z.literal("buy_x_get_y"),
  buy: numericSchema.refine((value) => Number.isInteger(value) && value > 0, {
    message: "buy must be positive integer",
  }),
  free: numericSchema.refine((value) => Number.isInteger(value) && value > 0, {
    message: "free must be positive integer",
  }),
});

const promoRuleSchema = z.union([bulkPromoRuleSchema, buyXGetYPromoRuleSchema]);

const inventoryRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  price: numericSchema.refine((value) => value >= 0, { message: "price must be nonnegative" }),
  stock: numericSchema.refine((value) => Number.isInteger(value) && value >= 0, {
    message: "stock must be nonnegative integer",
  }),
  category: z.string().min(1),
  promo_rule: promoRuleSchema.nullable().optional(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

function mapInventoryRows(rows: unknown[]): MarketInventoryRow[] {
  return rows.map((row) => {
    const parsed = inventoryRowSchema.parse(row);

    return {
      ...parsed,
      promo_rule: parsed.promo_rule ?? null,
    };
  });
}

export async function getInventory(): Promise<MarketInventoryRow[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("market_inventory")
    .select("id, name, price, stock, category, promo_rule, is_active, created_at, updated_at")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load inventory: ${error.message}`);
  }

  const rows = (data ?? []) as unknown[];
  return mapInventoryRows(rows);
}

export async function updateStock(id: string, stock: number): Promise<void> {
  const input = updateStockInputSchema.parse({ id, stock });
  const supabase = getSupabaseServerClient();

  const { error } = await supabase
    .from("market_inventory")
    .update({ stock: input.stock, updated_at: new Date().toISOString() })
    .eq("id", input.id);

  if (error) {
    throw new Error(`Failed to update stock: ${error.message}`);
  }

  revalidatePath("/dashboard");
}
