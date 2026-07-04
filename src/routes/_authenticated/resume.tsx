import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { analyzeResume, getLatestResume } from "@/lib/ai.functions";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles, ThumbsUp, ThumbsDown, Lightbulb, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/resume")({
  component: ResumePage,
});

function ResumePage() {
  const analyzeFn = useServerFn(analyzeResume);
  const getFn = useServerFn(getLatestResume);
  const latest = useQuery({ queryKey: ["resume"], queryFn: () => getFn() });

  const [text, setText] = useState("");
  const [role, setRole] = useState("");

  const m = useMutation({
    mutationFn: () => analyzeFn({ data: { resume_text: text, target_role: role || undefined } }),
    onSuccess: () => { toast.success("Analysis complete"); latest.refetch(); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const a = latest.data?.analysis as any;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Resume Analyzer</h1>
        <p className="mt-1 text-muted-foreground">Paste your resume text — get an instant ATS score and improvements.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="grid gap-4">
          <div>
            <Label>Target role (optional)</Label>
            <Input placeholder="e.g. Frontend Developer, Data Analyst" value={role} onChange={(e) => setRole(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Paste your resume text</Label>
            <Textarea rows={10} placeholder="Copy your resume content here…" value={text} onChange={(e) => setText(e.target.value)} className="mt-1 font-mono text-xs" />
            <p className="mt-1 text-xs text-muted-foreground">{text.length} characters</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => m.mutate()} disabled={m.isPending || text.length < 50} className="bg-brand-gradient text-white">
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
