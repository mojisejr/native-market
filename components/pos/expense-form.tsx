"use client";

import { useActionState } from "react";
import { ReceiptText } from "lucide-react";
import { recordExpenseAction, type LedgerActionState } from "@/actions/transaction";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const initialState: LedgerActionState = {};

export function ExpenseForm() {
  const [state, formAction, pending] = useActionState(recordExpenseAction, initialState);

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="px-4 pb-2 pt-4 sm:px-6 sm:pb-3 sm:pt-6">
        <CardTitle className="flex items-center gap-2 text-base text-white sm:text-xl">
          <ReceiptText className="h-5 w-5" />
          บันทึกค่าใช้จ่าย
        </CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 px-4 pb-4 pt-2 sm:px-6 sm:pb-6 sm:pt-3">
        <form action={formAction} className="grid min-w-0 gap-2.5 sm:grid-cols-2 sm:gap-3">
          <Input name="amount" type="number" min={0.01} step="0.01" placeholder="จำนวนเงิน" required />
          <select
            name="paymentMethod"
            defaultValue="cash"
            className="h-10 w-full min-w-0 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <option value="cash">เงินสด</option>
            <option value="transfer">โอน</option>
          </select>

          <Input name="note" placeholder="รายละเอียดค่าใช้จ่าย" required className="sm:col-span-2" />
          <Input name="eventTag" placeholder="event tag (optional)" className="sm:col-span-2" />

          {state.error ? <p className="text-xs text-red-300 sm:col-span-2 sm:text-sm">{state.error}</p> : null}
          {state.success ? <p className="text-xs text-emerald-300 sm:col-span-2 sm:text-sm">{state.success}</p> : null}

          <Button type="submit" disabled={pending} className="w-full sm:col-span-2 sm:w-fit">
            {pending ? "กำลังบันทึก..." : "บันทึกค่าใช้จ่าย"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
