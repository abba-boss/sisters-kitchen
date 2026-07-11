const PENDING_CHECKOUT_KEY = 'sk-pending-checkout';

export function savePendingCheckout({ orderIds, vendorId, clearAll }) {
  sessionStorage.setItem(
    PENDING_CHECKOUT_KEY,
    JSON.stringify({ orderIds, vendorId, clearAll })
  );
}

export function consumePendingCheckout() {
  const raw = sessionStorage.getItem(PENDING_CHECKOUT_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
