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

export const ai = genkit({
  plugins: [
    vertexAI({
      // Ahora usamos la variable limpia, sin comillas manuales
      projectId: process.env.GCLOUD_PROJECT, // Debe leer la variable, 
      location: 'us-central1', 
    }),
  ],
  enableTracingAndMetrics: true, 
});
