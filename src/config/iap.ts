import {Platform} from 'react-native';

// Product ID — must match the one configured in Google Play Console / App Store Connect
export const PREMIUM_PRODUCT_ID = 'com.tenframes.premium_unlock';

export const productIds = Platform.select({
  android: [PREMIUM_PRODUCT_ID],
  ios: [PREMIUM_PRODUCT_ID],
  default: [],
}) as string[];
