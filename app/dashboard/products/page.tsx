import { ArrowLeft, ArchiveRestore, ArchiveX, Package } from "lucide-react";
import Link from "next/link";
import { getInventoryAll, toggleProductStatus } from "@/actions/inventory";
import { ProductModal } from "@/components/pos/product-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MarketInventoryRow } from "@/lib/market-types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPromotionLabel(item: MarketInventoryRow): string {
  if (item.promo_rule === null) {
    return "-";
  }

  if (item.promo_rule.type === "bulk") {
    return `${item.promo_rule.threshold} ต้น ${formatCurrency(item.promo_rule.price)}`;
  }

  return `ซื้อ ${item.promo_rule.buy} แถม ${item.promo_rule.free}`;
}

export default async function ProductsPage() {
  const products = await getInventoryAll();

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">จัดการสินค้า (Back-office)</h1>
          <p className="text-sm text-white/70">Phase 3: Product List + All-in-One Editor Modal</p>
        </div>
        <div className="flex items-center gap-2">
          <ProductModal />
          <Button asChild variant="secondary">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              กลับหน้า Dashboard
            </Link>
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Package className="h-5 w-5" />
            รายการสินค้าทั้งหมด ({products.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-sm text-white/70">ยังไม่มีสินค้าในระบบ</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-white">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/60">
                    <th className="px-3 py-2">สินค้า</th>
                    <th className="px-3 py-2">หมวดหมู่</th>
                    <th className="px-3 py-2">ราคา</th>
                    <th className="px-3 py-2">คงเหลือ</th>
                    <th className="px-3 py-2">โปรโมชั่น</th>
                    <th className="px-3 py-2">สถานะ</th>
                    <th className="px-3 py-2 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((item) => (
                    <tr key={item.id} className="border-b border-white/5">
                      <td className="px-3 py-3 font-medium">{item.name}</td>
                      <td className="px-3 py-3 text-white/80">{item.category}</td>
                      <td className="px-3 py-3">{formatCurrency(item.price)}</td>
                      <td className="px-3 py-3">{item.stock}</td>
                      <td className="px-3 py-3 text-white/80">{formatPromotionLabel(item)}</td>
                      <td className="px-3 py-3">
                        {item.is_active ? (
                          <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-1 text-xs text-emerald-200">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-xs text-amber-200">
                            Archived
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <ProductModal product={item} />
                          <form
                            action={async () => {
                              "use server";
                              await toggleProductStatus(item.id, !item.is_active);
                            }}
                          >
                            <Button type="submit" size="sm" variant={item.is_active ? "destructive" : "secondary"}>
                              {item.is_active ? (
                                <>
                                  <ArchiveX className="h-4 w-4" />
                                  Archive
                                </>
                              ) : (
                                <>
                                  <ArchiveRestore className="h-4 w-4" />
                                  Restore
                                </>
                              )}
                            </Button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
