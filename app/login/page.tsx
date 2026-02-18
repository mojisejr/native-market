"use client";

import { useActionState } from "react";
import { LockKeyhole } from "lucide-react";
import { loginAction, type LoginState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
      <Card className="glass-card-strong w-full">
        <CardHeader className="space-y-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80">
            <LockKeyhole className="h-4 w-4" />
            Native Market Auth
          </div>
          <CardTitle className="text-white">เข้าสู่ระบบเพื่อใช้งาน Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <Input name="password" type="password" placeholder="กรอกรหัสผ่าน" required />
            {state.error ? <p className="text-sm text-red-300">{state.error}</p> : null}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
