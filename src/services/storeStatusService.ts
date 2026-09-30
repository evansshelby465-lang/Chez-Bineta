import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { StoreStatus } from '../types';
import { INITIAL_STORE_STATUS } from '../data/initialCatalog';

const DOC_PATH = 'storeStatus/status';

export function subscribeToStoreStatus(
  onData: (status: StoreStatus) => void,
  onError?: (err: Error) => void
): () => void {
  return onSnapshot(
    doc(db, 'storeStatus', 'status'),
    (snap) => {
      if (!snap.exists()) {
        onData(INITIAL_STORE_STATUS);
        // Seed default status doc
        setDoc(doc(db, 'storeStatus', 'status'), INITIAL_STORE_STATUS).catch(() => {});
        return;
      }
      onData(snap.data() as StoreStatus);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, DOC_PATH);
      } catch (err) {
        if (onError && err instanceof Error) onError(err);
      }
    }
  );
}

export async function updateStoreStatus(status: Partial<StoreStatus>): Promise<void> {
  try {
    await setDoc(
      doc(db, 'storeStatus', 'status'),
      {
        ...status,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, DOC_PATH);
  }
}
