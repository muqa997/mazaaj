-- ============================================================
-- كافيه مزاج — إعداد قاعدة البيانات الكاملة
-- الصق هذا الملف كامل بمحرر SQL بمشروع Supabase (SQL Editor) وشغّله مرة وحدة
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

create policy "Allow public read of active jobs" on job_openings
  for select to anon using (is_active = true);

-- الوظيفة الحالية كأول صف بالجدول
insert into job_openings (position_key, title_ar, title_en, description_ar, description_en)
values (
  'billiardsStaff',
  'موظف صالة بلياردو',
  'Billiards Hall Staff',
  'يجيد إدارة الطاولات وتنظيم الحجوزات، مع أسلوب لبق وحسن التعامل مع الزبائن. لديه معرفة تامة بقواعد لعبة البلياردو.',
  'Skilled in managing billiards tables and organizing reservations, with a polished manner and excellent customer service. Has thorough knowledge of the rules of billiards.'
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

create policy "Allow public insert" on orders
  for insert to anon with check (true);

-- تخزين ملفات السيرة الذاتية (اختياري بنموذج التوظيف)
insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', false)
on conflict (id) do nothing;

create policy "Allow public upload to cvs" on storage.objects
  for insert to anon with check (bucket_id = 'cvs');

-- ملاحظة: ما فيه أي policy للقراءة العامة على أي جدول من الثلاثة عدا الوظائف الشاغرة النشطة —
-- الطلبات وطلبات التوظيف بيانات خاصة، تقرأها فقط لوحة التحكم عبر مفتاح service_role السري.
