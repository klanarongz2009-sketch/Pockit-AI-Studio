export const getPermissionState = (): NotificationPermission => {
  if (!('Notification' in window)) {
    return 'denied'; // Treat as denied if not supported
  }
  return Notification.permission;
};

export const requestPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return await Notification.requestPermission();
};

export const showNotification = (title: string, options: NotificationOptions) => {
  if (getPermissionState() === 'granted' && 'serviceWorker' in navigator && navigator.serviceWorker.ready) {
    navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
            ...options,
            icon: '/assets/icon-192.png' // Standard icon
        });
    });
  }
};
