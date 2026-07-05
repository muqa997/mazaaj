"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Briefcase, ChevronDown, Upload, CheckCircle2, Inbox } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { POSITION_KEYS, fetchJobOpenings, type JobOpening } from "@/lib/job-openings";
import { fadeUp } from "@/lib/motion";

const MAX_CV_SIZE = 5 * 1024 * 1024;

export default function CareersPage() {
  const t = useTranslations("careers");
  const locale = useLocale() as "ar" | "en";

  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [notes, setNotes] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  useEffect(() => {
    fetchJobOpenings()
      .then(setJobs)
      .finally(() => setJobsLoading(false));
  }, []);

  const handleApplyClick = (positionKey: string) => {
    setPosition(positionKey);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > MAX_CV_SIZE) {
      setFileError(t("cvTooLarge"));
      setCvFile(null);
      return;
    }
    setFileError("");
    setCvFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    try {
      if (!supabase) throw new Error("Supabase is not configured yet");

      let cvUrl: string | null = null;
      if (cvFile) {
        const filePath = `${Date.now()}-${cvFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("cvs")
          .upload(filePath, cvFile);
        if (uploadError) throw uploadError;
        cvUrl = supabase.storage.from("cvs").getPublicUrl(filePath).data.publicUrl;
      }

      const { error } = await supabase.from("job_applications").insert({
        name,
        phone,
        position,
        notes: notes || null,
        cv_url: cvUrl,
      });
      if (error) throw error;

      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <CheckCircle2 size={48} className="mb-4 text-accent" />
        <h1 className="mb-2 text-2xl font-extrabold text-primary">{t("successTitle")}</h1>
        <p className="max-w-sm text-primary/60">{t("successMessage")}</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-10">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h1 className="mb-2 text-3xl font-extrabold text-primary sm:text-4xl">
          {t("pageTitle")}
        </h1>
        <p className="text-primary/60">{t("pageSubtitle")}</p>
      </div>

      <div className="mx-auto mb-16 max-w-4xl">
        {jobsLoading && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-3xl border border-primary/10 bg-background p-6"
              >
                <div className="mb-4 h-5 w-24 rounded-full bg-primary/10" />
                <div className="mb-3 h-6 w-2/3 rounded-lg bg-primary/10" />
                <div className="mb-2 h-3 w-full rounded bg-primary/10" />
                <div className="mb-6 h-3 w-4/5 rounded bg-primary/10" />
                <div className="h-11 w-full rounded-full bg-primary/10" />
              </div>
            ))}
          </div>
        )}

        {!jobsLoading && jobs.length === 0 && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="flex flex-col items-center rounded-3xl border border-primary/10 bg-primary/[0.03] px-6 py-16 text-center"
          >
            <Inbox size={40} className="mb-4 text-primary/30" />
            <h2 className="mb-2 text-xl font-extrabold text-primary">
              {t("noOpeningsTitle")}
            </h2>
            <p className="max-w-sm text-primary/60">{t("noOpeningsSubtitle")}</p>
          </motion.div>
        )}

        {jobs.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {jobs.map((job) => (
              <motion.div
                key={job.id}
                variants={fadeUp}
                initial="hidden"
                animate="show"
                className="flex flex-col rounded-3xl border border-primary/10 bg-background p-6 shadow-glass"
              >
                <span className="mb-3 inline-block w-fit rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-primary">
                  {t("adBadge")}
                </span>
                <h3 className="mb-2 text-xl font-extrabold text-primary">
                  {job.title[locale]}
                </h3>
                <p className="mb-6 flex-1 text-sm leading-loose text-primary/60">
                  {job.description[locale]}
                </p>
                <a
                  href="#apply"
                  onClick={() => handleApplyClick(job.positionKey)}
                  className="flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-background shadow-glass"
                >
                  <Briefcase size={16} />
                  {t("applyButton")}
                </a>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div id="apply" className="mx-auto max-w-lg scroll-mt-20">
        <h2 className="mb-2 text-2xl font-extrabold text-primary">{t("formTitle")}</h2>
        <p className="mb-8 text-sm text-primary/50">{t("formSubtitle")}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-primary">
              {t("name")}
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              className="w-full rounded-xl border border-primary/15 bg-background px-4 py-3 text-sm text-primary outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-primary">
              {t("phone")}
            </label>
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("phonePlaceholder")}
              className="w-full rounded-xl border border-primary/15 bg-background px-4 py-3 text-sm text-primary outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-primary">
              {t("position")}
            </label>
            <div className="relative">
              <select
                required
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full appearance-none rounded-xl border border-primary/15 bg-background px-4 py-3 text-sm text-primary outline-none focus:border-accent"
              >
                <option value="" disabled>
                  {t("positionPlaceholder")}
                </option>
                {POSITION_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {t(`positions.${key}`)}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-primary/40"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-primary">
              {t("notes")}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("notesPlaceholder")}
              rows={3}
              className="w-full resize-none rounded-xl border border-primary/15 bg-background px-4 py-3 text-sm text-primary outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-primary">
              {t("cv")}
            </label>
            <label
              htmlFor="cv-upload"
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-primary/20 bg-background px-4 py-3 text-sm text-primary/60"
            >
              <Upload size={16} className="shrink-0 text-accent" />
              <span className="truncate">{cvFile ? cvFile.name : t("cvPlaceholder")}</span>
            </label>
            <input
              id="cv-upload"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="mt-1.5 text-xs text-primary/40">
              {fileError || t("cvHint")}
            </p>
          </div>

          {status === "error" && (
            <p className="text-sm text-red-500">{t("errorMessage")}</p>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="mt-2 flex items-center justify-center rounded-full bg-primary px-6 py-4 text-sm font-semibold text-background shadow-glass active:scale-95 disabled:opacity-60"
          >
            {status === "submitting" ? t("submitting") : t("submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
