
// src/ai/genkit.ts
import 'server-only';
import { genkit } from 'genkit';
import { vertexAI } from '@genkit-ai/vertexai';

const projectId = process.env.GCLOUD_PROJECT;

if (!projectId) {
  throw new Error(
    "❌ CRITICAL ERROR: The GCLOUD_PROJECT environment variable was not found. " +
    "Ensure it is defined in your configuration."
  );
}

// Check if running in a Google Cloud environment (like App Hosting)
const isRunningInGoogleCloud = !!process.env.K_SERVICE || !!process.env.GAE_SERVICE;

// Only perform local authentication checks if NOT in a Google Cloud environment
if (!isRunningInGoogleCloud) {
  // These environment variables are typically set for service accounts. If they don't exist,
  // we rely on Application Default Credentials (ADC), which are set up by the gcloud command.
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GCLOUD_AUTH_IMPERSONATED_SERVICE_ACCOUNT) {
    const guideMessage = `
    ================================================================================
    ❌ LOCAL AUTHENTICATION ERROR
    --------------------------------------------------------------------------------
    Your local development environment is not authenticated with Google Cloud.
    To use the AI features locally, you need to log in with your Google account.

    --> SOLUTION: Open your terminal and run the following command:

        gcloud auth application-default login

    After you complete the login process in your browser, restart the development server.
    ================================================================================
    `;
    
    // The console.error ensures this prominent message is displayed in the terminal.
    console.error(guideMessage);

    // Add a warning that we're proceeding, but Genkit will likely fail with a more
    // cryptic auth error. The message above is the primary guidance.
    console.warn(
      '🟡 LOCAL DEVELOPMENT WARNING: No service account credentials found. ' +
      'The application will attempt to use Application Default Credentials (ADC). ' +
      'If authentication fails, please follow the guide logged in the console.'
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
