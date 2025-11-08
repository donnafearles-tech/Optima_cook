import { config } from 'dotenv';
config();

import { genkit } from 'genkit';
import { vertexAI } from '@genkit-ai/vertexai';

// Initialize Genkit with Vertex AI for local development
genkit({
  plugins: [
    vertexAI({
      projectId: 'studio-99491860-5533f',
      location: 'us-central1',
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
