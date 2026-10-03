importScripts(
  'https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js'
);

firebase.initializeApp({
  apiKey: 'AIzaSyBmPYTWwYjyBQ53HiyFucw4npMKMdjKAaU',
  authDomain: 'gen-lang-client-0856387296.firebaseapp.com',
  projectId: 'gen-lang-client-0856387296',
  storageBucket: 'gen-lang-client-0856387296.firebasestorage.app',
  messagingSenderId: '87719901039',
  appId: '1:87719901039:web:060c264b83cf9225ce5a9a',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  const data = payload.data || {};

  const title =
    notification.title || '🔔 Chez Bineta';

  const body =
    notification.body ||
    'Nouvelle activité sur votre terminal.';

  self.registration.showNotification(title, {
    body,
    icon: '/file_00000000276c81f482bf0792c3794c7b.png',
    badge: '/file_00000000276c81f482bf0792c3794c7b.png',
    vibrate: [300, 100, 300, 100, 400],
    tag: data.orderNumber || 'chez-bineta-push',
    data: {
      url: '/',
    },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus();
          }
        }

        return clients.openWindow('/');
      })
  );
});
