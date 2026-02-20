"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { MarketInventoryRow } from "@/lib/market-types";
import { getSupabaseServerClient } from "@/lib/supabase";

const updateStockInputSchema = z.object({
  id: z.string().uuid(),
  stock: z.number().int().nonnegative(),
});

const saveProductInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(150),
  price: z.union([z.number(), z.string()]).transform((value) => {
    const parsed = typeof value === "number" ? value : Number(value);

    if (!Number.isFinite(parsed)) {
      throw new Error("Invalid numeric value");
    }

    return parsed;
  }).refine((value) => value >= 0, { message: "price must be nonnegative" }),
  stock: z.union([z.number(), z.string()]).transform((value) => {
    const parsed = typeof value === "number" ? value : Number(value);

    if (!Number.isFinite(parsed)) {
      throw new Error("Invalid numeric value");
    }

    return parsed;
  }).refine((value) => Number.isInteger(value) && value >= 0, {
    message: "stock must be nonnegative integer",
  }),
  category: z.string().trim().min(1).max(100),
  promo_rule: z
    .union([
      z.object({
        type: z.literal("bulk"),
        threshold: z.union([z.number(), z.string()]).transform((value) => {
          const parsed = typeof value === "number" ? value : Number(value);

          if (!Number.isFinite(parsed)) {
            throw new Error("Invalid numeric value");
          }

          return parsed;
        }).refine((value) => Number.isInteger(value) && value > 0, {
          message: "threshold must be positive integer",
        }),
        price: z.union([z.number(), z.string()]).transform((value) => {
          const parsed = typeof value === "number" ? value : Number(value);

          if (!Number.isFinite(parsed)) {
            throw new Error("Invalid numeric value");
          }

          return parsed;
        }).refine((value) => value >= 0, { message: "price must be nonnegative" }),
      }),
      z.object({
        type: z.literal("buy_x_get_y"),
        buy: z.union([z.number(), z.string()]).transform((value) => {
          const parsed = typeof value === "number" ? value : Number(value);

          if (!Number.isFinite(parsed)) {
            throw new Error("Invalid numeric value");
          }

          return parsed;
        }).refine((value) => Number.isInteger(value) && value > 0, {
          message: "buy must be positive integer",
        }),
        free: z.union([z.number(), z.string()]).transform((value) => {
          const parsed = typeof value === "number" ? value : Number(value);

          if (!Number.isFinite(parsed)) {
            throw new Error("Invalid numeric value");
          }

          return parsed;
        }).refine((value) => Number.isInteger(value) && value > 0, {
          message: "free must be positive integer",
        }),
      }),
    ])
    .nullable()
    .optional(),
  is_active: z.boolean().optional(),
});

const toggleProductStatusInputSchema = z.object({
  id: z.string().uuid(),
  is_active: z.boolean(),
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

function mapInventoryRow(row: unknown): MarketInventoryRow {
  const parsed = inventoryRowSchema.parse(row);

  return {
    ...parsed,
    promo_rule: parsed.promo_rule ?? null,
  };
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

export async function getInventoryAll(): Promise<MarketInventoryRow[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("market_inventory")
    .select("id, name, price, stock, category, promo_rule, is_active, created_at, updated_at")
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load all inventory: ${error.message}`);
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

export async function saveProduct(input: {
  id?: string;
  name: string;
  price: number | string;
  stock: number | string;
  category: string;
  promo_rule?: MarketInventoryRow["promo_rule"];
  is_active?: boolean;
}): Promise<MarketInventoryRow> {
  const parsed = saveProductInputSchema.parse(input);
  const supabase = getSupabaseServerClient();

  const payload = {
    name: parsed.name,
    price: parsed.price,
    stock: parsed.stock,
    category: parsed.category,
    promo_rule: parsed.promo_rule ?? null,
    is_active: parsed.is_active ?? true,
    updated_at: new Date().toISOString(),
  };

  if (parsed.id) {
    const { data, error } = await supabase
      .from("market_inventory")
      .update(payload)
      .eq("id", parsed.id)
      .select("id, name, price, stock, category, promo_rule, is_active, created_at, updated_at")
      .single();

    if (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/products");
    return mapInventoryRow(data);
  }

  const { data, error } = await supabase
    .from("market_inventory")
    .insert(payload)
    .select("id, name, price, stock, category, promo_rule, is_active, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Failed to create product: ${error.message}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/products");
  return mapInventoryRow(data);
}

export async function toggleProductStatus(id: string, is_active: boolean): Promise<MarketInventoryRow> {
  const input = toggleProductStatusInputSchema.parse({ id, is_active });
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("market_inventory")
    .update({
      is_active: input.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .select("id, name, price, stock, category, promo_rule, is_active, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Failed to update product status: ${error.message}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/products");
  return mapInventoryRow(data);
}
