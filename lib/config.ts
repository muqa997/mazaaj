export const WHATSAPP_NUMBER = "9647704699946";
export const PHONE_DISPLAY = "07704699946";
export const PHONE_TEL = "+9647704699946";
export const CONTACT_EMAIL = "info@mazaajcafe.com";

// رسم توصيل ثابت لكل طلب — يُستخدم فقط لحساب صافي الإيراد في لوحة التحكم
// (المجموع المحفوظ مع كل طلب هو سعر الأصناف فقط، ولا يشمل هذا الرسم)
export const DELIVERY_FEE = 2000;

const SOCIAL_USERNAME = "mazaaj.cafe";

export const SOCIAL_LINKS = {
  instagram: `https://instagram.com/${SOCIAL_USERNAME}`,
  facebook: `https://facebook.com/${SOCIAL_USERNAME}`,
  tiktok: `https://tiktok.com/@${SOCIAL_USERNAME}`,
  whatsapp: `https://wa.me/${WHATSAPP_NUMBER}`,
};

const MAP_LAT = "33.43157004496837";
const MAP_LNG = "43.29760529100712";

export const MAP_EMBED_URL = `https://www.google.com/maps?q=${MAP_LAT},${MAP_LNG}&z=16&output=embed`;
// رابط صفحة المكان الفعلية على خرائط جوجل (بعد إضافته كنشاط تجاري مسجّل) — تجربة
// أفضل لزر "احصل على الاتجاهات" من رابط بحث مبني على الإحداثيات فقط
export const MAP_DIRECTIONS_URL = "https://maps.app.goo.gl/T3zZufkZaBNdpFNi8";

// بيانات صفحة QR (/qrmazaaj) — تُطبع وتُعرض للزبائن مباشرة، فليست معلومات سرية
export const WIFI_SSID = "كوفي مزاج";
export const WIFI_PASSWORD = "11111111";
// رابط تقييم جوجل المباشر — الأسئلة الإضافية (المبلغ المصروف، إلخ) يتحكم بها جوجل نفسه
// حسب نوع النشاط التجاري ولا يمكن تعديلها أو حذفها من جهتنا عبر الرابط
export const GOOGLE_REVIEW_URL = "https://g.page/r/CZI1kN-yeFTrEAE/review";
