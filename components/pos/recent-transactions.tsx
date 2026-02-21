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
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="px-4 pb-2 pt-4 sm:px-6 sm:pb-3 sm:pt-6">
        <CardTitle className="text-base text-white sm:text-xl">รายการล่าสุด</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 px-4 pb-4 pt-2 sm:px-6 sm:pb-6 sm:pt-3">
        {transactions.length === 0 ? (
          <p className="text-sm text-white/70">ยังไม่มีรายการธุรกรรม</p>
        ) : (
          <div className="max-h-[18rem] overflow-y-auto pr-0.5 sm:max-h-[26rem] sm:pr-1">
            <ul className="space-y-1.5 sm:space-y-2">
              {transactions.map((item) => (
                <li
                  key={item.id}
                  className="flex min-w-0 flex-col gap-1.5 rounded-xl border border-white/10 bg-white/5 p-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-2 sm:p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">{mapTypeLabel(item.type)}</p>
                    <p className="truncate text-xs text-white/70">{item.note ?? "-"}</p>
                  </div>
                  <div className="shrink-0 text-left sm:text-right">
                    <p className="text-sm font-semibold text-white">{formatCurrency(item.amount)}</p>
                    <p className="text-[11px] text-white/60 sm:whitespace-nowrap sm:text-xs">{new Date(item.created_at).toLocaleString("th-TH")}</p>
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
