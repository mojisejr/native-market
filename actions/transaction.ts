"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getInventory, updateStock } from "@/actions/inventory";
import type {
  MarketPaymentMethod,
  MarketSaleItem,
  MarketSummary,
  MarketTransactionRow,
  MarketTransactionType,
} from "@/lib/market-types";
import { getSupabaseServerClient } from "@/lib/supabase";

const paymentMethodSchema = z.enum(["cash", "transfer"]);

const numericSchema = z.union([z.number(), z.string()]).transform((value) => {
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error("Invalid numeric value");
  }

  return parsed;
});

const saleItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  qty: numericSchema.refine((value) => Number.isInteger(value) && value > 0, {
    message: "qty must be positive integer",
  }),
  price: numericSchema.refine((value) => value >= 0, { message: "price must be nonnegative" }),
});

const recordSaleInputSchema = z.object({
  items: z.array(saleItemSchema).min(1),
  paymentMethod: paymentMethodSchema,
  note: z.string().max(500).optional(),
  eventTag: z.string().max(100).optional(),
});

const recordExpenseInputSchema = z.object({
  amount: numericSchema.refine((value) => value > 0, { message: "amount must be positive" }),
  note: z.string().min(1).max(500),
  paymentMethod: paymentMethodSchema,
  eventTag: z.string().max(100).optional(),
});

const transactionRowSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string(),
  type: z.enum(["sale", "expense", "float", "withdraw"]),
  amount: numericSchema.refine((value) => value >= 0, { message: "amount must be nonnegative" }),
  items: z.array(saleItemSchema).nullable(),
  note: z.string().nullable(),
  payment_method: z.enum(["cash", "transfer"]).nullable(),
  event_tag: z.string().nullable(),
});

function mapTransactionType(type: MarketTransactionType): MarketTransactionType {
  return type;
}

function mapPaymentMethod(method: MarketPaymentMethod | null): MarketPaymentMethod | null {
  return method;
}

function parseTransactionRows(rows: unknown[]): MarketTransactionRow[] {
  return rows.map((row) => {
    const parsed = transactionRowSchema.parse(row);

    return {
      id: parsed.id,
      created_at: parsed.created_at,
      type: mapTransactionType(parsed.type),
      amount: parsed.amount,
      items: parsed.items,
      note: parsed.note,
      payment_method: mapPaymentMethod(parsed.payment_method),
      event_tag: parsed.event_tag,
    };
  });
}

function calculateSaleAmount(items: MarketSaleItem[]): number {
  return items.reduce((sum, item) => sum + item.qty * item.price, 0);
}

export type LedgerActionState = {
  success?: string;
  error?: string;
};

const saleFormSchema = z.object({
  itemsJson: z.string().min(2),
  paymentMethod: paymentMethodSchema,
  note: z.string().max(500).optional(),
  eventTag: z.string().max(100).optional(),
});

const expenseFormSchema = z.object({
  amount: z.string().min(1),
  note: z.string().min(1).max(500),
  paymentMethod: paymentMethodSchema,
  eventTag: z.string().max(100).optional(),
});

function readOptionalString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseSaleItemsJson(itemsJson: string): MarketSaleItem[] {
  const parsed = JSON.parse(itemsJson) as unknown;
  const result = z.array(saleItemSchema).safeParse(parsed);

  if (!result.success) {
    throw new Error("รายการสินค้าไม่ถูกต้อง");
  }

  return result.data;
}

export async function recordSale(input: {
  items: MarketSaleItem[];
  paymentMethod: MarketPaymentMethod;
  note?: string;
  eventTag?: string;
}): Promise<void> {
  const parsed = recordSaleInputSchema.parse(input);
  const inventory = await getInventory();

  for (const item of parsed.items) {
    const inventoryItem = inventory.find((candidate) => candidate.id === item.id);

    if (!inventoryItem) {
      throw new Error(`Item not found in inventory: ${item.name}`);
    }

    if (inventoryItem.stock < item.qty) {
      throw new Error(`สต็อกไม่พอสำหรับ ${item.name}`);
    }
  }

  for (const item of parsed.items) {
    const inventoryItem = inventory.find((candidate) => candidate.id === item.id);

    if (!inventoryItem) {
      throw new Error(`Item not found in inventory: ${item.name}`);
    }

    await updateStock(item.id, inventoryItem.stock - item.qty);
  }

  const supabase = getSupabaseServerClient();
  const amount = calculateSaleAmount(parsed.items);

  const { error } = await supabase.from("market_transactions").insert({
    type: "sale",
    amount,
    items: parsed.items,
    note: parsed.note ?? null,
    payment_method: parsed.paymentMethod,
    event_tag: parsed.eventTag ?? null,
  });

  if (error) {
    throw new Error(`Failed to record sale: ${error.message}`);
  }

  revalidatePath("/dashboard");
}

export async function recordExpense(input: {
  amount: number;
  note: string;
  paymentMethod: MarketPaymentMethod;
  eventTag?: string;
}): Promise<void> {
  const parsed = recordExpenseInputSchema.parse(input);
  const supabase = getSupabaseServerClient();

  const { error } = await supabase.from("market_transactions").insert({
    type: "expense",
    amount: parsed.amount,
    note: parsed.note,
    payment_method: parsed.paymentMethod,
    event_tag: parsed.eventTag ?? null,
  });

  if (error) {
    throw new Error(`Failed to record expense: ${error.message}`);
  }

  revalidatePath("/dashboard");
}

export async function getSummary(): Promise<MarketSummary> {
  const supabase = getSupabaseServerClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [{ data: transactionsData, error: transactionsError }, { count, error: inventoryError }] =
    await Promise.all([
      supabase
        .from("market_transactions")
        .select("id, created_at, type, amount, items, note, payment_method, event_tag")
        .gte("created_at", startOfDay.toISOString()),
      supabase.from("market_inventory").select("id", { count: "exact", head: true }).eq("is_active", true),
    ]);

  if (transactionsError) {
    throw new Error(`Failed to get summary: ${transactionsError.message}`);
  }

  if (inventoryError) {
    throw new Error(`Failed to count inventory: ${inventoryError.message}`);
  }

  const transactions = parseTransactionRows((transactionsData ?? []) as unknown[]);

  let salesToday = 0;
  let expenseToday = 0;
  let floatToday = 0;
  let withdrawToday = 0;

  for (const transaction of transactions) {
    if (transaction.type === "sale") {
      salesToday += transaction.amount;
      continue;
    }

    if (transaction.type === "expense") {
      expenseToday += transaction.amount;
      continue;
    }

    if (transaction.type === "float") {
      floatToday += transaction.amount;
      continue;
    }

    if (transaction.type === "withdraw") {
      withdrawToday += transaction.amount;
    }
  }

  const cashInDrawer = floatToday + salesToday - expenseToday - withdrawToday;

  return {
    salesToday,
    expenseToday,
    floatToday,
    withdrawToday,
    cashInDrawer,
    inventoryCount: count ?? 0,
  };
}

export async function getRecentTransactions(limit = 12): Promise<MarketTransactionRow[]> {
  const safeLimit = Math.max(1, Math.min(50, limit));
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("market_transactions")
    .select("id, created_at, type, amount, items, note, payment_method, event_tag")
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    throw new Error(`Failed to load recent transactions: ${error.message}`);
  }

  return parseTransactionRows((data ?? []) as unknown[]);
}

export async function recordSaleAction(
  _prevState: LedgerActionState,
  formData: FormData,
): Promise<LedgerActionState> {
  const rawInput = {
    itemsJson: typeof formData.get("itemsJson") === "string" ? String(formData.get("itemsJson")) : "",
    paymentMethod: typeof formData.get("paymentMethod") === "string" ? String(formData.get("paymentMethod")) : "",
    note: readOptionalString(formData, "note"),
    eventTag: readOptionalString(formData, "eventTag"),
  };

  const parsedInput = saleFormSchema.safeParse(rawInput);

  if (!parsedInput.success) {
    return { error: "ข้อมูลการขายไม่ครบหรือไม่ถูกต้อง" };
  }

  try {
    const items = parseSaleItemsJson(parsedInput.data.itemsJson);

    await recordSale({
      items,
      paymentMethod: parsedInput.data.paymentMethod,
      note: parsedInput.data.note,
      eventTag: parsedInput.data.eventTag,
    });

    return { success: "บันทึกการขายเรียบร้อย" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "ไม่สามารถบันทึกการขายได้";
    return { error: message };
  }
}

export async function recordExpenseAction(
  _prevState: LedgerActionState,
  formData: FormData,
): Promise<LedgerActionState> {
  const rawInput = {
    amount: typeof formData.get("amount") === "string" ? String(formData.get("amount")) : "",
    note: typeof formData.get("note") === "string" ? String(formData.get("note")) : "",
    paymentMethod: typeof formData.get("paymentMethod") === "string" ? String(formData.get("paymentMethod")) : "",
    eventTag: readOptionalString(formData, "eventTag"),
  };

  const parsedInput = expenseFormSchema.safeParse(rawInput);

  if (!parsedInput.success) {
    return { error: "ข้อมูลค่าใช้จ่ายไม่ครบหรือไม่ถูกต้อง" };
  }

  const parsedAmount = Number(parsedInput.data.amount);

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return { error: "จำนวนเงินไม่ถูกต้อง" };
  }

  try {
    await recordExpense({
      amount: parsedAmount,
      note: parsedInput.data.note,
      paymentMethod: parsedInput.data.paymentMethod,
      eventTag: parsedInput.data.eventTag,
    });

    return { success: "บันทึกค่าใช้จ่ายเรียบร้อย" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "ไม่สามารถบันทึกค่าใช้จ่ายได้";
    return { error: message };
  }
}
