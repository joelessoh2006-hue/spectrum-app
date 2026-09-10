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
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { TimeBlock, Project, DomainConfig } from '../types';

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

// Configuration explicite de la persistance locale dans le navigateur
// pour conserver la session utilisateur à travers les rafraîchissements de page
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn('Configuration persistance Firebase Auth (browserLocalPersistence):', error);
});

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
 * Connexion avec Google via Popup avec persistance locale explicite
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: unknown) {
    console.error('Erreur Google Sign-In popup:', error);
    // Si popup bloqué ou restriction iframe, fournir une alternative propre
    throw error;
  }
}

/**
 * Connexion invité / anonyme avec persistance locale explicite
 */
export async function signInGuest(): Promise<User> {
  await setPersistence(auth, browserLocalPersistence);
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
 * Écoute des changements d'état d'authentification avec restauration automatique
 */
export function onAuthUserChanged(
  onUser: (user: User | null) => void,
  onError?: (error: Error) => void
): () => void {
  return onAuthStateChanged(auth, onUser, onError);
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

export function getUserCategoriesPath(userId: string): string {
  return `users/${userId}/categories`;
}

/**
 * Écoute temps réel des catégories / piliers personnalisés de l'utilisateur connecté
 * (users/{userId}/categories)
 */
export function subscribeToUserCategories(
  userId: string,
  onSuccess: (categories: DomainConfig[]) => void,
  onError?: (error: Error) => void
): () => void {
  const path = getUserCategoriesPath(userId);
  const colRef = collection(db, path);

  return onSnapshot(
    colRef,
    (snapshot) => {
      const categories: DomainConfig[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        categories.push({
          id: docSnap.id,
          name: data.name || docSnap.id,
          label: data.label || '',
          color: data.color || '#6C5CE7',
          colorSecondary: data.colorSecondary,
          bgRgba: data.bgRgba,
          borderRgba: data.borderRgba,
          iconName: data.iconName || 'Sparkles',
          description: data.description || '',
          order: data.order ?? 999,
          createdAt: data.createdAt,
        });
      });
      // Sort by order or name
      categories.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      onSuccess(categories);
    },
    (err) => {
      console.warn('Erreur écoute catégories Firestore:', err);
      onError?.(err as Error);
    }
  );
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
        const rawSubtasks = Array.isArray(data.subtasks) ? data.subtasks : [];
        const rawChecklist = Array.isArray(data.checklist) ? data.checklist : [];
        const subtasks = rawSubtasks.length > 0
          ? rawSubtasks
          : rawChecklist.map((c: { id: string; title: string; isCompleted?: boolean }) => ({
              id: c.id,
              text: c.title,
              completed: !!c.isCompleted,
            }));
        const checklist = rawChecklist.length > 0
          ? rawChecklist
          : subtasks.map((s: { id: string; text: string; completed?: boolean }) => ({
              id: s.id,
              title: s.text,
              isCompleted: !!s.completed,
            }));

        blocks.push({
          ...(data as TimeBlock),
          id: docSnap.id,
          subtasks,
          checklist,
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
    const subtasks = block.subtasks || (block.checklist || []).map((c) => ({
      id: c.id,
      text: c.title,
      completed: c.isCompleted,
    }));
    const checklist = block.checklist || subtasks.map((s) => ({
      id: s.id,
      title: s.text,
      isCompleted: s.completed,
    }));

    const dataToSave = {
      ...block,
      subtasks,
      checklist,
    };
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Sauvegarde par lot (batch) de multiples blocs de temps pour l'utilisateur
 */
export async function saveUserTimeBlocksBatch(userId: string, blocks: TimeBlock[]): Promise<void> {
  if (!blocks.length) return;
  const basePath = getUserTimeBlocksPath(userId);
  try {
    const CHUNK_SIZE = 400;
    for (let i = 0; i < blocks.length; i += CHUNK_SIZE) {
      const chunk = blocks.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const block of chunk) {
        const docRef = doc(db, basePath, block.id);
        const subtasks = block.subtasks || (block.checklist || []).map((c) => ({
          id: c.id,
          text: c.title,
          completed: c.isCompleted,
        }));
        const checklist = block.checklist || subtasks.map((s) => ({
          id: s.id,
          title: s.text,
          isCompleted: s.completed,
        }));

        const dataToSave = {
          ...block,
          subtasks,
          checklist,
        };
        batch.set(docRef, dataToSave, { merge: true });
      }
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, basePath);
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

/**
 * Sauvegarde ou mise à jour d'une catégorie / pilier dans Firestore
 */
export async function saveUserCategory(userId: string, category: DomainConfig): Promise<void> {
  const path = `${getUserCategoriesPath(userId)}/${category.id}`;
  try {
    const docRef = doc(db, getUserCategoriesPath(userId), category.id);
    const dataToSave = {
      id: category.id,
      name: category.name,
      label: category.label || '',
      color: category.color || '#6C5CE7',
      colorSecondary: category.colorSecondary || '',
      iconName: category.iconName || 'Sparkles',
      description: category.description || '',
      order: category.order ?? Date.now(),
      createdAt: category.createdAt || new Date().toISOString(),
    };
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Suppression d'une catégorie / pilier de l'utilisateur
 */
export async function deleteUserCategory(userId: string, categoryId: string): Promise<void> {
  const path = `${getUserCategoriesPath(userId)}/${categoryId}`;
  try {
    const docRef = doc(db, getUserCategoriesPath(userId), categoryId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Initialisation des piliers par défaut dans Firestore si la collection est vide
 */
export async function seedUserDefaultCategories(
  userId: string,
  categories?: DomainConfig[]
): Promise<void> {
  const batch = writeBatch(db);
  const path = getUserCategoriesPath(userId);

  const listToSeed = categories && categories.length > 0 ? categories : [
    {
      id: 'tech',
      name: 'Code & Architecture',
      label: 'Développement, Ingénierie & Systèmes',
      color: '#6C5CE7',
      colorSecondary: '#8172F5',
      iconName: 'Terminal',
      description: 'Développement de systèmes, architecture logicielle et Deep Work.',
      order: 0,
    },
    {
      id: 'art',
      name: 'Création & Musique',
      label: 'Design UI/UX, Beatmaking & Arts',
      color: '#FF7675',
      colorSecondary: '#FAB1A0',
      iconName: 'Flame',
      description: 'Production musicale, design visuel et flow créatif.',
      order: 1,
    },
    {
      id: 'strategy',
      name: 'Stratégie & Savoir',
      label: 'Veille, Business & Apprentissages',
      color: '#55E6C1',
      colorSecondary: '#81ECEC',
      iconName: 'Compass',
      description: 'Veille technologique, lecture, cadrage stratégique.',
      order: 2,
    },
  ];

  listToSeed.forEach((cat, index) => {
    const ref = doc(db, path, cat.id);
    batch.set(ref, {
      id: cat.id,
      name: cat.name,
      label: cat.label || '',
      color: cat.color,
      colorSecondary: cat.colorSecondary || '',
      iconName: cat.iconName,
      description: cat.description || '',
      order: cat.order ?? index,
      createdAt: new Date().toISOString(),
    });
  });

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

