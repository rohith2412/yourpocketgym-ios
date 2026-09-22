import { api } from "../../api/client";

export type ChatMessage = { role: "user" | "assistant"; content: string };

/**
 * POST /api/coach/chat
 * Body: { messages: ChatMessage[] }
 * → 200 { reply: string }
 */
export async function coachChat(messages: ChatMessage[]): Promise<string> {
  const data = await api.post<{ reply?: string }>("/coach/chat", { messages });
  return data.reply ?? "";
}
