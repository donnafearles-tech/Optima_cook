// src/ai/genkit.ts
import 'server-only';
import { genkit } from 'genkit';
import { vertexAI } from '@genkit-ai/vertexai';

const projectId = process.env.GCLOUD_PROJECT;

if (!projectId) {
  throw new Error(
    "❌ ERROR CRÍTICO: No se encontró la variable de entorno GCLOUD_PROJECT. " +
    "Asegúrate de que esté definida en tu configuración."
  );
}

// Verifica si la aplicación se está ejecutando dentro de un entorno de Google Cloud.
const isRunningInGoogleCloud = !!process.env.K_SERVICE || !!process.env.GAE_SERVICE;

// Solo realiza la verificación de credenciales si NO estamos en un entorno de Google Cloud.
if (!isRunningInGoogleCloud) {
  // En desarrollo, las credenciales se buscan en el entorno local.
  // GOOGLE_APPLICATION_CREDENTIALS se usa para service accounts.
  // GCLOUD_AUTH_IMPERSONATED_SERVICE_ACCOUNT se usa para personificación.
  // Si ninguna de estas está definida, la aplicación depende de "Application Default Credentials".
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GCLOUD_AUTH_IMPERSONATED_SERVICE_ACCOUNT) {
      console.warn(
        '🟡 ADVERTENCIA DE DESARROLLO LOCAL: No se encontraron credenciales de cuenta de servicio. ' +
        'La aplicación intentará usar las Credenciales de Aplicación por Defecto (ADC). ' +
        'Si la autenticación falla, ejecuta `gcloud auth application-default login` en tu terminal.'
      );
  }
}

export const ai = genkit({
  plugins: [
    vertexAI({
      projectId: projectId, // Usamos la variable ya validada
      location: 'us-central1', 
    }),
  ],
  enableTracingAndMetrics: true, 
});
