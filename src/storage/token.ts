import * as SecureStore from "expo-secure-store";

export const saveToken = (token: string) =>
  SecureStore.setItemAsync("token", token);

export const getToken = () =>
  SecureStore.getItemAsync("token");