import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { ADMIN_GATE_HEADER, STAFF_GATE_HEADER, BILLIARDS_GATE_HEADER } from "./lib/gate-headers";

const intlMiddleware = createMiddleware(routing);
const adminRoute = process.env.ADMIN_ROUTE;
const staffRoute = process.env.STAFF_ROUTE;
const billiardsRoute = process.env.BILLIARDS_ROUTE;

// اسم داخلي ثابت لصفحة لوحة التحكم — محمي بترويسة داخلية لا تُضبط إلا لما يزور أحد
// المسار السري الصحيح (متغير ADMIN_ROUTE غير موجود بأي كود مرفوع على GitHub)
const ADMIN_INTERNAL_PATH = "/panel";

// نفس المبدأ لصفحة الطلبات الخاصة بالعاملين — منفصلة تماماً عن لوحة التحكم
const STAFF_INTERNAL_PATH = "/staffpanel";

// نفس المبدأ لصفحة موظف البلياردو — منفصلة تماماً عن لوحة التحكم وصفحة العاملين
const BILLIARDS_INTERNAL_PATH = "/billiardspanel";

// يتحقق من المسار السري سواء كُتب مباشرة (/xxxxx) أو مع بادئة لغة (/ar/xxxxx، /en/xxxxx) —
// لأن المستخدم قد يكتب الرابط وهو أصلاً على صفحة بلغة معينة فتُضاف بادئتها تلقائياً
function matchesSecretRoute(pathname: string, secretRoute: string) {
  const locales = routing.locales.join("|");
  const pattern = new RegExp(`^/(?:(?:${locales})/)?${secretRoute}(?:/.*)?$`);
  return pattern.test(pathname);
}

// نستخدم rewrite (وليس redirect) عمداً — بالـ redirect يتغيّر شريط العنوان بالمتصفح إلى
// الاسم الداخلي (/panel، /staffpanel...) وهو اسم يمكن تخمينه، بينما بالـ rewrite يبقى
// شريط العنوان كما كتبه المستخدم (الرمز السري نفسه) ولا يظهر أي اسم داخلي إطلاقاً.
//
// بما أن الـ rewrite جولة طلب واحدة فقط (على عكس الـ redirect اللي يعتمد على جولتين)،
// كوكي تُضبط بهذا الطلب لا تكون مرئية لعرض الصفحة بنفس الطلب — الصفحة تشوف فقط الكوكيز
// اللي وصلت أصلاً مع الطلب الداخل. لذا نمرر إشارة التفويض عبر ترويسة (header) على نفس
// طلب الـ rewrite بدل كوكي، فتصل الصفحة فوراً بنفس الجولة.
function rewriteWithGate(request: NextRequest, internalPath: string, gateHeader: string) {
  const url = request.nextUrl.clone();
  url.pathname = internalPath;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(gateHeader, "1");
  return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (adminRoute && matchesSecretRoute(pathname, adminRoute)) {
    return rewriteWithGate(request, ADMIN_INTERNAL_PATH, ADMIN_GATE_HEADER);
  }

  if (staffRoute && matchesSecretRoute(pathname, staffRoute)) {
    return rewriteWithGate(request, STAFF_INTERNAL_PATH, STAFF_GATE_HEADER);
  }

  if (billiardsRoute && matchesSecretRoute(pathname, billiardsRoute)) {
    return rewriteWithGate(request, BILLIARDS_INTERNAL_PATH, BILLIARDS_GATE_HEADER);
  }

  // زيارة مباشرة للمسار الداخلي نفسه (/panel، /staffpanel، /billiardspanel) بدون المرور
  // بالرمز السري أولاً — يجب أن تفشل دائماً. نحذف صراحةً أي ترويسة بوابة قد يكون العميل
  // أرسلها بنفسه محاولاً انتحالها (مثل curl -H "x-mz-admin-gate: 1")، ثم نمرر الطلب
  // للصفحة نفسها لتتولى الرفض بدل أن يتعامل معها next-intl بشكل خاطئ
  if (
    pathname === ADMIN_INTERNAL_PATH ||
    pathname.startsWith(`${ADMIN_INTERNAL_PATH}/`) ||
    pathname === STAFF_INTERNAL_PATH ||
    pathname.startsWith(`${STAFF_INTERNAL_PATH}/`) ||
    pathname === BILLIARDS_INTERNAL_PATH ||
    pathname.startsWith(`${BILLIARDS_INTERNAL_PATH}/`)
  ) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.delete(ADMIN_GATE_HEADER);
    requestHeaders.delete(STAFF_GATE_HEADER);
    requestHeaders.delete(BILLIARDS_GATE_HEADER);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
