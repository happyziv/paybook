import { NextResponse } from "next/server";
import { hasValidSession } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { parseExpenseInput, ValidationError } from "@/lib/validation";

export async function POST(request: Request) {
  if (!(await hasValidSession())) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const repository = getRepository();
    const household = await repository.getHousehold();

    if (!household) {
      return NextResponse.json({ needsSetup: true }, { status: 404 });
    }

    const input = parseExpenseInput(await request.json(), [
      household.personAName,
      household.personBName
    ]);
    const expense = await repository.createExpense(input);

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    throw error;
  }
}
