// src/ai/genkit.ts
import 'server-only';
import { genkit } from 'genkit';
import { vertexAI } from '@genkit-ai/vertexai';

// 1. Leemos la variable del entorno
const projectId = process.env.GCLOUD_PROJECT;

// 2. Validación de Seguridad (Para que no compile si falta la variable)
if (!projectId) {
  throw new Error(
    "❌ ERROR CRÍTICO: No se encontró la variable GCLOUD_PROJECT. " +
    "Asegúrate de tenerla en tu archivo .env.local o en la configuración de tu servidor."
  );
}

// 3. Validación de Autenticación en Desarrollo
if (process.env.NODE_ENV === 'development' && !process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GCLOUD_AUTH_IMPERSONATED_SERVICE_ACCOUNT) {
    const isRunningInGoogleCloud = !!process.env.K_SERVICE;
    if (!isRunningInGoogleCloud) {
        throw new Error(
          '❌ ERROR DE AUTENTICACIÓN LOCAL: Las credenciales no se encontraron. ' +
          'Ejecuta `gcloud auth application-default login` en tu terminal para autenticarte y poder usar la IA en desarrollo.'
        );
    }
}


export const ai = genkit({
  plugins: [
    vertexAI({
      projectId: process.env.GCLOUD_PROJECT,
      location: 'us-central1', 
    }),
  ],
  enableTracingAndMetrics: true, 
});
