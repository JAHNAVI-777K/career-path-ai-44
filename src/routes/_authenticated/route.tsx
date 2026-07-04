import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Home, Map, FileText, MessageSquare, LogOut, Rocket, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/roadmap", label: "Career Roadmap", icon: Map },
  { to: "/resume", label: "Resume Analyzer", icon: FileText },
  { to: "/chat", label: "AI Mentor", icon: MessageSquare },
] as const;

function AuthedLayout() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-gradient text-white"><Rocket className="h-4 w-4" /></div>
          <span className="font-bold">CareerPilot</span>
        </Link>
        <button onClick={() => setOpen((o) => !o)} className="rounded-md p-2 hover:bg-secondary">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar */}
        <aside className={`${open ? "block" : "hidden"} md:block fixed inset-x-0 top-14 z-30 border-b border-border bg-card md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-r`}>
          <div className="hidden items-center gap-2 px-6 py-5 md:flex">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-gradient text-white shadow-soft"><Rocket className="h-5 w-5" /></div>
            <span className="text-lg font-bold">CareerPilot</span>
          </div>
          <nav className="space-y-1 px-3 py-3 md:py-2">
            {NAV.map((n) => {
              const active = pathname === n.to;
              return (
                <Link key={n.to} to={n.to} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active ? "bg-brand-gradient text-white shadow-soft" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                  <n.icon className="h-4 w-4" /> {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto border-t border-border px-3 py-3 md:absolute md:bottom-0 md:w-full">
            <div className="mb-2 flex items-center gap-3 px-3 py-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-gradient text-sm font-semibold text-white">
                {(user.user_metadata?.full_name?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{user.user_metadata?.full_name ?? "Student"}</div>
                <div className="truncate text-xs text-muted-foreground">{user.email}</div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
