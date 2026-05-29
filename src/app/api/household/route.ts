import { NextResponse } from "next/server";
import { hasValidSession } from "@/lib/auth";
import { getRepository } from "@/lib/repository";
import { parseHouseholdInput, ValidationError } from "@/lib/validation";

export async function POST(request: Request) {
  if (!(await hasValidSession())) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const input = parseHouseholdInput(await request.json());
    const household = await getRepository().createHousehold(input);

    return NextResponse.json({ household });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    if (error instanceof Error && error.message.includes("이미 장부")) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    throw error;
  }
}
