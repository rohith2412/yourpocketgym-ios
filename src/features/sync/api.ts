import { api } from "../../api/client";
import type { SyncSnapshot } from "./snapshot";

type PushResponse = { success: true; updatedAt: string; clientUpdatedAt: string; bytes: number };
type PullResponse = {
  success: true;
  data: SyncSnapshot | null;
  updatedAt: string | null;
  clientUpdatedAt: string | null;
};

export const pushSnapshot = (snap: SyncSnapshot) =>
  api.post<PushResponse>("/sync", { data: snap, clientUpdatedAt: new Date().toISOString() });

export const pullSnapshot = () => api.get<PullResponse>("/sync");
