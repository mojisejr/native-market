import { Banknote, HandCoins, LogOut, Package, Receipt, Wallet } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/actions/auth";
import { getInventory } from "@/actions/inventory";
import { getRecentTransactions, getSummary } from "@/actions/transaction";
import { ExpenseForm } from "@/components/pos/expense-form";
import { PosGrid } from "@/components/pos/pos-grid";
import { RecentTransactions } from "@/components/pos/recent-transactions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MarketInventoryRow, MarketTransactionRow } from "@/lib/market-types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2,
  }).format(value);
}

export default async function DashboardPage() {
  let inventoryError: string | null = null;
  let inventory: MarketInventoryRow[] = [];
  let recentTransactions: MarketTransactionRow[] = [];

  const summary = {
    salesToday: 0,
    cashInDrawer: 0,
    inventoryCount: 0,
    expenseToday: 0,
  };

  try {
    const [inventoryData, summaryData, recentData] = await Promise.all([
      getInventory(),
      getSummary(),
      getRecentTransactions(30),
    ]);

    inventory = inventoryData;
    recentTransactions = recentData;
    summary.salesToday = summaryData.salesToday;
    summary.cashInDrawer = summaryData.cashInDrawer;
    summary.inventoryCount = summaryData.inventoryCount;
    summary.expenseToday = summaryData.expenseToday;
  } catch (error) {
    inventoryError =
      error instanceof Error
        ? `ยังดึงข้อมูลไม่ได้ (${error.message}) กรุณารัน SQL จากไฟล์ sql/init.sql ก่อน`
        : "ยังดึงข้อมูลไม่ได้ กรุณารัน SQL จากไฟล์ sql/init.sql ก่อน";
  }

  const stats = [
    { label: "ยอดขายวันนี้", value: formatCurrency(summary.salesToday), icon: Banknote },
    { label: "เงินสดในลิ้นชัก", value: formatCurrency(summary.cashInDrawer), icon: HandCoins },
    { label: "ค่าใช้จ่ายวันนี้", value: formatCurrency(summary.expenseToday), icon: Receipt },
    { label: "รายการสินค้า", value: `${summary.inventoryCount}`, icon: Package },
  ];

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl overflow-x-clip px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3 sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white">Native Market Dashboard</h1>
          <p className="text-sm text-white/70">Phase 3: POS Grid + Expense + Dashboard Overview</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button asChild type="button" variant="secondary">
            <Link href="/dashboard/products" aria-label="จัดการสินค้า">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">จัดการสินค้า</span>
            </Link>
          </Button>
          <form action={logoutAction}>
            <Button type="submit" variant="secondary" aria-label="ออกจากระบบ">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </Button>
          </form>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="min-w-0">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-white/70">
                <Icon className="h-4 w-4" />
                <span className="text-sm">{label}</span>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl text-white">{value}</CardTitle>
            </CardContent>
          </Card>
        ))}
      </section>

      {inventoryError ? (
        <Card className="mt-4 border border-amber-400/30 bg-amber-400/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-100">
              <Wallet className="h-5 w-5" />
              Database ยังไม่พร้อม
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-100/90">{inventoryError}</p>
          </CardContent>
        </Card>
      ) : null}

      <section className="mt-6">
        <PosGrid inventory={inventory} />
      </section>

      <section className="mt-6 grid min-w-0 gap-4 lg:grid-cols-2">
        <ExpenseForm />
        <RecentTransactions transactions={recentTransactions} />
      </section>
    </main>
  );
}
