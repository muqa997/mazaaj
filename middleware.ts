import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);
const adminRoute = process.env.ADMIN_ROUTE;

// اسم داخلي ثابت لصفحة لوحة التحكم — محمي بكوكي لا يُضبط إلا لما يزور أحد
// المسار السري الصحيح (متغير ADMIN_ROUTE غير موجود بأي كود مرفوع على GitHub)
const ADMIN_INTERNAL_PATH = "/panel";
const ADMIN_GATE_COOKIE = "mz_admin_gate";

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (adminRoute && pathname.startsWith(`/${adminRoute}`)) {
    const url = request.nextUrl.clone();
    url.pathname = ADMIN_INTERNAL_PATH;

    const response = NextResponse.redirect(url);
    response.cookies.set(ADMIN_GATE_COOKIE, adminRoute, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 يوم
      path: "/panel",
    });
    return response;
  }

  // صفحة لوحة التحكم الداخلية نفسها لازم تتجاوز next-intl تماماً، وإلا بيحاول
  // يضيفلها بادئة لغة (/ar/panel) وتفشل لأنها مو جزء من مجموعة (site)
  if (pathname === ADMIN_INTERNAL_PATH || pathname.startsWith(`${ADMIN_INTERNAL_PATH}/`)) {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
