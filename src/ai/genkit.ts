import { genkit } from 'genkit';
import { vertexAI } from '@genkit-ai/vertexai';

// No necesitas 'SecretManagerServiceClient'
// No necesitas 'SECRET_RESOURCE_NAME'
// No necesitas la función 'getServiceAccount()'
// No necesitas el 'if (isProd)' ni el 'else'

const configureAi = async () => {
  // Genkit y VertexAI usarán ADC automáticamente.
  // 1. En App Hosting (producción), usará la cuenta de servicio del runtime.
  // 2. En tu máquina (local), usará la variable de entorno.
  return genkit({
    plugins: [
      vertexAI({
        projectId: 'studio-99491860-5533f',
        location: 'global',
        // NO pases el 'serviceAccount' aquí.
        // Al omitirlo, el SDK buscará las credenciales automáticamente.
      }),
    ],
  });
};

// Exporta la promesa como ya lo estás haciendo
export const ai = configureAi();
