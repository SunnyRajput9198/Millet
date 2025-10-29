/**
 * Utility to refresh the cart count in the header
 * Call this after adding/removing items from cart
 */
export const refreshHeaderCartCount = () => {
  if (typeof window !== 'undefined' && (window as any).refreshCartCount) {
    (window as any).refreshCartCount()
  }
}

/**
 * Utility to refresh notification count in the header
 * Call this after marking notifications as read
 */
export const refreshHeaderNotificationCount = () => {
  if (typeof window !== 'undefined' && (window as any).refreshNotificationCount) {
    (window as any).refreshNotificationCount()
  }
}