# Security Specification — Chez Bineta Firestore Rules

## 1. Data Invariants

1. **Orders Data Invariant:**
   - Any client may submit a new order (`create`) provided it adheres strictly to required keys: `id`, `orderNumber`, `numericId`, `customerName`, `phone`, `mode`, `items`, `total`, `paymentMethod`, `status`, `createdAt`.
   - The initial status of any created order MUST strictly be `'received'`.
   - Payment method MUST be strictly `'cash'` (no online payment or arbitrary values).
   - Only authenticated administrators (or Bineta) can transition order states (`update`), accept, refuse, or change status to `'preparing'`, `'ready'`, `'delivering'`, `'completed'`, `'cancelled'`.
   - Only authenticated administrators can delete orders (`delete`).
   - Customers may read orders by ID or query their orders, but unauthorized users cannot modify another's order or overwrite existing order totals.

2. **Catalog / Products Invariant:**
   - Products are public read-only for clients (`allow read: if true;`).
   - Only authenticated admins can write (create, update, delete) products.
   - Prices cannot be tampered with by clients on order creation; frontend and rules enforce that product prices match official catalog items.

3. **Reservations Invariant:**
   - Clients can submit reservations with status `'pending'`.
   - Only authenticated admins can update reservation status (`accepted`, `refused`) or delete reservations.

4. **Store Status Invariant:**
   - Public read-only for clients so they know if the restaurant is open or in Sunday reservation mode.
   - Only authenticated admins can update store status.

5. **Admin Invariant:**
   - Access to `/admins/{uid}` is restricted to authenticated users matching their own document or verified email.
   - Admin bootstrap includes the project authorized user: `evansshelby465@gmail.com`.

---

## 2. The "Dirty Dozen" Payloads

1. **Payload 1 (Price Tampering / Denial of Payment):** Order created with `total: -500` or `total: 0`.
2. **Payload 2 (Status Escalation on Create):** Customer tries to create order directly as `status: 'completed'` instead of `'received'`.
3. **Payload 3 (Arbitrary Payment Injection):** Customer tries `paymentMethod: 'credit_card'` or `paymentMethod: 'bypass'`.
4. **Payload 4 (Client Modifying Order Total / Items after creation):** Unauthenticated or regular user tries to update `total` or `items` on `/orders/CB-1042`.
5. **Payload 5 (Client Product Modification):** Unauthenticated client attempts to update `/products/fataya` to `price: 1`.
6. **Payload 6 (Client Deleting Orders):** Regular client attempts `delete` on `/orders/CB-1042`.
7. **Payload 7 (Junk Character Document ID Injection):** Attacker tries to write with 2KB string ID or malicious regex symbols.
8. **Payload 8 (Reservation Status Hijacking):** Client creates reservation with `status: 'accepted'`.
9. **Payload 9 (Ghost / Shadow Fields):** Order payload includes malicious shadow fields like `isAdmin: true` or `discount: 100%`.
10. **Payload 10 (Store Status Sabotage):** Anonymous client attempts to set `isOpen: false` on `/storeStatus/status`.
11. **Payload 11 (Admin Document Self-Creation):** Attacker attempts to create `/admins/attackerUid` to grant themselves administrative privilege.
12. **Payload 12 (Unauthorized Client Query Scraping of Admin Data):** Unauthenticated client attempts to list `/admins`.

All of these malicious payloads are rejected by the Firestore rules.
