-- ════════════════════════════════════════════════════════════════════
--  إضافة البلي ستيشن — شغّل هذا الملف مرة واحدة بمحرر SQL في سوبابيس
--  آمن للتكرار: كل أمر فيه IF NOT EXISTS فلا يضر تشغيله مرتين
-- ════════════════════════════════════════════════════════════════════

-- ١) تمييز نوع الدخل ومدة اللعب.
--    القيمة الافتراضية 'billiards' تجعل كل الصفوف الحالية صحيحة بلا لمسها،
--    و minutes تبقى NULL للبلياردو لأنه يُحاسب بالكيم لا بالوقت
alter table billiards_transactions
  add column if not exists kind text not null default 'billiards',
  add column if not exists minutes integer;

alter table billiards_tickets
  add column if not exists kind text not null default 'billiards',
  add column if not exists minutes integer;

-- سبب الإدخال اليدوي لدخل يوم سابق (كان اختيارياً، نضيفه هنا إن لم يُضف بعد)
alter table billiards_transactions
  add column if not exists entry_note text;

-- يمنع أي قيمة نوع غير متوقعة من الدخول بصمت
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'billiards_transactions_kind_check') then
    alter table billiards_transactions
      add constraint billiards_transactions_kind_check
      check (kind in ('billiards', 'playstation'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'billiards_tickets_kind_check') then
    alter table billiards_tickets
      add constraint billiards_tickets_kind_check
      check (kind in ('billiards', 'playstation'));
  end if;
end $$;

-- يُسرّع تصفية الإحصائيات حسب النوع والتاريخ
create index if not exists billiards_transactions_kind_paid_at_idx
  on billiards_transactions (kind, paid_at desc);

-- ٢) الحالة الحية لأجهزة البلي — تقابل جدول billiards_tables
create table if not exists playstation_devices (
  id uuid primary key default gen_random_uuid(),
  device_number integer not null unique,
  -- NULL = الجهاز متوقف. وجود قيمة = اللعب جارٍ منذ هذه اللحظة
  started_at timestamptz,
  customer_ref text,
  updated_at timestamptz not null default now()
);

-- جهاز واحد للبدء؛ تُضاف البقية من لوحة التحكم بلا برمجة
insert into playstation_devices (device_number) values (1)
  on conflict (device_number) do nothing;

-- ٣) نفس حماية بقية الجداول: لا قراءة ولا كتابة بالمفتاح العام.
--    كل الوصول يمر بمفتاح الخدمة من الخادم (نفس نهج billiards_tables)
alter table playstation_devices enable row level security;

-- ════════════════════════════════════════════════════════════════════
--  للتأكد بعد التشغيل:
--    select kind, count(*) from billiards_transactions group by kind;
--    select * from playstation_devices;
-- ════════════════════════════════════════════════════════════════════
