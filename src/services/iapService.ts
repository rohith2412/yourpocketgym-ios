import Purchases, { LOG_LEVEL, PurchasesPackage, CustomerInfo } from "react-native-purchases";
import { Platform } from "react-native";

// ── RevenueCat config ──────────────────────────────────────────────────────────
const RC_API_KEY_IOS     = "appl_kxSrGLjXMPAUBBgAmUzXIPdeYCb";
const RC_API_KEY_ANDROID = ""; // add if Android is ever shipped
const ENTITLEMENT_ID     = "PocketGym Pro";

// ── Setup ──────────────────────────────────────────────────────────────────────
export function configureRevenueCat(userId?: string) {
  Purchases.setLogLevel(LOG_LEVEL.ERROR);
  Purchases.configure({
    apiKey:    Platform.OS === "ios" ? RC_API_KEY_IOS : RC_API_KEY_ANDROID,
    appUserID: userId ?? null,
  });
}

// ── Products / Offerings ───────────────────────────────────────────────────────
export async function getOfferings() {
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

// ── Purchase ───────────────────────────────────────────────────────────────────
export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

// ── Restore ────────────────────────────────────────────────────────────────────
export async function restorePurchases(): Promise<CustomerInfo> {
  return await Purchases.restorePurchases();
}

// ── Status ─────────────────────────────────────────────────────────────────────
export async function getCustomerInfo(): Promise<CustomerInfo> {
  return await Purchases.getCustomerInfo();
}

export function isPremium(customerInfo: CustomerInfo): boolean {
  return ENTITLEMENT_ID in (customerInfo?.entitlements?.active ?? {});
}
