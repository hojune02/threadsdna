import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { env, requireThreadsEnv } from "@/lib/env";

export const runtime = "nodejs";

type TokenResponse = { access_token?: string; user_id?: string; error_message?: string };

function homeWithError(code: string) {
  const url = new URL("/", env.NEXT_PUBLIC_APP_URL);
  url.searchParams.set("error", code);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = (await cookies()).get("tdna_oauth_state")?.value;

  if (!code || !state || !storedState || state !== storedState) {
    return homeWithError("oauth_state_mismatch");
  }

  try {
    const { appId, appSecret, redirectUri } = requireThreadsEnv();
    const body = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    });

    const tokenResponse = await fetch("https://graph.threads.net/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });

    const token = (await tokenResponse.json()) as TokenResponse;
    if (!tokenResponse.ok || !token.access_token) {
      console.error("Threads token exchange failed", token);
      return homeWithError("token_exchange_failed");
    }

    const response = NextResponse.redirect(new URL("/analyze", env.NEXT_PUBLIC_APP_URL));
    response.cookies.delete("tdna_oauth_state");
    response.cookies.set("tdna_threads_token", token.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    });
    return response;
  } catch (error) {
    console.error(error);
    return homeWithError("oauth_failed");
  }
}
