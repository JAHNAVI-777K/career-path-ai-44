import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLatestRoadmap, getLatestResume, getProfile, updateProfile } from "@/lib/ai.functions";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Map, FileText, MessageSquare, GraduationCap, TrendingUp, Sparkles, ArrowRight, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const getRoadmapFn = useServerFn(getLatestRoadmap);
  const getResumeFn = useServerFn(getLatestResume);
  const getProfileFn = useServerFn(getProfile);

  const roadmap = useQuery({ queryKey: ["roadmap"], queryFn: () => getRoadmapFn() });
  const resume = useQuery({ queryKey: ["resume"], queryFn: () => getResumeFn() });
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });

  const fields = ["full_name", "branch", "skills", "interests", "career_goal"] as const;
  const filled = profile.data ? fields.filter((f) => (profile.data as any)?.[f]).length : 0;
  const profilePct = Math.round((filled / fields.length) * 100);
  const atsScore = resume.data?.ats_score ?? null;

  const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "there";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Welcome */}
      <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-8 text-white shadow-glow">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_40%)]" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur">
            <Sparkles className="h-3 w-3" /> Your AI copilot
          </div>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">Welcome back, {name} 👋</h1>
          <p className="mt-2 max-w-2xl text-white/85">Pick up where you left off — refine your roadmap, sharpen your resume, or chat with your AI mentor.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/roadmap"><Button className="bg-white text-[color:var(--brand)] hover:bg-white/90">Generate roadmap <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link to="/chat"><Button variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">Ask AI mentor</Button></Link>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-5 md:grid-cols-3">
        <StatCard label="Profile completion" value={`${profilePct}%`} icon={User} tone="brand" bar={profilePct} />
        <StatCard label="Resume ATS score" value={atsScore != null ? `${atsScore}/100` : "—"} icon={FileText} tone="teal" bar={atsScore ?? 0} />
        <StatCard label="Roadmap milestones" value={roadmap.data?.content ? `${(roadmap.data.content as any).milestones?.length ?? 0}` : "0"} icon={TrendingUp} tone="violet" bar={roadmap.data ? 100 : 0} />
      </div>

      {/* Feature grid */}
      <div className="grid gap-5 md:grid-cols-2">
        <FeatureCard
          to="/roadmap" icon={Map} title="Career Roadmap"
          desc={roadmap.data ? `Goal: ${roadmap.data.goal}` : "No roadmap yet — let AI create your personalized plan."}
          cta={roadmap.data ? "View & refine" : "Generate now"}
        />
        <FeatureCard
          to="/resume" icon={FileText} title="Resume Analyzer"
          desc={atsScore != null ? `Latest ATS score: ${atsScore}/100` : "Get instant ATS scoring with actionable improvements."}
          cta={atsScore != null ? "Improve resume" : "Analyze resume"}
        />
        <FeatureCard
          to="/chat" icon={MessageSquare} title="AI Career Mentor"
          desc="Ask anything — interview tips, project ideas, learning paths."
          cta="Start chatting"
        />
        <RecommendedCourses roadmap={roadmap.data} />
      </div>

      {/* Profile quick-edit */}
      <ProfileCard profile={profile.data} refetch={() => profile.refetch()} />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone, bar }: any) {
  const toneClass = tone === "brand" ? "bg-brand/10 text-[color:var(--brand)]" : tone === "teal" ? "bg-[color:var(--accent-teal)]/10 text-[color:var(--accent-teal)]" : "bg-[color:var(--brand-2)]/10 text-[color:var(--brand-2)]";
  return (
    <div className="card-hover rounded-2xl border border-border bg-card p-6 shadow-soft hover:card-hover-effect">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={`grid h-9 w-9 place-items-center rounded-lg ${toneClass}`}><Icon className="h-4 w-4" /></div>
      </div>
      <div className="mt-3 text-3xl font-bold">{value}</div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-brand-gradient transition-all" style={{ width: `${Math.min(100, Math.max(0, bar))}%` }} />
      </div>
    </div>
  );
}

function FeatureCard({ to, icon: Icon, title, desc, cta }: any) {
  return (
    <Link to={to} className="card-hover group rounded-2xl border border-border bg-card p-6 shadow-soft hover:card-hover-effect">
      <div className="flex items-start justify-between">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-gradient text-white shadow-soft"><Icon className="h-5 w-5" /></div>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      <div className="mt-4 text-sm font-medium text-[color:var(--brand)]">{cta} →</div>
    </Link>
  );
}

function RecommendedCourses({ roadmap }: { roadmap: any }) {
  const courses = (roadmap?.content?.courses ?? []).slice(0, 3);
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-[color:var(--accent-teal)]/10 text-[color:var(--accent-teal)]"><GraduationCap className="h-5 w-5" /></div>
        <h3 className="text-lg font-semibold">Recommended courses</h3>
      </div>
      {courses.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Generate a roadmap to see personalized courses.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {courses.map((c: any, i: number) => (
            <li key={i} className="rounded-lg border border-border bg-secondary/50 p-3">
              <div className="text-sm font-medium">{c.title}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{c.platform} · {c.why}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProfileCard({ profile, refetch }: { profile: any; refetch: () => void }) {
  const updateFn = useServerFn(updateProfile);
  const [form, setForm] = useState({ full_name: "", branch: "", skills: "", interests: "", career_goal: "" });
  useEffect(() => {
    if (profile) setForm({
      full_name: profile.full_name ?? "", branch: profile.branch ?? "", skills: profile.skills ?? "",
      interests: profile.interests ?? "", career_goal: profile.career_goal ?? "",
    });
  }, [profile]);
  const m = useMutation({
    mutationFn: () => updateFn({ data: form }),
    onSuccess: () => { toast.success("Profile updated"); refetch(); },
    onError: (e: any) => toast.error(e.message ?? "Failed to update"),
  });
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Your profile</h3>
          <p className="text-sm text-muted-foreground">The more we know, the better your AI recommendations.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
        <Field label="Branch / Degree" placeholder="e.g. CSE, ECE, MBA" value={form.branch} onChange={(v) => setForm({ ...form, branch: v })} />
        <Field label="Skills" placeholder="Python, React, SQL…" value={form.skills} onChange={(v) => setForm({ ...form, skills: v })} />
        <Field label="Interests" placeholder="AI, Web dev, Product…" value={form.interests} onChange={(v) => setForm({ ...form, interests: v })} />
        <Field label="Career goal" placeholder="e.g. AI Engineer" value={form.career_goal} onChange={(v) => setForm({ ...form, career_goal: v })} className="md:col-span-2" />
      </div>
      <div className="mt-5 flex justify-end">
        <Button onClick={() => m.mutate()} disabled={m.isPending} className="bg-brand-gradient text-white">
          {m.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save profile
        </Button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, className }: any) {
  return (
    <div className={className}>
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1" />
    </div>
  );
}
