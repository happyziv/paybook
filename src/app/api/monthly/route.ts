import { NextResponse } from "next/server";
import { hasValidSession } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { parseMonthQuery, ValidationError } from "@/lib/validation";

export async function GET(request: Request) {
  if (!(await hasValidSession())) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const month = parseMonthQuery(url.searchParams.get("month"));
    const repository = getRepository();
    const household = await repository.getHousehold();

    if (!household) {
      return NextResponse.json({ needsSetup: true }, { status: 404 });
    }

    return NextResponse.json(await repository.getMonthlyData(month));
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    throw error;
  }
}
