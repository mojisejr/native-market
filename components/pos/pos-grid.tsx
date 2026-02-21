"use client";

import { useActionState, useMemo, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { recordSaleAction, type LedgerActionState } from "@/actions/transaction";
import type { MarketInventoryRow } from "@/lib/market-types";
import { calculatePromotionForItem, calculateSaleTotals } from "@/lib/promo-calculator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type PosGridProps = {
  inventory: MarketInventoryRow[];
};

const initialState: LedgerActionState = {};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPromotionLabel(item: MarketInventoryRow): string | null {
  if (item.promo_rule === null) {
    return null;
  }

  if (item.promo_rule.type === "bulk") {
    return `${item.promo_rule.threshold} ต้น ${formatCurrency(item.promo_rule.price)}`;
  }

  return `ซื้อ ${item.promo_rule.buy} แถม ${item.promo_rule.free}`;
}

export function PosGrid({ inventory }: PosGridProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">("cash");
  const [receivedAmountInput, setReceivedAmountInput] = useState<string>("");
  const [state, formAction, pending] = useActionState(recordSaleAction, initialState);

  const selectedItems = useMemo(
    () =>
      inventory
        .map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qty: quantities[item.id] ?? 0,
          promoRule: item.promo_rule,
        }))
        .filter((item) => item.qty > 0),
    [inventory, quantities],
  );

  const totals = useMemo(
    () =>
      calculateSaleTotals(
        selectedItems.map((item) => ({
          unitPrice: item.price,
          qty: item.qty,
          promoRule: item.promoRule,
        })),
      ),
    [selectedItems],
  );

  const itemsPayload = useMemo(
    () =>
      selectedItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        qty: item.qty,
      })),
    [selectedItems],
  );

  const receivedAmount = useMemo(() => {
    const parsed = Number(receivedAmountInput);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return 0;
    }

    return parsed;
  }, [receivedAmountInput]);

  const changeAmount = useMemo(() => {
    if (paymentMethod !== "cash") {
      return 0;
    }

    return receivedAmount - totals.total;
  }, [paymentMethod, receivedAmount, totals.total]);

  const hasReceivedAmount = receivedAmountInput.trim().length > 0;
  const isCashPaymentIncomplete = paymentMethod === "cash" && (!hasReceivedAmount || changeAmount < 0);

  function increaseQty(id: string, maxStock: number): void {
    setQuantities((previous) => {
      const current = previous[id] ?? 0;
      if (current >= maxStock) {
        return previous;
      }

      return {
        ...previous,
        [id]: current + 1,
      };
    });
  }

  function decreaseQty(id: string): void {
    setQuantities((previous) => {
      const current = previous[id] ?? 0;

      if (current <= 1) {
        const next = { ...previous };
        delete next[id];
        return next;
      }

      return {
        ...previous,
        [id]: current - 1,
      };
    });
  }

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[2fr_1fr]">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <ShoppingCart className="h-5 w-5" />
            POS Grid (ขายสินค้า)
          </CardTitle>
        </CardHeader>
        <CardContent className="min-w-0 space-y-3">
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            {inventory.map((item) => {
              const qty = quantities[item.id] ?? 0;
              const promotionLabel = formatPromotionLabel(item);
              const lineCalculation =
                qty > 0
                  ? calculatePromotionForItem({
                      unitPrice: item.price,
                      qty,
                      promoRule: item.promo_rule,
                    })
                  : null;

              return (
                <div key={item.id} className="glass-card min-w-0 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="break-words text-sm font-medium text-white">{item.name}</p>
                    {promotionLabel ? (
                      <span className="rounded-full border border-amber-300/40 bg-amber-300/10 px-2 py-0.5 text-[10px] font-medium text-amber-200">
                        โปรโมชั่น
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-white/70">
                    คงเหลือ {item.stock} | {formatCurrency(item.price)}
                  </p>
                  {promotionLabel ? <p className="mt-1 text-xs text-amber-200/90">{promotionLabel}</p> : null}
                  {lineCalculation && lineCalculation.discount > 0 ? (
                    <p className="mt-1 text-xs text-emerald-300">
                      ใช้โปรแล้ว ลด {formatCurrency(lineCalculation.discount)} เหลือ {formatCurrency(lineCalculation.total)}
                    </p>
                  ) : null}
                  <div className="mt-3 flex items-center gap-2">
                    <Button type="button" variant="secondary" className="h-8 px-3" onClick={() => decreaseQty(item.id)}>
                      -
                    </Button>
                    <span className="min-w-8 text-center text-sm text-white">{qty}</span>
                    <Button
                      type="button"
                      className="h-8 px-3"
                      onClick={() => increaseQty(item.id, item.stock)}
                      disabled={item.stock <= qty}
                    >
                      +
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card-strong min-w-0">
        <CardHeader>
          <CardTitle className="text-white">ตะกร้าขาย</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          <form action={formAction} className="min-w-0 space-y-3">
            <input type="hidden" name="itemsJson" value={JSON.stringify(itemsPayload)} />

            <label className="block text-xs text-white/70" htmlFor="paymentMethod">
              วิธีชำระเงิน
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={paymentMethod}
              onChange={(event) => {
                const nextMethod = event.target.value === "transfer" ? "transfer" : "cash";
                setPaymentMethod(nextMethod);
              }}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-primary"
            >
              <option value="cash">เงินสด</option>
              <option value="transfer">โอน</option>
            </select>

            {paymentMethod === "cash" ? (
              <div className="min-w-0 rounded-xl border border-white/10 bg-black/20 p-3">
                <label className="mb-2 block text-xs text-white/70" htmlFor="receivedAmount">
                  ลูกค้าจ่ายมา
                </label>
                <Input
                  id="receivedAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={receivedAmountInput}
                  onChange={(event) => setReceivedAmountInput(event.target.value)}
                  placeholder="0.00"
                />
                {hasReceivedAmount ? (
                  changeAmount >= 0 ? (
                    <p className="mt-2 text-sm font-medium text-emerald-300">เงินทอน {formatCurrency(changeAmount)}</p>
                  ) : (
                    <p className="mt-2 text-sm font-medium text-amber-300">ยังขาดอีก {formatCurrency(Math.abs(changeAmount))}</p>
                  )
                ) : (
                  <p className="mt-2 text-xs text-white/60">กรอกยอดรับเงินเพื่อคำนวณเงินทอน</p>
                )}
              </div>
            ) : null}

            <Input name="note" placeholder="หมายเหตุ (ถ้ามี)" />
            <Input name="eventTag" placeholder="event tag (optional)" />

            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs text-white/70">รวมทั้งหมด</p>
              {totals.discount > 0 ? (
                <p className="text-xs text-white/50 line-through">{formatCurrency(totals.subtotal)}</p>
              ) : null}
              <p className="text-xl font-semibold text-white">{formatCurrency(totals.total)}</p>
              {totals.discount > 0 ? (
                <p className="mt-1 text-xs text-emerald-300">ประหยัดรวม {formatCurrency(totals.discount)}</p>
              ) : null}
              <p className="mt-1 text-xs text-white/60">{selectedItems.length} รายการสินค้า</p>
            </div>

            {state.error ? <p className="text-xs text-red-300">{state.error}</p> : null}
            {state.success ? <p className="text-xs text-emerald-300">{state.success}</p> : null}

            <Button type="submit" className="w-full" disabled={pending || selectedItems.length === 0 || isCashPaymentIncomplete}>
              {pending ? "กำลังบันทึก..." : "ยืนยันการขาย"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
