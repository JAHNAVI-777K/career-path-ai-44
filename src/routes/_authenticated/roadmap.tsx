import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { generateRoadmap, getLatestRoadmap, getProfile } from "@/lib/ai.functions";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles, GraduationCap, Award, Wrench, MessageSquareText, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/roadmap")({
  component: RoadmapPage,
});

function RoadmapPage() {
  const genFn = useServerFn(generateRoadmap);
  const getFn = useServerFn(getLatestRoadmap);
  const getProfileFn = useServerFn(getProfile);
  const latest = useQuery({ queryKey: ["roadmap"], queryFn: () => getFn() });
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });

  const [form, setForm] = useState({ branch: "", interests: "", skills: "", goal: "" });
  useEffect(() => {
    if (profile.data && !form.branch) setForm({
      branch: profile.data.branch ?? "",
      interests: profile.data.interests ?? "",
      skills: profile.data.skills ?? "",
      goal: profile.data.career_goal ?? "",
    });
  }, [profile.data]);

  const m = useMutation({
    mutationFn: () => genFn({ data: form }),
    onSuccess: () => { toast.success("Roadmap generated!"); latest.refetch(); },
    onError: (e: any) => toast.error(e.message ?? "Failed to generate"),
  });

  const content = latest.data?.content as any;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Career Roadmap</h1>
        <p className="mt-1 text-muted-foreground">Tell us about you — get a personalized plan for the next year.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="grid gap-4 md:grid-cols-2">
          <F label="Branch / Degree" placeholder="CSE, ECE, MBA…" v={form.branch} on={(v: string) => setForm({ ...form, branch: v })} />
          <F label="Career goal" placeholder="e.g. AI Engineer" v={form.goal} on={(v: string) => setForm({ ...form, goal: v })} />
          <F label="Current skills" placeholder="Python, HTML, SQL" v={form.skills} on={(v: string) => setForm({ ...form, skills: v })} />
          <F label="Interests" placeholder="AI, Web dev, Design" v={form.interests} on={(v: string) => setForm({ ...form, interests: v })} />
        </div>
        <div className="mt-5 flex justify-end">
          <Button onClick={() => m.mutate()} disabled={m.isPending || !form.branch || !form.goal || !form.skills || !form.interests} className="bg-brand-gradient text-white shadow-soft">
            {m.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…</> : <><Sparkles className="mr-2 h-4 w-4" /> Generate roadmap</>}
          </Button>
        </div>
      </div>

      {latest.isLoading && <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">Loading…</div>}

      {content && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient text-white"><Target className="h-5 w-5" /></div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Path summary</div>
                <p className="mt-1 text-base">{content.summary}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-lg font-semibold">Timeline</h2>
            <div className="mt-5 space-y-4">
              {(content.milestones ?? []).map((m: any, i: number) => (
                <div key={i} className="relative rounded-xl border border-border bg-secondary/40 p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-brand-gradient px-3 py-1 text-xs font-semibold text-white">{m.period}</div>
                    <div className="font-medium">{m.focus}</div>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {m.actions?.map((a: string, j: number) => (
                      <li key={j} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--accent-teal)]" /> {a}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Section title="Recommended courses" icon={GraduationCap}>
              {(content.courses ?? []).map((c: any, i: number) => (
                <li key={i} className="rounded-lg border border-border bg-secondary/40 p-3">
                  <div className="text-sm font-medium">{c.title}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{c.platform} · {c.why}</div>
                </li>
              ))}
            </Section>
            <Section title="Certifications" icon={Award}>
              {(content.certifications ?? []).map((c: string, i: number) => <li key={i} className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">{c}</li>)}
            </Section>
            <Section title="Mini projects" icon={Wrench}>
              {(content.projects ?? []).map((c: string, i: number) => <li key={i} className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">{c}</li>)}
            </Section>
            <Section title="Interview preparation" icon={MessageSquareText}>
              {(content.interview_prep ?? []).map((c: string, i: number) => <li key={i} className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">{c}</li>)}
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}

function F({ label, placeholder, v, on }: any) {
  return (
    <div>
      <Label>{label}</Label>
      <Input placeholder={placeholder} value={v} onChange={(e) => on(e.target.value)} className="mt-1" />
    </div>
  );
}
function Section({ title, icon: Icon, children }: any) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-[color:var(--brand)]" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}
