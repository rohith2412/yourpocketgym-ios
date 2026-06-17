import Purchases, { LOG_LEVEL, PurchasesPackage, CustomerInfo } from "react-native-purchases";
import { Platform } from "react-native";

// ── RevenueCat config ──────────────────────────────────────────────────────────
const RC_API_KEY_IOS     = "appl_iTmcyKbdGUdpxaBhhiPfoEubflb";


const RC_API_KEY_ANDROID = ""; // add if Android is ever shipped
const ENTITLEMENT_ID     = "PocketGym Pro";

type CustomerInfoListener = (info: CustomerInfo) => void;
const listeners: Set<CustomerInfoListener> = new Set();

// ── Setup ──────────────────────────────────────────────────────────────────────
export function configureRevenueCat(userId?: string) {
  Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({
    apiKey:    Platform.OS === "ios" ? RC_API_KEY_IOS : RC_API_KEY_ANDROID,
    appUserID: userId ?? null,
  });

  Purchases.addCustomerInfoUpdateListener((info) => {
    console.log("[IAP] Customer info updated, entitlements:", JSON.stringify(Object.keys(info.entitlements.active)));
    console.log("[IAP] isPremium:", isPremium(info));
    listeners.forEach((cb) => cb(info));
  });
}

export function addPremiumStatusListener(cb: CustomerInfoListener) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
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
  const active = customerInfo?.entitlements?.active ?? {};
  const activeKeys = Object.keys(active);
  console.log("[IAP] Checking entitlement '" + ENTITLEMENT_ID + "' against active:", JSON.stringify(activeKeys));
  return ENTITLEMENT_ID in active;
}
