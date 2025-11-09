'use server';

import { genkit } from 'genkit';
import { vertexAI } from '@genkit-ai/vertexai';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

// This is the resource name of the secret in Google Cloud Secret Manager.
// It's defined in your apphosting.yaml file.
const SECRET_RESOURCE_NAME = 'projects/studio-99491860-5533f/secrets/studio-99491860-5533f-7b64c8359930.json/versions/latest';

/**
 * Fetches the service account key from Google Cloud Secret Manager.
 * This function is designed to run in a secure server environment (like App Hosting).
 * @returns {Promise<object>} A promise that resolves to the parsed service account JSON object.
 */
async function getServiceAccount(): Promise<object> {
  // In a production environment (like App Hosting), the Secret Manager client
  // will automatically use the runtime's service account for authentication.
  const secretManager = new SecretManagerServiceClient();

  try {
    const [accessResponse] = await secretManager.accessSecretVersion({
      name: SECRET_RESOURCE_NAME,
    });

    const payload = accessResponse.payload?.data?.toString();
    if (!payload) {
      throw new Error('Secret payload is empty.');
    }

    return JSON.parse(payload);
  } catch (error) {
    console.error('Failed to fetch service account from Secret Manager:', error);
    // In a real production scenario, you might want to have more robust error handling,
    // like sending an alert or having a fallback mechanism.
    throw new Error('Could not initialize AI service: failed to retrieve credentials.');
  }
}

// We create a promise that will resolve with the configured Genkit 'ai' object.
// This allows other parts of the application to import and use the 'ai' object
// without worrying about the asynchronous nature of fetching the credentials.
const configureAi = async () => {
  // Determine if we are in a production-like environment.
  // App Hosting sets specific environment variables like K_SERVICE.
  const isProd = !!process.env.K_SERVICE;

  let serviceAccount;
  if (isProd) {
    // In production, fetch the credentials from Secret Manager.
    const sa = await getServiceAccount();
    serviceAccount = {
      client_email: (sa as any).client_email,
      private_key: (sa as any).private_key,
    };
  } else {
    // For local development, we fall back to the local JSON file.
    // This allows you to run 'genkit:watch' without needing Secret Manager access locally.
    const sa = await import('./studio-99491860-5533f-7b64c8359930.json');
    serviceAccount = {
      client_email: sa.client_email,
      private_key: sa.private_key,
    };
  }

  // Configure and initialize Genkit with the Vertex AI plugin and the obtained credentials.
  return genkit({
    plugins: [
      vertexAI({
        projectId: 'studio-99491860-5533f',
        location: 'us-central1',
        serviceAccount,
      }),
    ],
  });
};

// Export the promise directly. When other modules `await ai`, they will get the
// fully configured Genkit instance once the credentials are fetched.
export const ai = configureAi();
