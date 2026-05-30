import { NextResponse } from "next/server";
import {
  createSessionToken,
  isPinValid,
  serializeSessionCookie,
  shouldUseSecureCookie
} from "@/lib/auth";
import { getConfig } from "@/lib/config";
import { parsePinInput, ValidationError } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const input = parsePinInput(await request.json());
    const config = getConfig();

    if (!isPinValid(input.pin, config.paybookPin)) {
      return NextResponse.json(
        { message: "PIN이 올바르지 않습니다." },
        { status: 401 }
      );
    }

    const token = createSessionToken(config.sessionSecret);
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Set-Cookie": serializeSessionCookie(
          token,
          shouldUseSecureCookie(request, config.isProduction)
        )
      }
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    throw error;
  }
}
