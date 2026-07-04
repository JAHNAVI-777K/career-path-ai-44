import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Map, FileText, MessageSquare, GraduationCap, Rocket, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Features />
      <Benefits />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-gradient text-white shadow-soft">
            <Rocket className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">CareerPilot <span className="text-brand-gradient">AI</span></span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#benefits" className="hover:text-foreground">Benefits</a>
          <a href="#testimonials" className="hover:text-foreground">Loved by</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline">Login</Link>
          <Link to="/auth" search={{ mode: "signup" }}>
            <Button className="bg-brand-gradient text-white shadow-soft hover:opacity-95">Get started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-brand/20 blur-3xl" />
        <div className="absolute top-40 right-0 h-[400px] w-[400px] rounded-full bg-[color:var(--brand-2)]/20 blur-3xl" />
      </div>
      <div className="mx-auto max-w-6xl px-4 py-24 text-center md:py-32">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
          <Sparkles className="h-3.5 w-3.5 text-[color:var(--brand)]" />
          Your personal AI career copilot
        </div>
        <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
          Land your dream job with an <span className="text-brand-gradient">AI-crafted roadmap</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          CareerPilot AI builds a personalized learning path, analyzes your resume, recommends courses, and answers every career question — all in one place.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link to="/auth" search={{ mode: "signup" }}>
            <Button size="lg" className="bg-brand-gradient text-white shadow-glow hover:opacity-95">
              Start free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/auth">
            <Button size="lg" variant="outline">I already have an account</Button>
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["10k+", "Students onboarded"],
            ["500+", "Career paths"],
            ["95%", "Feel more confident"],
            ["24/7", "AI mentor"],
          ].map(([n, l]) => (
            <div key={l} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <div className="text-2xl font-bold text-brand-gradient">{n}</div>
              <div className="mt-1 text-xs text-muted-foreground">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: Map, title: "AI Career Roadmap", desc: "Get a personalized 1-month → 1-year plan with courses, projects, and certifications." },
  { icon: FileText, title: "Resume Analyzer", desc: "Upload your resume and receive an ATS score with keyword & content suggestions." },
  { icon: MessageSquare, title: "AI Career Mentor", desc: "Chat 24/7 for interview tips, project ideas, and personalized guidance." },
  { icon: GraduationCap, title: "Course Recommendations", desc: "Curated courses from Coursera, Udemy, NPTEL & more based on your goal." },
];

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-4xl font-bold md:text-5xl">Everything you need. <span className="text-brand-gradient">Nothing you don't.</span></h2>
        <p className="mt-4 text-muted-foreground">Four AI-powered tools that replace a career counselor, resume coach, and mentor.</p>
      </div>
      <div className="mt-14 grid gap-5 md:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.title} className="card-hover group rounded-2xl border border-border bg-card p-7 shadow-soft hover:card-hover-effect">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-gradient text-white shadow-soft">
              <f.icon className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-xl font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Benefits() {
  const items = [
    "Personalized to your branch, skills & goal",
    "Concrete milestones, not vague advice",
    "ATS-optimized resume analysis",
    "Handpicked courses & certifications",
    "Interview prep tailored to your target role",
    "Track progress in a clean dashboard",
  ];
  return (
    <section id="benefits" className="border-y border-border bg-gradient-to-b from-secondary/50 to-background">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 md:grid-cols-2 md:items-center">
        <div>
          <h2 className="text-4xl font-bold md:text-5xl">Built for <span className="text-brand-gradient">students & freshers</span></h2>
          <p className="mt-4 text-muted-foreground">Stop juggling YouTube playlists, LinkedIn advice, and 100 open tabs. CareerPilot gives you one focused plan.</p>
          <ul className="mt-8 space-y-3">
            {items.map((t) => (
              <li key={t} className="flex items-start gap-3">
                <div className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[color:var(--accent-teal)]/15 text-[color:var(--accent-teal)]">
                  <Check className="h-3 w-3" />
                </div>
                <span className="text-sm">{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-glow">
            <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-[color:var(--brand-2)]/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-[color:var(--accent-teal)]/70" />
              <span className="ml-2">careerpilot.ai — Roadmap</span>
            </div>
            <div className="space-y-3">
              {[
                { m: "Month 1", t: "Python fundamentals + Git", c: "bg-brand/10 text-brand" },
                { m: "Month 3", t: "Build 2 ML projects", c: "bg-[color:var(--brand-2)]/10 text-[color:var(--brand-2)]" },
                { m: "Month 6", t: "Deep Learning specialization", c: "bg-[color:var(--accent-teal)]/10 text-[color:var(--accent-teal)]" },
                { m: "Year 1", t: "Apply to AI Engineer roles", c: "bg-primary/10 text-primary" },
              ].map((s) => (
                <div key={s.m} className="flex items-center gap-3 rounded-xl border border-border bg-secondary/50 p-3">
                  <div className={`rounded-md px-2 py-1 text-xs font-semibold ${s.c}`}>{s.m}</div>
                  <div className="text-sm font-medium">{s.t}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const t = [
    { n: "Aditi S.", r: "CSE, 3rd year", q: "The roadmap saved me months. I finally know what to build next." },
    { n: "Rohan M.", r: "ECE fresher", q: "Resume analyzer bumped my ATS score from 42 → 88. Got 3 interviews the next week." },
    { n: "Priya K.", r: "MCA student", q: "The AI mentor answers everything from 'what project' to 'salary expectations'." },
  ];
  return (
    <section id="testimonials" className="mx-auto max-w-6xl px-4 py-24">
      <div className="text-center">
        <h2 className="text-4xl font-bold md:text-5xl">Loved by <span className="text-brand-gradient">early careers</span></h2>
      </div>
      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {t.map((x) => (
          <div key={x.n} className="card-hover rounded-2xl border border-border bg-card p-6 shadow-soft hover:card-hover-effect">
            <p className="text-sm leading-relaxed">"{x.q}"</p>
            <div className="mt-6 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-gradient text-sm font-semibold text-white">
                {x.n[0]}
              </div>
              <div>
                <div className="text-sm font-semibold">{x.n}</div>
                <div className="text-xs text-muted-foreground">{x.r}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24">
      <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-12 text-center text-white shadow-glow md:p-16">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_80%,white,transparent_40%)]" />
        <h2 className="relative text-4xl font-bold md:text-5xl">Your AI career copilot is ready.</h2>
        <p className="relative mx-auto mt-4 max-w-xl text-white/80">Join thousands of students building focused careers with CareerPilot AI. Free to start.</p>
        <div className="relative mt-8 flex justify-center gap-3">
          <Link to="/auth" search={{ mode: "signup" }}>
            <Button size="lg" className="bg-white text-[color:var(--brand)] hover:bg-white/90">
              Create free account <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground md:flex-row">
        <div>© {new Date().getFullYear()} CareerPilot AI</div>
        <div>Built for career-driven students.</div>
      </div>
    </footer>
  );
}
