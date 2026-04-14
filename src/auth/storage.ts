import * as SecureStore from "expo-secure-store";

export const saveToken = async (token) => {
  await SecureStore.setItemAsync("userToken", token);
};

export const getToken = async () => {
  return await SecureStore.getItemAsync("userToken");
};

export const removeToken = async () => {
  await SecureStore.deleteItemAsync("userToken");
};