import { Banknote, HandCoins, LogOut, Package } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { label: "ยอดขายวันนี้", value: "฿0.00", icon: Banknote },
  { label: "เงินสดในลิ้นชัก", value: "฿0.00", icon: HandCoins },
  { label: "รายการสินค้า", value: "0", icon: Package },
];

export default function DashboardPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Native Market Dashboard</h1>
          <p className="text-sm text-white/70">Phase 1 shell พร้อมต่อยอด POS และ Ledger ใน Phase 2-3</p>
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="secondary">
            <LogOut className="h-4 w-4" />
            ออกจากระบบ
          </Button>
        </form>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
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
    </main>
  );
}
