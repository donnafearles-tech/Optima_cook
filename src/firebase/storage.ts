'use client';

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  FirebaseStorage,
} from 'firebase/storage';
import { useFirebaseApp } from '@/firebase/provider';

/**
 * Hook para obtener una instancia de Firebase Storage.
 * @returns {FirebaseStorage} Instancia de Firebase Storage.
 */
export function useStorage(): FirebaseStorage {
  const app = useFirebaseApp();
  return getStorage(app);
}

/**
 * Sube un archivo a Firebase Storage y devuelve la URL de descarga.
 * @param {FirebaseStorage} storage - Instancia de Firebase Storage.
 * @param {string} path - La ruta donde se guardará el archivo en el bucket.
 * @param {File} file - El archivo a subir.
 * @returns {Promise<string>} La URL de descarga pública del archivo.
 */
export async function uploadFileAndGetURL(
  storage: FirebaseStorage,
  path: string,
  file: File
): Promise<string> {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}
