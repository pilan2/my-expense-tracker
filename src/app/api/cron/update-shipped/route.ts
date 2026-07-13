import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Vercel Cron이 매일 호출. 예상 발송일이 지난, 아직 현물이 아닌 품목을 자동으로 현물 전환한다.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await prisma.item.updateMany({
    where: { isPhysical: false, expectedShipDate: { lte: new Date() } },
    data: { isPhysical: true },
  });

  return NextResponse.json({ updatedCount: result.count });
}
