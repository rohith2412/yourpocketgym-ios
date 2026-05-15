import Purchases, { LOG_LEVEL, PurchasesPackage } from "react-native-purchases";
import { Platform } from "react-native";

const API_KEY_IOS     = "appl_SwbGmMi0tJPRcSdhVDKXjNTKwgm";
const API_KEY_ANDROID = ""; // add if you ship Android

export function configureRevenueCat(userId?: string) {
  Purchases.setLogLevel(LOG_LEVEL.ERROR);
  const apiKey = Platform.OS === "ios" ? API_KEY_IOS : API_KEY_ANDROID;
  Purchases.configure({ apiKey, appUserID: userId ?? null });
}

export async function getOfferings() {
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

export async function purchasePackage(pkg: PurchasesPackage) {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases() {
  const customerInfo = await Purchases.restorePurchases();
  return customerInfo;
}

export async function getCustomerInfo() {
  return await Purchases.getCustomerInfo();
}

export function isPremiumCustomer(customerInfo: any): boolean {
  return typeof customerInfo?.entitlements?.active?.["premium"] !== "undefined";
}
