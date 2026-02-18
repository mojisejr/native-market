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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <ReceiptText className="h-5 w-5" />
          บันทึกค่าใช้จ่าย
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-3 sm:grid-cols-2">
          <Input name="amount" type="number" min={0.01} step="0.01" placeholder="จำนวนเงิน" required />
          <select
            name="paymentMethod"
            defaultValue="cash"
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-primary"
          >
            <option value="cash">เงินสด</option>
            <option value="transfer">โอน</option>
          </select>

          <Input name="note" placeholder="รายละเอียดค่าใช้จ่าย" required className="sm:col-span-2" />
          <Input name="eventTag" placeholder="event tag (optional)" className="sm:col-span-2" />

          {state.error ? <p className="text-sm text-red-300 sm:col-span-2">{state.error}</p> : null}
          {state.success ? <p className="text-sm text-emerald-300 sm:col-span-2">{state.success}</p> : null}

          <Button type="submit" disabled={pending} className="sm:col-span-2 sm:w-fit">
            {pending ? "กำลังบันทึก..." : "บันทึกค่าใช้จ่าย"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
