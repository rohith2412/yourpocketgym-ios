import Purchases, { LOG_LEVEL, PurchasesPackage, CustomerInfo } from "react-native-purchases";
import { Platform, Alert } from "react-native";

// ── RevenueCat config ──────────────────────────────────────────────────────────
const RC_API_KEY_IOS     = "appl_iTmcyKbdGUdpxaBhhLPfoEubfIb"; 
const RC_API_KEY_ANDROID = ""; // add if Android is ever shipped
const ENTITLEMENT_ID     = "PocketGym Pro";

let isConfigured = false;

// ── Setup ──────────────────────────────────────────────────────────────────────
export function configureRevenueCat(userId?: string) {
  try {
    const apiKey = Platform.OS === "ios" ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;

    if (!apiKey) {
      console.error("[IAP] No API key for platform:", Platform.OS);
      return;
    }

    console.log("[IAP] Configuring RevenueCat...");
    console.log("[IAP] Platform:", Platform.OS);
    console.log("[IAP] API Key:", apiKey.substring(0, 10) + "...");
    console.log("[IAP] User ID:", userId ?? "anonymous");

    Purchases.setLogLevel(LOG_LEVEL.DEBUG); // Use DEBUG to see all RC logs
    Purchases.configure({
      apiKey,
      appUserID: userId ?? null,
    });

    isConfigured = true;
    console.log("[IAP] RevenueCat configured successfully");
  } catch (err: any) {
    console.error("[IAP] Failed to configure RevenueCat:", err?.message ?? err);
    isConfigured = false;
  }
}

// ── Products / Offerings ───────────────────────────────────────────────────────
export async function getOfferings() {
  try {
    if (!isConfigured) {
      console.error("[IAP] getOfferings called before RevenueCat was configured");
      return null;
    }

    console.log("[IAP] Fetching offerings...");
    const offerings = await Purchases.getOfferings();

    console.log("[IAP] Offerings response:", JSON.stringify({
      currentId: offerings.current?.identifier ?? "NONE",
      allIds: Object.keys(offerings.all),
      packages: offerings.current?.availablePackages?.map(p => ({
        id: p.identifier,
        product: p.product?.identifier,
        price: p.product?.priceString,
      })) ?? [],
    }, null, 2));

    if (!offerings.current) {
      console.warn("[IAP] No current offering found. Check RevenueCat dashboard.");
      console.warn("[IAP] Available offerings:", Object.keys(offerings.all));
    }

    return offerings.current;
  } catch (err: any) {
    console.error("[IAP] getOfferings error:", err?.message ?? err);
    console.error("[IAP] Error code:", err?.code);
    console.error("[IAP] Full error:", JSON.stringify(err));
    return null;
  }
}

// ── Purchase ───────────────────────────────────────────────────────────────────
export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  try {
    console.log("[IAP] Purchasing package:", pkg.identifier, pkg.product?.identifier);
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    console.log("[IAP] Purchase successful. Active entitlements:", Object.keys(customerInfo?.entitlements?.active ?? {}));
    return customerInfo;
  } catch (err: any) {
    console.error("[IAP] Purchase error:", err?.message ?? err);
    console.error("[IAP] Error code:", err?.code);
    console.error("[IAP] User cancelled:", err?.userCancelled);
    throw err;
  }
}

// ── Restore ────────────────────────────────────────────────────────────────────
export async function restorePurchases(): Promise<CustomerInfo> {
  try {
    console.log("[IAP] Restoring purchases...");
    const customerInfo = await Purchases.restorePurchases();
    console.log("[IAP] Restore complete. Active entitlements:", Object.keys(customerInfo?.entitlements?.active ?? {}));
    return customerInfo;
  } catch (err: any) {
    console.error("[IAP] Restore error:", err?.message ?? err);
    console.error("[IAP] Error code:", err?.code);
    throw err;
  }
}

// ── Status ─────────────────────────────────────────────────────────────────────
export async function getCustomerInfo(): Promise<CustomerInfo> {
  try {
    if (!isConfigured) {
      console.error("[IAP] getCustomerInfo called before RevenueCat was configured");
      throw new Error("RevenueCat not configured");
    }

    const info = await Purchases.getCustomerInfo();
    console.log("[IAP] Customer info:", JSON.stringify({
      id: info?.originalAppUserId,
      activeEntitlements: Object.keys(info?.entitlements?.active ?? {}),
      allEntitlements: Object.keys(info?.entitlements?.all ?? {}),
      isPremium: ENTITLEMENT_ID in (info?.entitlements?.active ?? {}),
    }));
    return info;
  } catch (err: any) {
    console.error("[IAP] getCustomerInfo error:", err?.message ?? err);
    console.error("[IAP] Error code:", err?.code);
    throw err;
  }
}

export function isPremium(customerInfo: CustomerInfo): boolean {
  const result = ENTITLEMENT_ID in (customerInfo?.entitlements?.active ?? {});
  console.log("[IAP] isPremium check:", result, "| Looking for:", ENTITLEMENT_ID, "| Active:", Object.keys(customerInfo?.entitlements?.active ?? {}));
  return result;
}
