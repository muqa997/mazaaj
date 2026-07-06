import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);
const adminRoute = process.env.ADMIN_ROUTE;
const staffRoute = process.env.STAFF_ROUTE;

// اسم داخلي ثابت لصفحة لوحة التحكم — محمي بكوكي لا يُضبط إلا لما يزور أحد
// المسار السري الصحيح (متغير ADMIN_ROUTE غير موجود بأي كود مرفوع على GitHub)
const ADMIN_INTERNAL_PATH = "/panel";
const ADMIN_GATE_COOKIE = "mz_admin_gate";

// نفس المبدأ لصفحة الطلبات الخاصة بالعاملين — منفصلة تماماً عن لوحة التحكم
const STAFF_INTERNAL_PATH = "/staffpanel";
const STAFF_GATE_COOKIE = "mz_staff_gate";

// يتحقق من المسار السري سواء كُتب مباشرة (/xxxxx) أو مع بادئة لغة (/ar/xxxxx، /en/xxxxx) —
// لأن المستخدم قد يكتب الرابط وهو أصلاً على صفحة بلغة معينة فتُضاف بادئتها تلقائياً
function matchesSecretRoute(pathname: string, secretRoute: string) {
  const locales = routing.locales.join("|");
  const pattern = new RegExp(`^/(?:(?:${locales})/)?${secretRoute}(?:/.*)?$`);
  return pattern.test(pathname);
}

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (adminRoute && matchesSecretRoute(pathname, adminRoute)) {
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

  if (staffRoute && matchesSecretRoute(pathname, staffRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = STAFF_INTERNAL_PATH;

    const response = NextResponse.redirect(url);
    response.cookies.set(STAFF_GATE_COOKIE, staffRoute, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 يوم
      path: "/staffpanel",
    });
    return response;
  }

  // صفحات لوحة التحكم وصفحة العاملين الداخلية لازم تتجاوز next-intl تماماً، وإلا بيحاول
  // يضيفلها بادئة لغة (/ar/panel) وتفشل لأنها مو جزء من مجموعة (site)
  if (pathname === ADMIN_INTERNAL_PATH || pathname.startsWith(`${ADMIN_INTERNAL_PATH}/`)) {
    return NextResponse.next();
  }
  if (pathname === STAFF_INTERNAL_PATH || pathname.startsWith(`${STAFF_INTERNAL_PATH}/`)) {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
