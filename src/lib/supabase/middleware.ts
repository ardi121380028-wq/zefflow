import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Route publik murni yang langsung lolos 0ms tanpa pemeriksaan sesi Auth. */
const ALWAYS_PUBLIC_PREFIXES = [
  "/auth",
  "/share",
  "/terms",
  "/privacy",
  "/about",
  "/features",
  "/guide",
];

/** Ambang sisa masa berlaku JWT (detik) sebelum Middleware melakukan refresh ke Supabase Auth. */
const TOKEN_REFRESH_MARGIN_SECONDS = 90;

export async function updateSession(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (ALWAYS_PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next({ request });
  }

  const allCookies = request.cookies.getAll();
  const sbCookies = allCookies.filter((c) => c.name.startsWith("sb-"));
  const hasSbAuthCookie = sbCookies.length > 0;
  const hasLegacyDemoCookie = request.cookies.has("lf_demo");

  const isGuestEntry = pathname === "/" || pathname === "/login" || pathname.startsWith("/login/");
  const isReauthFallback =
    (pathname === "/login" || pathname.startsWith("/login/")) && searchParams.get("reauth") === "1";

  // Fast-path 0ms untuk pengunjung belum login (langsung masuk Landing Page / Login tanpa lag!)
  if (!hasSbAuthCookie) {
    if (isGuestEntry) {
      const res = NextResponse.next({ request });
      if (hasLegacyDemoCookie) res.cookies.delete("lf_demo");
      return res;
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    const res = NextResponse.redirect(url);
    if (hasLegacyDemoCookie) res.cookies.delete("lf_demo");
    return res;
  }

  let response = NextResponse.next({ request });
  if (hasLegacyDemoCookie) response.cookies.delete("lf_demo");
  let isAuthenticated = false;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list: { name: string; value: string; options?: any }[]) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          if (hasLegacyDemoCookie) response.cookies.delete("lf_demo");
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  try {
    if (isReauthFallback) {
      const { data } = await supabase.auth.getUser();
      isAuthenticated = Boolean(data.user);
      if (!isAuthenticated) {
        sbCookies.forEach(({ name }) => response.cookies.delete(name));
        return response;
      }
    } else {
      // Baca sesi lokal dari cookie dalam 0ms; hanya panggil GoTrue bila JWT mendekati kedaluwarsa
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const nowSec = Math.floor(Date.now() / 1000);
      const isTokenFresh =
        Boolean(session?.user) &&
        typeof session?.expires_at === "number" &&
        session.expires_at - nowSec > TOKEN_REFRESH_MARGIN_SECONDS;

      if (isTokenFresh) {
        isAuthenticated = true;
      } else {
        const { data } = await supabase.auth.getUser();
        isAuthenticated = Boolean(data.user);
      }
    }
  } catch {
    isAuthenticated = false;
  }

  if (!isAuthenticated && !isGuestEntry) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && isGuestEntry) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
