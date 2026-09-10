import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
  signInAnonymously,
} from 'firebase/auth';
import { TimeBlock, Project } from '../types';

/**
 * Configuration Firebase officielle pour le projet Spectrum
 */
export const firebaseConfig = {
  apiKey: "AIzaSyBNMiV6wkjvxj8LXdNWXcfyUiaZ5gOqbLo",
  authDomain: "spectrum-d28e6.firebaseapp.com",
  projectId: "spectrum-d28e6",
  storageBucket: "spectrum-d28e6.firebasestorage.app",
  messagingSenderId: "732859661540",
  appId: "1:732859661540:web:8c6dd2d5171f95aab8c0f1",
  measurementId: "G-KB7THFN2VJ"
};

// Initialisation des instances Firebase (Singleton)
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);

// Provider Google Auth
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Type d'opérations Firestore pour le logging standardisé
 */
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ----------------------------------------------------------------------
// GESTION AUTHENTIFICATION (Google Sign-In)
// ----------------------------------------------------------------------

/**
 * Connexion avec Google via Popup
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: unknown) {
    console.error('Erreur Google Sign-In popup:', error);
    // Si popup bloqué ou restriction iframe, fournir une alternative propre
    throw error;
  }
}

/**
 * Connexion invité / anonyme (fallback si environnement iframe strict)
 */
export async function signInGuest(): Promise<User> {
  const result = await signInAnonymously(auth);
  return result.user;
}

/**
 * Déconnexion
 */
export async function signOutUser(): Promise<void> {
  await fbSignOut(auth);
}

/**
 * Écoute des changements d'état d'authentification
 */
export function onAuthUserChanged(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

// ----------------------------------------------------------------------
// CHEMINS FIRESTORE SCOPÉS PAR UTILISATEUR : users/{userId}/timeblocks
// ----------------------------------------------------------------------

export function getUserTimeBlocksPath(userId: string): string {
  return `users/${userId}/timeblocks`;
}

export function getUserProjectsPath(userId: string): string {
  return `users/${userId}/projects`;
}

/**
 * Écoute temps réel des blocs de temps de l'utilisateur connecté
 * (users/{userId}/timeblocks)
 */
export function subscribeToUserTimeBlocks(
  userId: string,
  onSuccess: (blocks: TimeBlock[]) => void,
  onError?: (error: Error) => void
): () => void {
  const path = getUserTimeBlocksPath(userId);
  const colRef = collection(db, path);

  return onSnapshot(
    colRef,
    (snapshot) => {
      const blocks: TimeBlock[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        blocks.push({
          ...(data as TimeBlock),
          id: docSnap.id,
        });
      });
      // Tri par startMinutes
      blocks.sort((a, b) => (a.startMinutes || 0) - (b.startMinutes || 0));
      onSuccess(blocks);
    },
    (err) => {
      console.warn(`Firestore onSnapshot error sur ${path}:`, err);
      onError?.(err);
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

/**
 * Écoute temps réel des projets Bento Grid de l'utilisateur connecté
 * (users/{userId}/projects)
 */
export function subscribeToUserProjects(
  userId: string,
  onSuccess: (projects: Project[]) => void,
  onError?: (error: Error) => void
): () => void {
  const path = getUserProjectsPath(userId);
  const colRef = collection(db, path);

  return onSnapshot(
    colRef,
    (snapshot) => {
      const projects: Project[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        projects.push({
          ...(data as Project),
          id: docSnap.id,
        });
      });
      onSuccess(projects);
    },
    (err) => {
      console.warn(`Firestore onSnapshot error sur ${path}:`, err);
      onError?.(err);
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

/**
 * Sauvegarde ou mise à jour d'un bloc de temps pour l'utilisateur
 */
export async function saveUserTimeBlock(userId: string, block: TimeBlock): Promise<void> {
  const path = `${getUserTimeBlocksPath(userId)}/${block.id}`;
  try {
    const docRef = doc(db, getUserTimeBlocksPath(userId), block.id);
    await setDoc(docRef, block, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Suppression d'un bloc de temps pour l'utilisateur
 */
export async function deleteUserTimeBlock(userId: string, blockId: string): Promise<void> {
  const path = `${getUserTimeBlocksPath(userId)}/${blockId}`;
  try {
    const docRef = doc(db, getUserTimeBlocksPath(userId), blockId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Sauvegarde ou mise à jour d'un projet pour l'utilisateur
 */
export async function saveUserProject(userId: string, project: Project): Promise<void> {
  const path = `${getUserProjectsPath(userId)}/${project.id}`;
  try {
    const docRef = doc(db, getUserProjectsPath(userId), project.id);
    await setDoc(docRef, project, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Suppression d'un projet pour l'utilisateur
 */
export async function deleteUserProject(userId: string, projectId: string): Promise<void> {
  const path = `${getUserProjectsPath(userId)}/${projectId}`;
  try {
    const docRef = doc(db, getUserProjectsPath(userId), projectId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Amorçage volontaire par l'utilisateur (Optionnel uniquement sur demande manuelle)
 */
export async function seedUserTemplates(
  userId: string,
  blocks: TimeBlock[],
  projects: Project[]
): Promise<void> {
  const batch = writeBatch(db);
  const timeblocksPath = getUserTimeBlocksPath(userId);
  const projectsPath = getUserProjectsPath(userId);

  for (const block of blocks) {
    const ref = doc(db, timeblocksPath, block.id);
    batch.set(ref, block);
  }
  for (const proj of projects) {
    const ref = doc(db, projectsPath, proj.id);
    batch.set(ref, proj);
  }

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${timeblocksPath} & ${projectsPath}`);
  }
}

/**
 * Vidage complet des blocs de temps pour l'utilisateur
 */
export async function clearUserTimeBlocks(userId: string, blocks: TimeBlock[]): Promise<void> {
  if (blocks.length === 0) return;
  const batch = writeBatch(db);
  const path = getUserTimeBlocksPath(userId);

  for (const b of blocks) {
    const ref = doc(db, path, b.id);
    batch.delete(ref);
  }

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
