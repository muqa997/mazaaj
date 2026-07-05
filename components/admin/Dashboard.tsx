"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  ClipboardList,
  Users,
  Briefcase,
  LayoutGrid,
  Trash2,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import { POSITION_KEYS } from "@/lib/job-openings";
import type {
  OrderRow,
  ApplicantRow,
  JobOpeningRow,
  JobOpeningInput,
} from "@/app/(admin)/panel/actions";

type Tab = "overview" | "orders" | "applicants" | "jobs";

type DashboardProps = {
  logoutAction: () => Promise<void>;
  refreshSessionAction: () => Promise<void>;
  getOrders: () => Promise<OrderRow[]>;
  getApplicants: () => Promise<ApplicantRow[]>;
  getJobOpenings: () => Promise<JobOpeningRow[]>;
  createJobOpening: (input: JobOpeningInput) => Promise<{ error: string | null }>;
  updateJobOpening: (
    id: string,
    patch: Partial<JobOpeningInput & { is_active: boolean }>
  ) => Promise<{ error: string | null }>;
  deleteJobOpening: (id: string) => Promise<{ error: string | null }>;
};

const EMPTY_JOB_FORM: JobOpeningInput = {
  position_key: "",
  title_ar: "",
  title_en: "",
  description_ar: "",
  description_en: "",
};

export default function Dashboard(props: DashboardProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [applicants, setApplicants] = useState<ApplicantRow[]>([]);
  const [jobs, setJobs] = useState<JobOpeningRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [jobForm, setJobForm] = useState<JobOpeningInput | null>(null);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [jobFormError, setJobFormError] = useState("");

  const loadAll = async () => {
    setLoading(true);
    try {
      const [o, a, j] = await Promise.all([
        props.getOrders(),
        props.getApplicants(),
        props.getJobOpenings(),
      ]);
      setOrders(o ?? []);
      setApplicants(a ?? []);
      setJobs(j ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    props.refreshSessionAction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await props.logoutAction();
    router.refresh();
  };

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const activeJobsCount = jobs.filter((j) => j.is_active).length;

  const startCreateJob = () => {
    setEditingJobId(null);
    setJobForm(EMPTY_JOB_FORM);
    setJobFormError("");
  };

  const startEditJob = (job: JobOpeningRow) => {
    setEditingJobId(job.id);
    setJobForm({
      position_key: job.position_key,
      title_ar: job.title_ar,
      title_en: job.title_en,
      description_ar: job.description_ar,
      description_en: job.description_en,
    });
    setJobFormError("");
  };

  const closeJobForm = () => {
    setJobForm(null);
    setEditingJobId(null);
    setJobFormError("");
  };

  const submitJobForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobForm) return;

    const result = editingJobId
      ? await props.updateJobOpening(editingJobId, jobForm)
      : await props.createJobOpening(jobForm);

    if (result.error) {
      setJobFormError(result.error);
      return;
    }

    closeJobForm();
    loadAll();
  };

  const toggleJobActive = async (job: JobOpeningRow) => {
    await props.updateJobOpening(job.id, { is_active: !job.is_active });
    loadAll();
  };

  const removeJob = async (id: string) => {
    await props.deleteJobOpening(id);
    loadAll();
  };

  const tabs: { key: Tab; label: string; icon: typeof LayoutGrid }[] = [
    { key: "overview", label: "نظرة عامة", icon: LayoutGrid },
    { key: "orders", label: "الطلبات", icon: ClipboardList },
    { key: "applicants", label: "المتقدمون", icon: Users },
    { key: "jobs", label: "الوظائف", icon: Briefcase },
  ];

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-primary">لوحة تحكم مزاج</h1>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-full bg-primary/5 px-4 py-2 text-sm font-semibold text-primary/70"
        >
          <LogOut size={16} />
          تسجيل الخروج
        </button>
      </div>

      <div className="mb-8 flex gap-2 overflow-x-auto">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === key ? "bg-primary text-background" : "bg-primary/5 text-primary/60"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-primary/50">جاري التحميل...</p>
      ) : (
        <>
          {tab === "overview" && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="عدد الطلبات" value={orders.length} />
              <StatCard
                label="إجمالي المبيعات"
                value={`${totalRevenue.toLocaleString()} د.ع`}
              />
              <StatCard label="المتقدمون للوظائف" value={applicants.length} />
              <StatCard label="الوظائف الشاغرة" value={activeJobsCount} />
            </div>
          )}

          {tab === "orders" && (
            <div className="flex flex-col gap-3">
              {orders.length === 0 && (
                <p className="py-10 text-center text-primary/50">لا توجد طلبات بعد</p>
              )}
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-primary/10 bg-background p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-bold text-primary">{order.customer_name}</span>
                    <span className="text-xs text-primary/40">
                      {new Date(order.created_at).toLocaleString("ar")}
                    </span>
                  </div>
                  <p className="mb-1 text-sm text-primary/60">{order.phone}</p>
                  <p className="mb-3 text-sm text-primary/60">{order.address}</p>
                  <ul className="mb-3 flex flex-col gap-1">
                    {order.items?.map((item, i) => (
                      <li key={i} className="flex justify-between text-sm text-primary/70">
                        <span>
                          {item.name} × {item.qty}
                        </span>
                        <span>{(item.price * item.qty).toLocaleString()} د.ع</span>
                      </li>
                    ))}
                  </ul>
                  {order.notes && (
                    <p className="mb-3 text-sm text-primary/50">ملاحظات: {order.notes}</p>
                  )}
                  <div className="flex items-center justify-between border-t border-primary/10 pt-3">
                    <span className="text-xs font-semibold text-accent">{order.status}</span>
                    <span className="font-bold text-primary">
                      {Number(order.total).toLocaleString()} د.ع
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "applicants" && (
            <div className="flex flex-col gap-3">
              {applicants.length === 0 && (
                <p className="py-10 text-center text-primary/50">لا يوجد متقدمون بعد</p>
              )}
              {applicants.map((applicant) => (
                <div
                  key={applicant.id}
                  className="rounded-2xl border border-primary/10 bg-background p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-bold text-primary">{applicant.name}</span>
                    <span className="text-xs text-primary/40">
                      {new Date(applicant.created_at).toLocaleString("ar")}
                    </span>
                  </div>
                  <p className="mb-1 text-sm text-primary/60">{applicant.phone}</p>
                  <p className="mb-1 text-sm font-semibold text-accent">
                    {applicant.position}
                  </p>
                  {applicant.notes && (
                    <p className="mb-2 text-sm text-primary/50">{applicant.notes}</p>
                  )}
                  {applicant.cv_url && (
                    <a
                      href={applicant.cv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-primary underline"
                    >
                      عرض السيرة الذاتية
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === "jobs" && (
            <div>
              {!jobForm && (
                <button
                  type="button"
                  onClick={startCreateJob}
                  className="mb-5 flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-background"
                >
                  <Plus size={16} />
                  إضافة وظيفة
                </button>
              )}

              {jobForm && (
                <form
                  onSubmit={submitJobForm}
                  className="mb-6 flex flex-col gap-3 rounded-2xl border border-primary/10 bg-background p-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-primary">
                      {editingJobId ? "تعديل وظيفة" : "وظيفة جديدة"}
                    </h3>
                    <button type="button" onClick={closeJobForm}>
                      <X size={18} className="text-primary/50" />
                    </button>
                  </div>

                  <select
                    required
                    value={jobForm.position_key}
                    onChange={(e) =>
                      setJobForm({ ...jobForm, position_key: e.target.value })
                    }
                    className="rounded-xl border border-primary/15 bg-background px-4 py-2.5 text-sm text-primary"
                  >
                    <option value="" disabled>
                      اختر المسمى الوظيفي
                    </option>
                    {POSITION_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {key}
                      </option>
                    ))}
                  </select>

                  <input
                    required
                    placeholder="عنوان الوظيفة (عربي)"
                    value={jobForm.title_ar}
                    onChange={(e) => setJobForm({ ...jobForm, title_ar: e.target.value })}
                    className="rounded-xl border border-primary/15 bg-background px-4 py-2.5 text-sm text-primary"
                  />
                  <input
                    required
                    placeholder="Title (English)"
                    value={jobForm.title_en}
                    onChange={(e) => setJobForm({ ...jobForm, title_en: e.target.value })}
                    className="rounded-xl border border-primary/15 bg-background px-4 py-2.5 text-sm text-primary"
                    dir="ltr"
                  />
                  <textarea
                    required
                    rows={2}
                    placeholder="وصف الوظيفة (عربي)"
                    value={jobForm.description_ar}
                    onChange={(e) =>
                      setJobForm({ ...jobForm, description_ar: e.target.value })
                    }
                    className="resize-none rounded-xl border border-primary/15 bg-background px-4 py-2.5 text-sm text-primary"
                  />
                  <textarea
                    required
                    rows={2}
                    placeholder="Description (English)"
                    value={jobForm.description_en}
                    onChange={(e) =>
                      setJobForm({ ...jobForm, description_en: e.target.value })
                    }
                    className="resize-none rounded-xl border border-primary/15 bg-background px-4 py-2.5 text-sm text-primary"
                    dir="ltr"
                  />

                  {jobFormError && (
                    <p className="text-sm text-red-500">{jobFormError}</p>
                  )}

                  <button
                    type="submit"
                    className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-background"
                  >
                    {editingJobId ? "حفظ التعديلات" : "إضافة الوظيفة"}
                  </button>
                </form>
              )}

              <div className="flex flex-col gap-3">
                {jobs.length === 0 && (
                  <p className="py-10 text-center text-primary/50">لا توجد وظائف مضافة</p>
                )}
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-primary/10 bg-background p-4"
                  >
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-bold text-primary">{job.title_ar}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            job.is_active
                              ? "bg-accent/15 text-primary"
                              : "bg-primary/5 text-primary/40"
                          }`}
                        >
                          {job.is_active ? "شاغرة" : "غير مفعّلة"}
                        </span>
                      </div>
                      <p className="text-sm text-primary/60">{job.description_ar}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleJobActive(job)}
                        className="rounded-full bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary/70"
                      >
                        {job.is_active ? "إخفاء" : "تفعيل"}
                      </button>
                      <button
                        type="button"
                        onClick={() => startEditJob(job)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/5"
                      >
                        <Pencil size={14} className="text-primary/60" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeJob(job.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/5"
                      >
                        <Trash2 size={14} className="text-red-500/70" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-background p-4">
      <p className="mb-1 text-xs text-primary/50">{label}</p>
      <p className="text-xl font-extrabold text-primary">{value}</p>
    </div>
  );
}
