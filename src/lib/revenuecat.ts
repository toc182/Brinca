import Purchases from 'react-native-purchases';

const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? '';

/**
 * Initialize RevenueCat SDK.
 * Uses anonymous app user ID (UUID) — never email or child name.
 * Per privacy-and-data.md §6.2.
 */
export async function initRevenueCat(appUserId?: string) {
  if (!REVENUECAT_API_KEY) {
    if (__DEV__) console.log('[RevenueCat] No API key configured, skipping init');
    return;
  }

  Purchases.configure({
    apiKey: REVENUECAT_API_KEY,
    appUserID: appUserId,
  });
}

export async function getOfferings() {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings;
  } catch {
    return null;
  }
}
