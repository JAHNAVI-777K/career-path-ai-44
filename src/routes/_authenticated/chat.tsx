import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { sendChatMessage, getChatHistory } from "@/lib/ai.functions";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Send, Sparkles, Rocket, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/chat")({
  component: ChatPage,
});

const SUGGESTIONS = [
  "How do I become an AI engineer?",
  "Best projects for placements in CSE?",
  "Interview tips for software jobs?",
  "Suggest courses to strengthen my Python & ML skills",
];

function ChatPage() {
  const sendFn = useServerFn(sendChatMessage);
  const getFn = useServerFn(getChatHistory);
  const qc = useQueryClient();
  const history = useQuery({ queryKey: ["chat"], queryFn: () => getFn() });

  const [input, setInput] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const m = useMutation({
    mutationFn: (msg: string) => sendFn({ data: { message: msg } }),
    onMutate: (msg) => setPending(msg),
    onSuccess: async () => { setPending(null); await qc.invalidateQueries({ queryKey: ["chat"] }); inputRef.current?.focus(); },
    onError: (e: any) => { toast.error(e.message ?? "Chat failed"); setPending(null); },
  });

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [history.data, pending, m.isPending]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = (msg?: string) => {
    const text = (msg ?? input).trim();
    if (!text || m.isPending) return;
    setInput("");
    m.mutate(text);
  };

  const messages = history.data ?? [];
  const isEmpty = messages.length === 0 && !pending;

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col md:h-[calc(100vh-4rem)]">
      <div className="mb-4">
        <h1 className="text-3xl font-bold">AI Career Mentor</h1>
        <p className="mt-1 text-muted-foreground">Ask anything about your career — I remember our past chats.</p>
      </div>

      <div ref={scrollerRef} className="flex-1 overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-soft md:p-6">
        {isEmpty ? (
          <div className="grid h-full place-items-center">
            <div className="max-w-md text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient text-white shadow-glow">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Start the conversation</h3>
              <p className="mt-1 text-sm text-muted-foreground">Try one of these to kick things off:</p>
              <div className="mt-5 grid gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => submit(s)} className="rounded-lg border border-border bg-secondary/40 p-3 text-left text-sm transition hover:bg-secondary hover:shadow-soft">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((msg: any) => <Bubble key={msg.id} role={msg.role} content={msg.content} />)}
            {pending && <Bubble role="user" content={pending} />}
            {m.isPending && (
              <div className="flex items-start gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-gradient text-white"><Rocket className="h-4 w-4" /></div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-border bg-secondary/50 px-4 py-3">
                  <Dot /><Dot delay={0.15} /><Dot delay={0.3} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="mt-4 flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-soft focus-within:ring-2 focus-within:ring-[color:var(--brand)]/30">
        <Textarea
          ref={inputRef}
          rows={1}
          placeholder="Ask about roadmaps, projects, interviews…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          className="max-h-40 min-h-10 resize-none border-0 bg-transparent focus-visible:ring-0"
        />
        <Button type="submit" disabled={m.isPending || !input.trim()} size="icon" className="shrink-0 bg-brand-gradient text-white">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

function Bubble({ role, content }: { role: string; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-white ${isUser ? "bg-secondary text-foreground" : "bg-brand-gradient"}`}>
        {isUser ? <User className="h-4 w-4" /> : <Rocket className="h-4 w-4" />}
      </div>
      <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-soft ${isUser ? "rounded-tr-sm bg-brand-gradient text-white" : "rounded-tl-sm border border-border bg-secondary/40"}`}>
        {content}
      </div>
    </div>
  );
}

function Dot({ delay = 0 }: { delay?: number }) {
  return <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${delay}s` }} />;
}
