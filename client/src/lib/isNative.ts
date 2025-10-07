export const isNative =
  (window as any)?.Capacitor?.isNativePlatform?.() === true;