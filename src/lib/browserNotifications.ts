// Thin wrapper around the Notification Web API. Unlike the phone app's
// expo-notifications, the browser has no OS-level scheduler: a notification
// only fires if this tab is open at the moment it comes due (see
// useBrowserNotifications.ts, which polls for due tasks instead).

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getPermission(): NotificationPermission {
  return notificationsSupported() ? Notification.permission : "denied";
}

export async function requestPermission(): Promise<boolean> {
  if (!notificationsSupported()) {
    return false;
  }
  if (Notification.permission === "granted") {
    return true;
  }
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function showNotification(title: string, body: string): void {
  if (!(notificationsSupported() && Notification.permission === "granted")) {
    return;
  }
  new Notification(title, { body });
}
