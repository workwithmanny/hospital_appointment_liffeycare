import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const protectedPrefixes = ["/patient", "/doctor", "/admin"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let user: null | { id: string } = null;
  let profile: null | { is_banned: boolean; account_status: string } = null;

  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });
    const { data } = await supabase.auth.getUser();
    user = data.user;

    // Check if user is banned
    if (user) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("is_banned, account_status")
        .eq("id", user.id)
        .single();
      profile = profileData as any;
    }
  }

  const { pathname } = request.nextUrl;
  const isProtected = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );
  const isBannedPage = pathname === "/auth/banned";

  // Redirect banned users to banned page
  if (profile?.is_banned || profile?.account_status === "banned") {
    if (!isBannedPage) {
      const banned = new URL("/auth/banned", request.url);
      return NextResponse.redirect(banned);
    }
    return response;
  }

  // Don't allow non-banned users to access banned page
  if (isBannedPage && !profile?.is_banned && user) {
    const dashboard = new URL("/", request.url);
    return NextResponse.redirect(dashboard);
  }

  if (isProtected && !user) {
    const login = new URL("/auth/login", request.url);
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
