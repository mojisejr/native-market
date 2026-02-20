import type { MarketTransactionRow } from "@/lib/market-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type RecentTransactionsProps = {
  transactions: MarketTransactionRow[];
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2,
  }).format(value);
}

function mapTypeLabel(type: MarketTransactionRow["type"]): string {
  if (type === "sale") {
    return "ขาย";
  }

  if (type === "expense") {
    return "จ่าย";
  }

  if (type === "float") {
    return "เงินทอนเข้า";
  }

  return "เบิกออก";
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-white">รายการล่าสุด</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-sm text-white/70">ยังไม่มีรายการธุรกรรม</p>
        ) : (
          <div className="max-h-[22rem] overflow-y-auto pr-1 sm:max-h-[26rem]">
            <ul className="space-y-2">
              {transactions.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-3 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">{mapTypeLabel(item.type)}</p>
                    <p className="truncate text-xs text-white/70">{item.note ?? "-"}</p>
                  </div>
                  <div className="shrink-0 text-left sm:text-right">
                    <p className="text-sm font-semibold text-white">{formatCurrency(item.amount)}</p>
                    <p className="text-xs text-white/60 sm:whitespace-nowrap">{new Date(item.created_at).toLocaleString("th-TH")}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
