// أسماء الترويسات الداخلية التي يضبطها middleware.ts فقط عند مطابقة المسار السري
// الصحيح، وتقرأها صفحات panel/staffpanel/billiardspanel للتأكد من عدم الوصول المباشر
export const ADMIN_GATE_HEADER = "x-mz-admin-gate";
export const STAFF_GATE_HEADER = "x-mz-staff-gate";
export const BILLIARDS_GATE_HEADER = "x-mz-billiards-gate";
