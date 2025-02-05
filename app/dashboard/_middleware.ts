import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {jwtDecode} from "jwt-decode";
import { forbidden } from "next/navigation";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  if (!token) {
    forbidden()
  }

  try {
    const decoded: any = jwtDecode(token);

    if (!decoded.exp || decoded.exp < Date.now() / 1000) {
      forbidden()
    }

    return NextResponse.next();
  } catch (err) {
    console.error("Error decoding token:", err);
    forbidden()
  }
}
