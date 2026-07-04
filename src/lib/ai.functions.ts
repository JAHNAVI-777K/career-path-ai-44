import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

type Msg = { role: "system" | "user" | "assistant"; content: string };

async function callAI(messages: Msg[], opts?: { json?: boolean }): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const body: any = { model: MODEL, messages };
  if (opts?.json) body.response_format = { type: "json_object" };
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("AI rate limit reached — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted — add credits in your workspace.");
    throw new Error(`AI error (${res.status}): ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/* ---------- Career Roadmap ---------- */
const roadmapInput = z.object({
  branch: z.string().min(1).max(80),
  interests: z.string().min(1).max(300),
  skills: z.string().min(1).max(300),
  goal: z.string().min(1).max(120),
});

export const generateRoadmap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => roadmapInput.parse(d))
  .handler(async ({ data, context }) => {
    const prompt = `You are an expert career coach for Indian students. Create a highly personalized career roadmap.

Student profile:
- Branch/Degree: ${data.branch}
- Current skills: ${data.skills}
- Interests: ${data.interests}
- Career goal: ${data.goal}

Return STRICT JSON in this exact shape:
{
  "summary": "2-3 sentence overview of the path",
  "milestones": [
    { "period": "1 Month", "focus": "...", "actions": ["...", "..."] },
    { "period": "3 Months", "focus": "...", "actions": ["...", "..."] },
    { "period": "6 Months", "focus": "...", "actions": ["...", "..."] },
    { "period": "1 Year", "focus": "...", "actions": ["...", "..."] }
  ],
  "courses": [{ "title": "...", "platform": "Coursera|Udemy|NPTEL|freeCodeCamp|YouTube", "why": "..." }],
  "certifications": ["...", "..."],
  "projects": ["...", "...", "..."],
  "interview_prep": ["...", "..."]
}
Each milestone should have 3-5 concrete actions. Include 5-7 courses, 3-5 certifications, 3-5 projects, 5-6 interview prep items.`;

    const raw = await callAI([
      { role: "system", content: "You output only valid JSON. No markdown fences." },
      { role: "user", content: prompt },
    ], { json: true });

    let content: any;
    try { content = JSON.parse(raw); }
    catch { content = JSON.parse(raw.replace(/```json|```/g, "").trim()); }

    const { data: saved, error } = await context.supabase
      .from("roadmaps")
      .insert({
        user_id: context.userId,
        branch: data.branch, interests: data.interests, skills: data.skills, goal: data.goal,
        content,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return saved;
  });

export const getLatestRoadmap = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("roadmaps").select("*").eq("user_id", context.userId)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    return data;
  });

/* ---------- Resume Analyzer ---------- */
const resumeInput = z.object({
  resume_text: z.string().min(50, "Paste at least 50 characters of resume text").max(20000),
  target_role: z.string().max(120).optional(),
});

export const analyzeResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => resumeInput.parse(d))
  .handler(async ({ data, context }) => {
    const prompt = `You are an expert ATS resume reviewer. Analyze this resume${data.target_role ? ` for a ${data.target_role} role` : ""}.

Resume:
"""
${data.resume_text}
"""

Return STRICT JSON:
{
  "ats_score": 0-100 integer,
  "skills_score": 0-100,
  "quality_score": 0-100,
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "missing_keywords": ["...", "..."],
  "suggestions": ["...", "..."],
  "summary": "1-2 sentence verdict"
}
Be honest but constructive. 3-6 items per list.`;

    const raw = await callAI([
      { role: "system", content: "You output only valid JSON. No markdown fences." },
      { role: "user", content: prompt },
    ], { json: true });

    let analysis: any;
    try { analysis = JSON.parse(raw); }
    catch { analysis = JSON.parse(raw.replace(/```json|```/g, "").trim()); }

    const { data: saved, error } = await context.supabase
      .from("resumes")
      .insert({
        user_id: context.userId,
        resume_text: data.resume_text,
        target_role: data.target_role ?? null,
        analysis,
        ats_score: analysis.ats_score ?? null,
      })
      .select().single();
    if (error) throw new Error(error.message);
    return saved;
  });

export const getLatestResume = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("resumes").select("*").eq("user_id", context.userId)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    return data;
  });

/* ---------- Chatbot ---------- */
const chatInput = z.object({ message: z.string().min(1).max(2000) });

export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => chatInput.parse(d))
  .handler(async ({ data, context }) => {
    // Save user message
    await context.supabase.from("chat_messages").insert({
      user_id: context.userId, role: "user", content: data.message,
    });

    // Load recent history (last 20)
    const { data: history } = await context.supabase
      .from("chat_messages").select("role, content")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false }).limit(20);
    const ordered = (history ?? []).reverse();

    // Load profile for personalization
    const { data: profile } = await context.supabase
      .from("profiles").select("full_name, branch, skills, interests, career_goal")
      .eq("id", context.userId).maybeSingle();

    const system = `You are CareerPilot AI — a friendly, expert career mentor for students and freshers (especially in India).
Give concrete, actionable, personalized advice. Recommend real courses (Coursera, Udemy, freeCodeCamp, NPTEL) and real project ideas when helpful.
Keep responses focused. Use markdown lists when helpful. Never be vague.
${profile ? `\nStudent profile — Name: ${profile.full_name || "N/A"}, Branch: ${profile.branch || "N/A"}, Skills: ${profile.skills || "N/A"}, Interests: ${profile.interests || "N/A"}, Goal: ${profile.career_goal || "N/A"}.` : ""}`;

    const messages: Msg[] = [
      { role: "system", content: system },
      ...ordered.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ];

    const reply = await callAI(messages);

    const { data: saved } = await context.supabase
      .from("chat_messages")
      .insert({ user_id: context.userId, role: "assistant", content: reply })
      .select().single();

    return saved;
  });

export const getChatHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("chat_messages").select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true }).limit(100);
    return data ?? [];
  });

/* ---------- Profile ---------- */
const profileInput = z.object({
  full_name: z.string().max(80).optional(),
  branch: z.string().max(80).optional(),
  skills: z.string().max(300).optional(),
  interests: z.string().max(300).optional(),
  career_goal: z.string().max(120).optional(),
});

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => profileInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: p, error } = await context.supabase
      .from("profiles").update(data).eq("id", context.userId).select().single();
    if (error) throw new Error(error.message);
    return p;
  });

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles").select("*").eq("id", context.userId).maybeSingle();
    return data;
  });
