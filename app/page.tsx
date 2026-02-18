import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-12">
      <Card className="glass-card-strong w-full">
        <CardHeader className="space-y-4">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80">
            <Store className="h-4 w-4" />
            Native Market POS
          </div>
          <CardTitle className="text-3xl font-semibold text-white sm:text-4xl">
            ระบบขายและบันทึกค่าใช้จ่ายหน้างาน แบบเรียบง่ายและเร็ว
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="max-w-2xl text-sm text-white/75 sm:text-base">
            Phase 1 พร้อมแล้ว: โครงระบบ Next.js + MimiVibe + Auth Shell เพื่อเข้าสู่หน้า Dashboard
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/login">
                เข้าสู่ระบบ
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/dashboard">ดู Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
