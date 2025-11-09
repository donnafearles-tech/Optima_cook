'use server';

import { genkit } from 'genkit';
import { vertexAI } from '@genkit-ai/vertexai';
import * as sa from './studio-99491860-5533f-7b64c8359930.json';

const serviceAccount = {
  client_email: sa.client_email,
  private_key: sa.private_key,
};

// Initialize Genkit and define the main 'ai' object for local development
export const ai = genkit({
  plugins: [
    vertexAI({
      projectId: 'studio-99491860-5533f',
      location: 'us-central1',
      serviceAccount,
    }),
  ],
});


import '@/ai/flows/suggest-task-dependencies.ts';
import '@/ai/flows/parse-recipe.ts';
import '@/ai/flows/extract-text-from-file.ts';
import '@/ai/flows/suggest-resource-for-task.ts';
import '@/ai/flows/suggest-keyword-for-resource.ts';
import '@/ai/flows/consolidate-tasks.ts';
import '@/ai/flows/suggest-predecessors-for-task.ts';
