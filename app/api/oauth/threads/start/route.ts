import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { requireThreadsEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { appId, redirectUri } = requireThreadsEnv();
    const state = randomBytes(24).toString("hex");
    const authUrl = new URL("https://threads.net/oauth/authorize");
    authUrl.searchParams.set("client_id", appId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", "threads_basic,threads_manage_insights");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("state", state);

    const response = NextResponse.redirect(authUrl);
    response.cookies.set("tdna_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    });
    return response;
  } catch {
    return NextResponse.redirect(
      new URL("/?error=threads_not_configured", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
    );
  }
}
