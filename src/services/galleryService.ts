import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, User } from '../lib/firebase';
import { UserProfile, GalleryFolder, GalleryPhoto } from '../types';

/**
 * Optimizes an image data URL for Firestore storage (1MB limit).
 * Generates an optimized preview image (<= 1200px) and a lightweight thumbnail (<= 320px).
 */
export async function optimizeForGallery(
  dataUrl: string
): Promise<{ imageUrl: string; thumbnailUrl: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const origW = img.naturalWidth || img.width;
      const origH = img.naturalHeight || img.height;

      // 1. High quality gallery image (max 1280px)
      const maxDim = 1280;
      let targetW = origW;
      let targetH = origH;
      if (origW > maxDim || origH > maxDim) {
        if (origW > origH) {
          targetW = maxDim;
          targetH = Math.round((origH * maxDim) / origW);
        } else {
          targetH = maxDim;
          targetW = Math.round((origW * maxDim) / origH);
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, targetW, targetH);
      }
      let optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

      // If jpeg is still large (> 650KB), decrease quality slightly
      if (optimizedDataUrl.length > 650000) {
        optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.72);
      }

      // 2. Thumbnail (max 320px)
      const thumbMax = 320;
      let thumbW = origW;
      let thumbH = origH;
      if (origW > thumbMax || origH > thumbMax) {
        if (origW > thumbH) {
          thumbW = thumbMax;
          thumbH = Math.round((origH * thumbMax) / origW);
        } else {
          thumbH = thumbMax;
          thumbW = Math.round((origW * thumbMax) / origH);
        }
      }

      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = thumbW;
      thumbCanvas.height = thumbH;
      const thumbCtx = thumbCanvas.getContext('2d');
      if (thumbCtx) {
        thumbCtx.drawImage(img, 0, 0, thumbW, thumbH);
      }
      const thumbDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.75);

      resolve({
        imageUrl: optimizedDataUrl,
        thumbnailUrl: thumbDataUrl,
      });
    };
    img.onerror = () => {
      // Fallback
      resolve({ imageUrl: dataUrl, thumbnailUrl: dataUrl });
    };
    img.src = dataUrl;
  });
}

/**
 * Fetch or initialize a user's profile upon sign-in
 */
export async function syncUserProfile(user: User): Promise<UserProfile> {
  const path = `users/${user.uid}`;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      return snap.data() as UserProfile;
    }

    // Initialize new profile
    const newProfile = {
      id: user.uid,
      email: user.email || 'creator@example.com',
      displayName: user.displayName || 'AI Creator',
      photoURL: user.photoURL || '',
      bio: 'Digital artist & AI photographer',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userDocRef, newProfile);

    // Also initialize a default folder "Favorites" and "Masterpieces"
    try {
      const defaultFolderRef = doc(db, 'users', user.uid, 'folders', 'favorites');
      await setDoc(defaultFolderRef, {
        id: 'favorites',
        userId: user.uid,
        name: 'Favorites',
        color: '#f59e0b',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Could not create default folder:', e);
    }

    return {
      id: user.uid,
      email: user.email || 'creator@example.com',
      displayName: user.displayName || 'AI Creator',
      photoURL: user.photoURL || '',
      bio: 'Digital artist & AI photographer',
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Update user profile details (displayName, photoURL, bio)
 */
export async function updateUserProfile(
  userId: string,
  updates: { displayName?: string; photoURL?: string; bio?: string }
): Promise<void> {
  const path = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    const cleanUpdates: any = {
      updatedAt: serverTimestamp(),
    };
    if (updates.displayName !== undefined) cleanUpdates.displayName = updates.displayName.slice(0, 100);
    if (updates.photoURL !== undefined) cleanUpdates.photoURL = updates.photoURL.slice(0, 500);
    if (updates.bio !== undefined) cleanUpdates.bio = updates.bio.slice(0, 500);

    await updateDoc(userDocRef, cleanUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Subscribe to the user's folders
 */
export function subscribeToFolders(
  userId: string,
  onData: (folders: GalleryFolder[]) => void,
  onError?: (err: any) => void
): () => void {
  const path = `users/${userId}/folders`;
  try {
    const colRef = collection(db, 'users', userId, 'folders');
    const q = query(colRef, orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const folders = snapshot.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        })) as GalleryFolder[];
        onData(folders);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Create a new folder to organize gallery images
 */
export async function createGalleryFolder(
  userId: string,
  name: string,
  color: string = '#6366f1'
): Promise<string> {
  const folderId = `folder_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `users/${userId}/folders/${folderId}`;
  try {
    const folderDoc = doc(db, 'users', userId, 'folders', folderId);
    await setDoc(folderDoc, {
      id: folderId,
      userId,
      name: name.trim().slice(0, 50),
      color,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return folderId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Delete a folder
 */
export async function deleteGalleryFolder(userId: string, folderId: string): Promise<void> {
  const path = `users/${userId}/folders/${folderId}`;
  try {
    const folderDoc = doc(db, 'users', userId, 'folders', folderId);
    await deleteDoc(folderDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Subscribe to the user's personal gallery photos
 */
export function subscribeToPhotos(
  userId: string,
  onData: (photos: GalleryPhoto[]) => void,
  onError?: (err: any) => void
): () => void {
  const path = `users/${userId}/photos`;
  try {
    const colRef = collection(db, 'users', userId, 'photos');
    const q = query(colRef, orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const photos = snapshot.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        })) as GalleryPhoto[];
        onData(photos);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Save an edited photo to the personal gallery
 */
export async function savePhotoToGallery(
  userId: string,
  photoData: {
    title: string;
    imageUrl: string;
    folderId?: string;
    favorite?: boolean;
    tags?: string[];
    prompt?: string;
    presetName?: string;
    category?: string;
  }
): Promise<string> {
  const photoId = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `users/${userId}/photos/${photoId}`;

  try {
    // Compress/optimize image for Firestore
    const { imageUrl, thumbnailUrl } = await optimizeForGallery(photoData.imageUrl);

    const docPayload: any = {
      id: photoId,
      userId,
      title: (photoData.title || 'Untitled Edit').slice(0, 100),
      imageUrl: imageUrl.slice(0, 800000),
      thumbnailUrl: thumbnailUrl.slice(0, 200000),
      favorite: Boolean(photoData.favorite),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (photoData.folderId) {
      docPayload.folderId = photoData.folderId.slice(0, 128);
    }
    if (photoData.tags && Array.isArray(photoData.tags)) {
      docPayload.tags = photoData.tags.slice(0, 10).map((t) => t.slice(0, 30));
    }
    if (photoData.prompt) {
      docPayload.prompt = photoData.prompt.slice(0, 1000);
    }
    if (photoData.presetName) {
      docPayload.presetName = photoData.presetName.slice(0, 100);
    }
    if (photoData.category) {
      docPayload.category = photoData.category.slice(0, 50);
    }

    const photoDoc = doc(db, 'users', userId, 'photos', photoId);
    await setDoc(photoDoc, docPayload);
    return photoId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Delete a saved photo from personal gallery
 */
export async function deletePhotoFromGallery(userId: string, photoId: string): Promise<void> {
  const path = `users/${userId}/photos/${photoId}`;
  try {
    const photoDoc = doc(db, 'users', userId, 'photos', photoId);
    await deleteDoc(photoDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Update photo attributes (title, favorite, folderId, tags)
 */
export async function updateGalleryPhoto(
  userId: string,
  photoId: string,
  updates: {
    title?: string;
    favorite?: boolean;
    folderId?: string;
    tags?: string[];
  }
): Promise<void> {
  const path = `users/${userId}/photos/${photoId}`;
  try {
    const photoDoc = doc(db, 'users', userId, 'photos', photoId);
    const cleanUpdates: any = {
      updatedAt: serverTimestamp(),
    };

    if (updates.title !== undefined) cleanUpdates.title = updates.title.slice(0, 100);
    if (updates.favorite !== undefined) cleanUpdates.favorite = Boolean(updates.favorite);
    if (updates.folderId !== undefined) cleanUpdates.folderId = updates.folderId.slice(0, 128);
    if (updates.tags !== undefined) {
      cleanUpdates.tags = updates.tags.slice(0, 10).map((t) => t.slice(0, 30));
    }

    await updateDoc(photoDoc, cleanUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
