import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import type { User } from 'firebase/auth';
import { app } from './app';

const VAPID_KEY =
  'BP8uRehVxC-bWBbhrmcSoyT50fbciP9GvYnneYXeBWKgwWj1WeXkQn2FqoQmRkgu7aes40gERZxyKL-AuruB1EU';

export async function enableManagerPush(user: User): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  if (!('serviceWorker' in navigator)) return false;
  if (!window.isSecureContext) return false;

  const permission = await Notification.requestPermission();

  if (permission !== 'granted') {
    return false;
  }

  const registration = await navigator.serviceWorker.register(
    '/firebase-messaging-sw.js',
    { scope: '/' }
  );

  const messaging = getMessaging(app);

  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    return false;
  }

  const idToken = await user.getIdToken();

  const response = await fetch('/api/push/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    throw new Error(`Push registration failed: ${response.status}`);
  }

  return true;
}

export function listenForForegroundPush(
  callback: (payload: unknown) => void
) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  if (!('Notification' in window)) {
    return () => {};
  }

  return onMessage(getMessaging(app), callback);
}
