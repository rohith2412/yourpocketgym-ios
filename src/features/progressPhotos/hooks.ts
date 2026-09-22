import { Alert } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addPhoto, deletePhoto, loadPhotos } from "./storage";

const KEYS = { list: ["progress-photos"] as const };

export function usePhotos() {
  return useQuery({ queryKey: KEYS.list, queryFn: loadPhotos });
}

export function useAddPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sourceUri: string) => addPhoto(sourceUri),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.list }),
    onError: (err: Error) => {
      console.warn("addPhoto failed:", err);
      Alert.alert("Couldn't save photo", err.message || String(err));
    },
  });
}

export function useDeletePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePhoto(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.list }),
  });
}
