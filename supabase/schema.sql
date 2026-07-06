-- ============================================================
-- كافيه مزاج — إعداد قاعدة البيانات الكاملة
-- الصق هذا الملف كامل بمحرر SQL بمشروع Supabase (SQL Editor) وشغّله
-- هذا الملف آمن لإعادة التشغيل أكثر من مرة (لن يكرر الجداول أو الصلاحيات)
-- ============================================================

-- طلبات التوظيف (من صفحة /careers)
create table if not exists job_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  position text not null,
  notes text,
  cv_url text,
  created_at timestamptz not null default now()
);

alter table job_applications enable row level security;

drop policy if exists "Allow public insert" on job_applications;
create policy "Allow public insert" on job_applications
  for insert to anon with check (true);

-- الوظائف الشاغرة (تديرها لوحة التحكم لاحقاً: إضافة/تعديل/حذف/إخفاء)
create table if not exists job_openings (
  id uuid primary key default gen_random_uuid(),
  position_key text not null,
  title_ar text not null,
  title_en text not null,
  description_ar text not null,
  description_en text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table job_openings enable row level security;

drop policy if exists "Allow public read of active jobs" on job_openings;
create policy "Allow public read of active jobs" on job_openings
  for select to anon using (is_active = true);

-- الوظيفة الحالية كأول صف بالجدول (تُضاف فقط إذا لم تكن موجودة)
insert into job_openings (position_key, title_ar, title_en, description_ar, description_en)
select
  'billiardsStaff',
  'موظف صالة بلياردو',
  'Billiards Hall Staff',
  'يجيد إدارة الطاولات وتنظيم الحجوزات، مع أسلوب لبق وحسن التعامل مع الزبائن. لديه معرفة تامة بقواعد لعبة البلياردو.',
  'Skilled in managing billiards tables and organizing reservations, with a polished manner and excellent customer service. Has thorough knowledge of the rules of billiards.'
where not exists (
  select 1 from job_openings where position_key = 'billiardsStaff'
);

-- طلبات التوصيل (من صفحة /order — تُرسل عبر واتساب وتُحفظ هنا للسجل والإحصائيات)
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  address text not null,
  notes text,
  items jsonb not null,
  total numeric not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table orders enable row level security;

drop policy if exists "Allow public insert" on orders;
create policy "Allow public insert" on orders
  for insert to anon with check (true);

-- تخزين ملفات السيرة الذاتية (اختياري بنموذج التوظيف)
insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', false)
on conflict (id) do nothing;

drop policy if exists "Allow public upload to cvs" on storage.objects;
create policy "Allow public upload to cvs" on storage.objects
  for insert to anon with check (bucket_id = 'cvs');

-- اقتراحات وملاحظات الزوار (من مودال "شاركنا اقتراحك" بالفوتر)
create table if not exists suggestions (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table suggestions enable row level security;

drop policy if exists "Allow public insert" on suggestions;
create policy "Allow public insert" on suggestions
  for insert to anon with check (true);

-- كوبونات الخصم (تُدار بالكامل من لوحة التحكم — لا يوجد استخدام لها بواجهة الموقع بعد)
create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null default 'fixed' check (discount_type in ('fixed', 'percentage')),
  discount_value numeric not null,
  created_at timestamptz not null default now()
);

alter table coupons enable row level security;
-- بدون أي policy للزوار (anon) — لوحة التحكم فقط تصل له عبر مفتاح service_role السري

-- كوبون تجريبي (يُضاف فقط إذا لم يكن موجوداً)
insert into coupons (code, discount_type, discount_value)
select 'MAZAAJ2026', 'percentage', 10
where not exists (
  select 1 from coupons where code = 'MAZAAJ2026'
);

-- شريط الإعلانات المتحرك بأعلى الموقع (3 رسائل ثابتة، تُدار من لوحة التحكم)
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  position int not null unique,
  text_ar text not null,
  text_en text not null,
  created_at timestamptz not null default now()
);

alter table announcements enable row level security;

drop policy if exists "Allow public read" on announcements;
create policy "Allow public read" on announcements
  for select to anon using (true);

insert into announcements (position, text_ar, text_en)
select 1, 'استخدم كوبون MAZAAJ2026 واحصل على خصم فوري', 'Use coupon MAZAAJ2026 for an instant discount'
where not exists (select 1 from announcements where position = 1);

insert into announcements (position, text_ar, text_en)
select 2, 'التوصيل متوفر يومياً من الساعة 10 صباحاً إلى الساعة 1 صباحاً', 'Delivery available daily from 10 AM to 1 AM'
where not exists (select 1 from announcements where position = 2);

insert into announcements (position, text_ar, text_en)
select 3, 'تابعونا على انستغرام لأحدث العروض', 'Follow us on Instagram for our latest offers'
where not exists (select 1 from announcements where position = 3);

-- ملاحظة: ما فيه أي policy للقراءة العامة على أي جدول من الأربعة عدا الوظائف الشاغرة النشطة —
-- الطلبات وطلبات التوظيف والاقتراحات والكوبونات بيانات خاصة، تقرأها فقط لوحة التحكم عبر مفتاح service_role السري.
