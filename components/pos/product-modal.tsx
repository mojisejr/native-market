"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { saveProduct } from "@/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MarketInventoryRow } from "@/lib/market-types";

type PromoMode = "none" | "bulk" | "buy_x_get_y";

type ProductModalProps = {
  product?: MarketInventoryRow;
};

type FormState = {
  name: string;
  category: string;
  price: string;
  stock: string;
  promoMode: PromoMode;
  bulkThreshold: string;
  bulkPrice: string;
  buyQty: string;
  freeQty: string;
  isActive: boolean;
};

function toFormState(product?: MarketInventoryRow): FormState {
  if (!product) {
    return {
      name: "",
      category: "",
      price: "",
      stock: "0",
      promoMode: "none",
      bulkThreshold: "",
      bulkPrice: "",
      buyQty: "",
      freeQty: "",
      isActive: true,
    };
  }

  if (product.promo_rule?.type === "bulk") {
    return {
      name: product.name,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
      promoMode: "bulk",
      bulkThreshold: String(product.promo_rule.threshold),
      bulkPrice: String(product.promo_rule.price),
      buyQty: "",
      freeQty: "",
      isActive: product.is_active,
    };
  }

  if (product.promo_rule?.type === "buy_x_get_y") {
    return {
      name: product.name,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
      promoMode: "buy_x_get_y",
      bulkThreshold: "",
      bulkPrice: "",
      buyQty: String(product.promo_rule.buy),
      freeQty: String(product.promo_rule.free),
      isActive: product.is_active,
    };
  }

  return {
    name: product.name,
    category: product.category,
    price: String(product.price),
    stock: String(product.stock),
    promoMode: "none",
    bulkThreshold: "",
    bulkPrice: "",
    buyQty: "",
    freeQty: "",
    isActive: product.is_active,
  };
}

export function ProductModal({ product }: ProductModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isEditMode = Boolean(product);
  const initialState = useMemo(() => toFormState(product), [product]);

  const [name, setName] = useState(initialState.name);
  const [category, setCategory] = useState(initialState.category);
  const [price, setPrice] = useState(initialState.price);
  const [stock, setStock] = useState(initialState.stock);
  const [promoMode, setPromoMode] = useState<PromoMode>(initialState.promoMode);
  const [bulkThreshold, setBulkThreshold] = useState(initialState.bulkThreshold);
  const [bulkPrice, setBulkPrice] = useState(initialState.bulkPrice);
  const [buyQty, setBuyQty] = useState(initialState.buyQty);
  const [freeQty, setFreeQty] = useState(initialState.freeQty);
  const [isActive, setIsActive] = useState(initialState.isActive);

  function resetForm(): void {
    const next = toFormState(product);
    setName(next.name);
    setCategory(next.category);
    setPrice(next.price);
    setStock(next.stock);
    setPromoMode(next.promoMode);
    setBulkThreshold(next.bulkThreshold);
    setBulkPrice(next.bulkPrice);
    setBuyQty(next.buyQty);
    setFreeQty(next.freeQty);
    setIsActive(next.isActive);
    setErrorMessage(null);
  }

  function openModal(): void {
    resetForm();
    setIsOpen(true);
  }

  function closeModal(): void {
    setIsOpen(false);
    setErrorMessage(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const promoRule =
          promoMode === "none"
            ? null
            : promoMode === "bulk"
              ? {
                  type: "bulk" as const,
                  threshold: Number(bulkThreshold),
                  price: Number(bulkPrice),
                }
              : {
                  type: "buy_x_get_y" as const,
                  buy: Number(buyQty),
                  free: Number(freeQty),
                };

        await saveProduct({
          id: product?.id,
          name,
          category,
          price,
          stock,
          promo_rule: promoRule,
          is_active: isActive,
        });

        closeModal();
        router.refresh();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "บันทึกสินค้าไม่สำเร็จ");
      }
    });
  }

  return (
    <>
      <Button type="button" size="sm" variant={isEditMode ? "secondary" : "default"} onClick={openModal}>
        {isEditMode ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        {isEditMode ? "แก้ไข" : "เพิ่มสินค้า"}
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass-card-strong w-full max-w-2xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{isEditMode ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</h2>
              <Button type="button" variant="secondary" size="sm" onClick={closeModal}>
                <X className="h-4 w-4" />
                ปิด
              </Button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-white/70">ชื่อสินค้า</label>
                  <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="ชื่อสินค้า" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-white/70">หมวดหมู่</label>
                  <Input
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    placeholder="เช่น durian-graft"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-white/70">ราคาต่อหน่วย (บาท)</label>
                  <Input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-white/70">คงเหลือ</label>
                  <Input type="number" min="0" step="1" value={stock} onChange={(event) => setStock(event.target.value)} required />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-white/70">โปรโมชั่น</label>
                <select
                  value={promoMode}
                  onChange={(event) => setPromoMode(event.target.value as PromoMode)}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <option value="none">ไม่มีโปรโมชั่น</option>
                  <option value="bulk">Bulk (จำนวนถึงเงื่อนไข → ราคาเหมารวม)</option>
                  <option value="buy_x_get_y">Buy X Get Y</option>
                </select>
              </div>

              {promoMode === "bulk" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs text-white/70">ขั้นต่ำ (ต้น)</label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={bulkThreshold}
                      onChange={(event) => setBulkThreshold(event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-white/70">ราคาโปร (บาท)</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={bulkPrice}
                      onChange={(event) => setBulkPrice(event.target.value)}
                      required
                    />
                  </div>
                </div>
              ) : null}

              {promoMode === "buy_x_get_y" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs text-white/70">ซื้อ X</label>
                    <Input type="number" min="1" step="1" value={buyQty} onChange={(event) => setBuyQty(event.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-white/70">แถม Y</label>
                    <Input type="number" min="1" step="1" value={freeQty} onChange={(event) => setFreeQty(event.target.value)} required />
                  </div>
                </div>
              ) : null}

              <div className="flex items-center gap-2">
                <input
                  id={`active-${product?.id ?? "new"}`}
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-white/10"
                />
                <label htmlFor={`active-${product?.id ?? "new"}`} className="text-sm text-white/80">
                  เปิดขายใน POS (is_active)
                </label>
              </div>

              {errorMessage ? <p className="text-sm text-red-300">{errorMessage}</p> : null}

              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="secondary" onClick={closeModal} disabled={isPending}>
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "กำลังบันทึก..." : isEditMode ? "บันทึกการแก้ไข" : "สร้างสินค้า"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
