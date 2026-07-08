import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { analyzeResume, getLatestResume } from "@/lib/ai.functions";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, Sparkles, ThumbsUp, ThumbsDown, Lightbulb, Tag, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/resume")({
  component: ResumePage,
});

const resumeSchema = z.object({
  target_role: z
    .string()
    .trim()
    .min(2, "Target role must be at least 2 characters")
    .max(80, "Target role must be under 80 characters"),
  resume_text: z
    .string()
    .trim()
    .min(200, "Paste at least 200 characters of your resume")
    .max(20000, "Resume is too long (max 20,000 characters)"),
});

// Simple keyword heuristics for section detection
const SECTION_HINTS = {
  contact: /(email|phone|linkedin|github|@)/i,
  experience: /(experience|work history|employment|intern)/i,
  education: /(education|b\.?tech|bachelor|master|university|college|degree)/i,
  skills: /(skills|technologies|tech stack|proficien)/i,
  projects: /(projects?|portfolio)/i,
};

function ResumePage() {
  const analyzeFn = useServerFn(analyzeResume);
  const getFn = useServerFn(getLatestResume);
  const latest = useQuery({ queryKey: ["resume"], queryFn: () => getFn() });

  const [text, setText] = useState("");
  const [role, setRole] = useState("");
  const [errors, setErrors] = useState<{ target_role?: string; resume_text?: string }>({});
  const [touched, setTouched] = useState<{ target_role?: boolean; resume_text?: boolean }>({});

  const m = useMutation({
    mutationFn: () => analyzeFn({ data: { resume_text: text.trim(), target_role: role.trim() } }),
    onSuccess: () => { toast.success("Analysis complete"); latest.refetch(); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const a = latest.data?.analysis as any;

  // Live checklist
  const checklist = useMemo(() => {
    const t = text.trim();
    const r = role.trim();
    return [
      { key: "role", label: "Set a target role", done: r.length >= 2, hint: "e.g. Frontend Developer" },
      { key: "length", label: "Paste ≥ 200 characters of resume text", done: t.length >= 200, hint: `${t.length} / 200 characters` },
      { key: "contact", label: "Include contact info (email / phone / LinkedIn)", done: SECTION_HINTS.contact.test(t), hint: "Recruiters need to reach you" },
      { key: "experience", label: "Add work or internship experience", done: SECTION_HINTS.experience.test(t), hint: "Or mention internships / freelance" },
      { key: "education", label: "Add education section", done: SECTION_HINTS.education.test(t), hint: "Degree, institution, year" },
      { key: "skills", label: "List core skills / tech stack", done: SECTION_HINTS.skills.test(t), hint: "Match keywords from the JD" },
      { key: "projects", label: "Showcase projects", done: SECTION_HINTS.projects.test(t), hint: "Great for freshers" },
      { key: "analyzed", label: "Run AI analysis", done: !!a, hint: "Get your ATS score" },
    ];
  }, [text, role, a]);

  const doneCount = checklist.filter((s) => s.done).length;
  const pct = Math.round((doneCount / checklist.length) * 100);

  const validate = () => {
    const result = resumeSchema.safeParse({ target_role: role, resume_text: text });
    if (!result.success) {
      const fe: typeof errors = {};
      for (const iss of result.error.issues) {
        const key = iss.path[0] as keyof typeof fe;
        if (!fe[key]) fe[key] = iss.message;
      }
      setErrors(fe);
      setTouched({ target_role: true, resume_text: true });
      return false;
    }
    setErrors({});
    return true;
  };

  const onSubmit = () => {
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    m.mutate();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Resume Analyzer</h1>
        <p className="mt-1 text-muted-foreground">Follow the checklist to build a resume that passes ATS filters.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Form */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="grid gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <Label>
                    Target role <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-xs text-muted-foreground">{role.trim().length}/80</span>
                </div>
                <Input
                  placeholder="e.g. Frontend Developer, Data Analyst"
                  value={role}
                  maxLength={80}
                  onChange={(e) => {
                    setRole(e.target.value);
                    if (touched.target_role) setErrors((p) => ({ ...p, target_role: undefined }));
                  }}
                  onBlur={() => setTouched((p) => ({ ...p, target_role: true }))}
                  className={`mt-1 ${touched.target_role && errors.target_role ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  aria-invalid={!!(touched.target_role && errors.target_role)}
                />
                {touched.target_role && errors.target_role && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" /> {errors.target_role}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label>
                    Resume text <span className="text-destructive">*</span>
                  </Label>
                  <span className={`text-xs ${text.trim().length < 200 ? "text-muted-foreground" : "text-[color:var(--accent-teal)]"}`}>
                    {text.length} / 20,000 characters
                  </span>
                </div>
                <Textarea
                  rows={12}
                  placeholder="Copy your resume content here — include contact info, experience, education, skills, and projects…"
                  value={text}
                  maxLength={20000}
                  onChange={(e) => {
                    setText(e.target.value);
                    if (touched.resume_text) setErrors((p) => ({ ...p, resume_text: undefined }));
                  }}
                  onBlur={() => setTouched((p) => ({ ...p, resume_text: true }))}
                  className={`mt-1 font-mono text-xs ${touched.resume_text && errors.resume_text ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  aria-invalid={!!(touched.resume_text && errors.resume_text)}
                />
                {touched.resume_text && errors.resume_text && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" /> {errors.resume_text}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">Complete more checklist items on the right to boost your score.</p>
              <Button onClick={onSubmit} disabled={m.isPending} className="bg-brand-gradient text-white">
                {m.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing…</> : <><Sparkles className="mr-2 h-4 w-4" /> Analyze resume</>}
              </Button>
            </div>
          </div>

          {a && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <ScoreCard label="ATS Score" value={a.ats_score ?? 0} />
                <ScoreCard label="Skills Score" value={a.skills_score ?? 0} />
                <ScoreCard label="Quality Score" value={a.quality_score ?? 0} />
              </div>
              {a.summary && (
                <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Verdict</div>
                  <p className="mt-2 text-base">{a.summary}</p>
                </div>
              )}
              <div className="grid gap-6 md:grid-cols-2">
                <ListCard title="Strengths" icon={ThumbsUp} items={a.strengths} tone="teal" />
                <ListCard title="Weaknesses" icon={ThumbsDown} items={a.weaknesses} tone="red" />
                <ListCard title="Missing keywords" icon={Tag} items={a.missing_keywords} tone="violet" />
                <ListCard title="Suggestions" icon={Lightbulb} items={a.suggestions} tone="brand" />
              </div>
            </div>
          )}
        </div>

        {/* Checklist sidebar */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Builder checklist</h3>
              <span className="text-xs font-medium text-foreground">{pct}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-brand-gradient transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{doneCount} of {checklist.length} steps complete</p>

            <ul className="mt-4 space-y-2">
              {checklist.map((s) => (
                <li key={s.key} className={`flex items-start gap-2.5 rounded-lg border p-3 transition ${s.done ? "border-[color:var(--accent-teal)]/30 bg-[color:var(--accent-teal)]/5" : "border-border bg-secondary/30"}`}>
                  {s.done
                    ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--accent-teal)]" />
                    : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                  <div className="min-w-0">
                    <div className={`text-sm ${s.done ? "font-medium" : ""}`}>{s.label}</div>
                    <div className="text-xs text-muted-foreground">{s.hint}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? "var(--accent-teal)" : value >= 60 ? "var(--brand)" : value >= 40 ? "#f59e0b" : "oklch(0.6 0.22 27)";
  const R = 42, C = 2 * Math.PI * R;
  const off = C - (value / 100) * C;
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-4 flex items-center gap-4">
        <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
          <circle cx="50" cy="50" r={R} stroke="currentColor" className="text-secondary" strokeWidth="8" fill="none" />
          <circle cx="50" cy="50" r={R} stroke={color as any} strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off} style={{ transition: "stroke-dashoffset 600ms ease" }} />
        </svg>
        <div>
          <div className="text-3xl font-bold" style={{ color: color as any }}>{value}</div>
          <div className="text-xs text-muted-foreground">out of 100</div>
        </div>
      </div>
    </div>
  );
}

function ListCard({ title, icon: Icon, items, tone }: any) {
  const toneClass = tone === "teal" ? "text-[color:var(--accent-teal)] bg-[color:var(--accent-teal)]/10" : tone === "red" ? "text-destructive bg-destructive/10" : tone === "violet" ? "text-[color:var(--brand-2)] bg-[color:var(--brand-2)]/10" : "text-[color:var(--brand)] bg-brand/10";
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="mb-4 flex items-center gap-2">
        <div className={`grid h-8 w-8 place-items-center rounded-lg ${toneClass}`}><Icon className="h-4 w-4" /></div>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <ul className="space-y-2">
        {(items ?? []).map((s: string, i: number) => (
          <li key={i} className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">{s}</li>
        ))}
      </ul>
    </div>
  );
}
