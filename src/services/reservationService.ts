import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { Reservation } from '../types';

const COLLECTION_NAME = 'reservations';

export async function createReservation(
  data: Omit<Reservation, 'id' | 'createdAt' | 'status'>
): Promise<Reservation> {
  const numericCode = Math.floor(1000 + Math.random() * 9000);
  const docId = `RES-${numericCode}`;
  const nowIso = new Date().toISOString();

  const reservation: Reservation = {
    ...data,
    id: docId,
    status: 'pending',
    createdAt: nowIso,
  };

  const path = `${COLLECTION_NAME}/${docId}`;
  try {
    await setDoc(doc(db, COLLECTION_NAME, docId), reservation);
    return reservation;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeToReservations(
  onData: (reservations: Reservation[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Reservation[] = [];
      snapshot.forEach((d) => {
        list.push({
          ...(d.data() as Reservation),
          id: d.id,
        });
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      } catch (err) {
        if (onError && err instanceof Error) onError(err);
      }
    }
  );
}

export async function updateReservationStatus(
  reservationId: string,
  status: 'pending' | 'accepted' | 'refused',
  rejectionReason?: string
): Promise<void> {
  const path = `${COLLECTION_NAME}/${reservationId}`;
  try {
    const updates: Partial<Reservation> = { status };
    if (rejectionReason !== undefined) {
      updates.rejectionReason = rejectionReason;
    }
    await updateDoc(doc(db, COLLECTION_NAME, reservationId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteReservation(reservationId: string): Promise<void> {
  const path = `${COLLECTION_NAME}/${reservationId}`;
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, reservationId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
