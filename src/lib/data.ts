'use client';
import type { Project, Task } from './types';
import {
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase';
import {
  collection,
  doc,
  writeBatch,
  Firestore,
  setDoc,
} from 'firebase/firestore';

export const saveProject = async (
  db: Firestore,
  userId: string,
  project: Project
): Promise<void> => {
  if (!userId) return;
  const projectRef = doc(db, 'users', userId, 'projects', project.id);
  await setDoc(projectRef, project, { merge: true });
};

export const createProject = async (
  db: Firestore,
  userId: string,
  projectData: Omit<Project, 'id' | 'ownerId' | 'recipes' | 'tasks'>
): Promise<Project> => {
  if (!userId) throw new Error('User not authenticated');
  const projectRef = doc(collection(db, 'users', userId, 'projects'));
  const newProject: Project = {
    id: projectRef.id,
    ownerId: userId,
    recipes: [],
    tasks: [],
    ...projectData,
  };
  await setDoc(projectRef, newProject, { merge: true });
  return newProject;
};

export const deleteProject = (
  db: Firestore,
  userId: string,
  projectId: string
): void => {
  if (!userId) return;
  const projectRef = doc(db, 'users', userId, 'projects', projectId);
  deleteDocumentNonBlocking(projectRef);
};

export const saveTasks = (
  db: Firestore,
  userId: string,
  projectId: string,
  tasks: Task[]
): void => {
  if (!userId) return;
  const batch = writeBatch(db);
  tasks.forEach((task) => {
    const taskRef = doc(
      db,
      'users',
      userId,
      'projects',
      projectId,
      'tasks',
      task.id
    );
    batch.set(taskRef, task);
  });
  batch.commit();
};
