import { api } from "../../api/client";

type UpdateResponse = { success: true; data: { name: string; email: string } };

export const updateProfile = (body: { name: string }) =>
  api.put<UpdateResponse>("/profile", body);
