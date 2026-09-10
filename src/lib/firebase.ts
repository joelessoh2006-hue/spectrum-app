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
import { TimeBlock, Project } from '../types';

/**
 * Configuration Firebase fournie pour le projet Spectrum
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

// Initialisation de l'instance Firebase (Singleton)
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

// Noms des collections Cloud Firestore
export const TIME_BLOCKS_COLLECTION = 'time_blocks';
export const PROJECTS_COLLECTION = 'projects';

/**
 * Écoute temps réel des blocs de temps (Agenda & Fiche d'activité) via onSnapshot
 */
export function subscribeToTimeBlocks(
  onSuccess: (blocks: TimeBlock[], isFirstSnapshot: boolean) => void,
  onError?: (error: Error) => void
): () => void {
  const blocksCol = collection(db, TIME_BLOCKS_COLLECTION);
  let isFirst = true;

  return onSnapshot(
    blocksCol,
    (snapshot) => {
      const blocks: TimeBlock[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        blocks.push({
          ...(data as TimeBlock),
          id: docSnap.id,
        });
      });
      // Tri chronologique par minute de début de journée
      blocks.sort((a, b) => (a.startMinutes || 0) - (b.startMinutes || 0));
      onSuccess(blocks, isFirst);
      isFirst = false;
    },
    (err) => {
      console.warn('Firestore onSnapshot error (time_blocks):', err);
      onError?.(err);
    }
  );
}

/**
 * Écoute temps réel des projets Bento Grid via onSnapshot
 */
export function subscribeToProjects(
  onSuccess: (projects: Project[], isFirstSnapshot: boolean) => void,
  onError?: (error: Error) => void
): () => void {
  const projectsCol = collection(db, PROJECTS_COLLECTION);
  let isFirst = true;

  return onSnapshot(
    projectsCol,
    (snapshot) => {
      const projects: Project[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        projects.push({
          ...(data as Project),
          id: docSnap.id,
        });
      });
      onSuccess(projects, isFirst);
      isFirst = false;
    },
    (err) => {
      console.warn('Firestore onSnapshot error (projects):', err);
      onError?.(err);
    }
  );
}

/**
 * Enregistrement ou mise à jour d'un bloc de temps dans Cloud Firestore via setDoc
 */
export async function saveTimeBlock(block: TimeBlock): Promise<void> {
  const docRef = doc(db, TIME_BLOCKS_COLLECTION, block.id);
  await setDoc(docRef, block, { merge: true });
}

/**
 * Suppression d'un bloc de temps dans Cloud Firestore via deleteDoc
 */
export async function deleteTimeBlock(blockId: string): Promise<void> {
  const docRef = doc(db, TIME_BLOCKS_COLLECTION, blockId);
  await deleteDoc(docRef);
}

/**
 * Enregistrement ou mise à jour d'un projet Bento Grid dans Cloud Firestore via setDoc
 */
export async function saveProject(project: Project): Promise<void> {
  const docRef = doc(db, PROJECTS_COLLECTION, project.id);
  await setDoc(docRef, project, { merge: true });
}

/**
 * Suppression d'un projet dans Cloud Firestore via deleteDoc
 */
export async function deleteProject(projectId: string): Promise<void> {
  const docRef = doc(db, PROJECTS_COLLECTION, projectId);
  await deleteDoc(docRef);
}

/**
 * Synchronisation par lot (writeBatch) des données modèles dans Cloud Firestore
 */
export async function seedTemplatesToFirestore(
  blocks: TimeBlock[],
  projects: Project[]
): Promise<void> {
  const batch = writeBatch(db);
  for (const block of blocks) {
    const ref = doc(db, TIME_BLOCKS_COLLECTION, block.id);
    batch.set(ref, block);
  }
  for (const proj of projects) {
    const ref = doc(db, PROJECTS_COLLECTION, proj.id);
    batch.set(ref, proj);
  }
  await batch.commit();
}

/**
 * Vidage par lot des blocs dans Cloud Firestore
 */
export async function clearAllBlocksFromFirestore(blocks: TimeBlock[]): Promise<void> {
  if (blocks.length === 0) return;
  const batch = writeBatch(db);
  for (const b of blocks) {
    const ref = doc(db, TIME_BLOCKS_COLLECTION, b.id);
    batch.delete(ref);
  }
  await batch.commit();
}
