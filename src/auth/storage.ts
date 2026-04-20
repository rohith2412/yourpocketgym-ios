import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "userToken";

// expo-secure-store may not be available on all platforms/environments
// (e.g. Expo Go web, simulators without secure enclave). Fall back to
// AsyncStorage so the app never hard-crashes.

async function secureGet(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return await AsyncStorage.getItem(key);
  }
}

async function secureSet(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    await AsyncStorage.setItem(key, value);
  }
}

async function secureDelete(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    await AsyncStorage.removeItem(key);
  }
}

export const saveToken = async (token: string): Promise<void> => {
  await secureSet(KEY, token);
};

export const getToken = async (): Promise<string | null> => {
  return await secureGet(KEY);
};

export const removeToken = async (): Promise<void> => {
  await secureDelete(KEY);
};
