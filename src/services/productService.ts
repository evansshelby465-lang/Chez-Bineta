import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { Product } from '../types';
import { INITIAL_PRODUCTS } from '../data/initialCatalog';

const COLLECTION_NAME = 'products';

// Auto-seed initial catalog into Firestore if collection is empty
export async function seedInitialProductsIfNeeded(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, COLLECTION_NAME));
    if (snap.empty) {
      console.log('Seeding initial official catalog to Firestore...');
      for (const prod of INITIAL_PRODUCTS) {
        const sanitizedPrice = prod.id === 'fataya' ? 100 : prod.price;
        await setDoc(doc(db, COLLECTION_NAME, prod.id), {
          ...prod,
          price: sanitizedPrice,
        });
      }
    } else {
      // Sync official images if they still have placeholder or old names
      for (const prod of INITIAL_PRODUCTS) {
        const existing = snap.docs.find(d => d.id === prod.id);
        if (existing) {
          const data = existing.data() as Product;
          if (!data.imageUrl || data.imageUrl.startsWith('/file_0000')) {
            await updateDoc(doc(db, COLLECTION_NAME, prod.id), {
              imageUrl: prod.imageUrl,
            }).catch(() => {});
          }
        }
      }
    }
  } catch (error) {
    console.warn('Seeding check warning:', error);
  }
}

// Subscribe to real-time products catalog
export function subscribeToProducts(
  onData: (products: Product[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(collection(db, COLLECTION_NAME), orderBy('order', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        onData(INITIAL_PRODUCTS);
        seedInitialProductsIfNeeded();
        return;
      }
      const products: Product[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Product;
        // Strict guard: Fataya MUST never be tampered with
        if (docSnap.id === 'fataya') {
          data.price = 100;
        }
        // If it was still pointing to old file_00000..., use local image
        const localProd = INITIAL_PRODUCTS.find(p => p.id === docSnap.id);
        if (localProd && (!data.imageUrl || data.imageUrl.startsWith('/file_0000'))) {
          data.imageUrl = localProd.imageUrl;
        }

        products.push({
          ...data,
          id: docSnap.id,
        });
      });
      onData(products);
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

// Fetch official catalog snapshot for server-style price validation
export async function getOfficialCatalogMap(): Promise<Map<string, Product>> {
  const map = new Map<string, Product>();
  try {
    const snap = await getDocs(collection(db, COLLECTION_NAME));
    if (!snap.empty) {
      snap.forEach((d) => {
        const item = d.data() as Product;
        if (d.id === 'fataya') item.price = 100;
        map.set(d.id, { ...item, id: d.id });
      });
      return map;
    }
  } catch (error) {
    console.warn('Could not read from remote catalog, using verified initial catalog:', error);
  }

  // Fallback to static verified catalog
  for (const p of INITIAL_PRODUCTS) {
    map.set(p.id, p);
  }
  return map;
}

export async function updateProduct(productId: string, updates: Partial<Product>): Promise<void> {
  const path = `${COLLECTION_NAME}/${productId}`;
  try {
    // Prevent anyone from changing Fataya to anything other than 100 FCFA
    if (productId === 'fataya' && updates.price !== undefined) {
      updates.price = 100;
    }
    await updateDoc(doc(db, COLLECTION_NAME, productId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleProductAvailability(productId: string, isAvailable: boolean): Promise<void> {
  const path = `${COLLECTION_NAME}/${productId}`;
  try {
    await updateDoc(doc(db, COLLECTION_NAME, productId), { isAvailable });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function addProduct(product: Product): Promise<void> {
  const path = `${COLLECTION_NAME}/${product.id}`;
  try {
    await setDoc(doc(db, COLLECTION_NAME, product.id), product);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  const path = `${COLLECTION_NAME}/${productId}`;
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
