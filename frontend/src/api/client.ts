import { storage } from "@/src/utils/storage";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL || "";
const TOKEN_KEY = "riseup_token";

export async function getToken(): Promise<string | null> {
  return (await storage.secureGet<string>(TOKEN_KEY, "" as string)) || null;
}

export async function setToken(token: string) {
  await storage.secureSet(TOKEN_KEY, token);
}

export async function clearToken() {
  await storage.secureRemove(TOKEN_KEY);
}

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}/api${path}`, { ...options, headers });
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    const message =
      (data && typeof data === "object" && (data.detail || data.message)) || `Request failed (${res.status})`;
    throw new Error(typeof message === "string" ? message : "Request failed");
  }
  return data as T;
}

export const api = {
  // Auth
  register: (email: string, password: string, name: string) =>
    request("/auth/register", { method: "POST", body: JSON.stringify({ email, password, name }) }),
  login: (email: string, password: string) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => request("/auth/me"),

  // Onboarding
  saveOnboarding: (payload: any) =>
    request("/onboarding", { method: "POST", body: JSON.stringify(payload) }),
  setPersonality: (ai_personality: string) =>
    request("/profile/personality", { method: "PUT", body: JSON.stringify({ ai_personality }) }),

  // Goals
  listGoals: () => request("/goals"),
  createGoal: (payload: any) =>
    request("/goals", { method: "POST", body: JSON.stringify(payload) }),
  getGoal: (id: string) => request(`/goals/${id}`),
  deleteGoal: (id: string) => request(`/goals/${id}`, { method: "DELETE" }),
  generatePlan: (id: string) =>
    request(`/goals/${id}/generate-plan`, { method: "POST" }),

  // Tasks
  listTasks: (date?: string) => request(`/tasks${date ? `?date=${date}` : ""}`),
  createTask: (payload: any) =>
    request("/tasks", { method: "POST", body: JSON.stringify(payload) }),
  updateTask: (id: string, payload: any) =>
    request(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteTask: (id: string) => request(`/tasks/${id}`, { method: "DELETE" }),

  // Habits
  listHabits: () => request("/habits"),
  createHabit: (payload: any) =>
    request("/habits", { method: "POST", body: JSON.stringify(payload) }),
  checkHabit: (id: string) => request(`/habits/${id}/check`, { method: "POST" }),
  deleteHabit: (id: string) => request(`/habits/${id}`, { method: "DELETE" }),

  // Mood / Journal
  logMood: (payload: any) => request("/mood", { method: "POST", body: JSON.stringify(payload) }),
  listMood: () => request("/mood"),
  createJournal: (payload: any) =>
    request("/journal", { method: "POST", body: JSON.stringify(payload) }),
  listJournal: () => request("/journal"),
  deleteJournal: (id: string) => request(`/journal/${id}`, { method: "DELETE" }),

  // Chat
  chatSend: (text: string, session_id?: string) =>
    request("/chat/message", { method: "POST", body: JSON.stringify({ text, session_id }) }),
  chatHistory: (session_id?: string) =>
    request(`/chat/history${session_id ? `?session_id=${session_id}` : ""}`),

  // Alarms
  listAlarms: () => request("/alarms"),
  createAlarm: (payload: any) =>
    request("/alarms", { method: "POST", body: JSON.stringify(payload) }),
  deleteAlarm: (id: string) => request(`/alarms/${id}`, { method: "DELETE" }),
  verifyAlarm: (id: string, body: any = {}) =>
    request(`/alarms/${id}/verify`, { method: "POST", body: JSON.stringify(body) }),

  // Dashboard & reports
  dashboard: () => request("/dashboard"),
  weeklyReport: () => request("/reports/weekly"),
};
