import { getJSON, setJSON } from "../../lib/storage";
import type { ChatMessage } from "./api";

const KEY = "@coach_messages";
const MAX = 200; // cap history to keep storage light and future API calls bounded

export async function loadChatHistory(): Promise<ChatMessage[]> {
  return (await getJSON<ChatMessage[]>(KEY)) ?? [];
}

export async function saveChatHistory(messages: ChatMessage[]): Promise<void> {
  const trimmed = messages.slice(-MAX);
  await setJSON(KEY, trimmed);
}

export async function clearChatHistory(): Promise<void> {
  await setJSON(KEY, []);
}
