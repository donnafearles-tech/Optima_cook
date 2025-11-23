
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

const isRunningInGoogleCloud = !!process.env.K_SERVICE || !!process.env.GAE_SERVICE;

if (!isRunningInGoogleCloud) {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GCLOUD_AUTH_IMPERSONATED_SERVICE_ACCOUNT) {
    // Check for ADC existence is complex, so we'll guide the user proactively.
    const guideMessage = `
    ================================================================================
    ❌ ERROR DE AUTENTICACIÓN LOCAL
    --------------------------------------------------------------------------------
    Tu entorno de desarrollo local no está autenticado con Google Cloud.
    Para usar las funciones de IA, necesitas iniciar sesión con tu cuenta de Google.

    --> SOLUCIÓN: Abre tu terminal y ejecuta el siguiente comando:

        gcloud auth application-default login

    Una vez que completes el inicio de sesión en el navegador, reinicia el servidor de desarrollo.
    ================================================================================
    `;

    // This custom error will be thrown if ADC are likely missing,
    // which will be caught by the try/catch in ai-actions.ts and displayed clearly.
    console.error(guideMessage);

    // We proceed, but Genkit will likely fail with a more cryptic auth error.
    // The console log above is the primary guidance.
     console.warn(
        '🟡 ADVERTENCIA DE DESARROLLO LOCAL: No se encontraron credenciales de cuenta de servicio. ' +
        'La aplicación intentará usar las Credenciales de Aplicación por Defecto (ADC). ' +
        'Si la autenticación falla, sigue la guía de la consola.'
      );
  }
}

export const ai = genkit({
  plugins: [
    vertexAI({
      projectId: projectId,
      location: 'us-central1', 
    }),
  ],
  enableTracingAndMetrics: true, 
});
