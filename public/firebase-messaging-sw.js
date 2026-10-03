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
