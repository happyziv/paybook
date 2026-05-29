import { NextResponse } from "next/server";
import { hasValidSession } from "@/lib/auth";
import { getRepository } from "@/lib/repository";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await hasValidSession())) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  const { id } = await context.params;
  const expenseId = Number(id);

  if (!Number.isInteger(expenseId) || expenseId < 1) {
    return NextResponse.json(
      { message: "지출 ID가 올바르지 않습니다." },
      { status: 400 }
    );
  }

  await getRepository().deleteExpense(expenseId);

  return new NextResponse(null, { status: 204 });
}
