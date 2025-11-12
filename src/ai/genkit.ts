import { genkit, configureGenkit } from 'genkit';
import { vertexAI } from '@genkit-ai/vertexai';

// Este es el único lugar donde se inicializa Genkit.
// NO es necesario agregar lógica de producción/desarrollo aquí.

configureGenkit({
  plugins: [
    vertexAI({
      projectId: 'studio-99491860-5533f',
      location: 'us-central1',
    }),
  ],
  // Habilita el logging para un mejor debugging.
  // Esto puede ser útil para rastrear el flujo de datos.
  logLevel: 'debug',
  // La telemetría se gestionará automáticamente en producción.
  enableTracingAndMetrics: true,
});

export { genkit as ai };
