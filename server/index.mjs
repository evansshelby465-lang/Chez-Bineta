import express from 'express';
import admin from 'firebase-admin';

const app = express();
app.use(express.json());

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!serviceAccountJson) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_JSON est manquante');
  process.exit(1);
}

let serviceAccount;

try {
  serviceAccount = JSON.parse(serviceAccountJson);
} catch (error) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_JSON invalide');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

db.settings({
  databaseId: 'ai-studio-1baeb06d-009a-4e20-920c-673dfb42653a',
});

const messaging = admin.messaging();

app.get('/api/push/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'chez-bineta-push',
  });
});

app.post('/api/push/register', async (req, res) => {
  try {
    const authorization = req.headers.authorization || '';

    if (!authorization.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing authentication token',
      });
    }

    const idToken = authorization.slice(7);
    const decoded = await admin.auth().verifyIdToken(idToken);

    if (decoded.firebase?.sign_in_provider !== 'password') {
      return res.status(403).json({
        error: 'Manager account required',
      });
    }

    const token =
      typeof req.body?.token === 'string'
        ? req.body.token.trim()
        : '';

    if (!token) {
      return res.status(400).json({
        error: 'Missing FCM token',
      });
    }

    await db.collection('pushTokens').doc(decoded.uid).set(
      {
        uid: decoded.uid,
        token,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log(`✅ Token push enregistré pour ${decoded.uid}`);

    return res.json({ ok: true });
  } catch (error) {
    console.error('❌ Push registration error:', error);
    return res.status(500).json({
      error: 'Registration failed',
    });
  }
});

app.post('/api/push/unregister', async (req, res) => {
  try {
    const authorization = req.headers.authorization || '';

    if (!authorization.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing authentication token',
      });
    }

    const idToken = authorization.slice(7);
    const decoded = await admin.auth().verifyIdToken(idToken);

    await db.collection('pushTokens').doc(decoded.uid).delete();

    return res.json({ ok: true });
  } catch (error) {
    console.error('❌ Push unregister error:', error);
    return res.status(401).json({
      error: 'Unauthorized',
    });
  }
});

let knownReceivedOrders = new Set();

async function pollOrders() {
  try {
    const snapshot = await db
      .collection('orders')
      .where('status', '==', 'received')
      .get();

    const currentOrders = new Set(
      snapshot.docs.map((doc) => doc.id)
    );

    const newOrders = snapshot.docs.filter(
      (doc) => !knownReceivedOrders.has(doc.id)
    );

    knownReceivedOrders = currentOrders;

    if (newOrders.length === 0) {
      return;
    }

    const tokensSnapshot = await db
      .collection('pushTokens')
      .get();

    for (const orderDoc of newOrders) {
      const order = orderDoc.data();

      for (const tokenDoc of tokensSnapshot.docs) {
        const tokenData = tokenDoc.data();
        const token = tokenData.token;

        if (!token) continue;

        try {
          await messaging.send({
            token,
            notification: {
              title: `🔔 Nouvelle commande ${order.orderNumber || orderDoc.id}`,
              body: `${order.customerName || 'Un client'} • ${Number(
                order.total || 0
              ).toLocaleString('fr-FR')} FCFA`,
            },
            data: {
              orderNumber: String(
                order.orderNumber || orderDoc.id
              ),
            },
            webpush: {
              notification: {
                icon: '/file_00000000276c81f482bf0792c3794c7b.png',
                badge: '/file_00000000276c81f482bf0792c3794c7b.png',
                vibrate: [300, 100, 300, 100, 400],
              },
            },
          });

          console.log(
            `📨 Notification envoyée pour ${order.orderNumber || orderDoc.id}`
          );
        } catch (error) {
          const code = error?.code || '';

          if (
            code.includes('registration-token-not-registered') ||
            code.includes('invalid-registration-token')
          ) {
            await tokenDoc.ref.delete();
            console.log('🧹 Token FCM invalide supprimé');
          } else {
            console.error('❌ FCM send error:', code || error);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Order polling error:', error);
  }
}

setInterval(pollOrders, 5000);
pollOrders();

const dist = new URL('../dist', import.meta.url).pathname;

app.use(express.static(dist));

app.get('*', (_req, res) => {
  res.sendFile(`${dist}/index.html`);
});

const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  console.log(
    `🚀 Chez Bineta Push Server démarré sur le port ${port}`
  );
});
