import { config } from 'dotenv';
config();

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Initialize Genkit with Google AI (API Key) for local development
genkit({
  plugins: [
    googleAI(),
  ],
});


import '@/ai/flows/suggest-task-dependencies.ts';
import '@/ai/flows/parse-recipe.ts';
import '@/ai/flows/extract-text-from-file.ts';
import '@/ai/flows/suggest-resource-for-task.ts';
import '@/ai/flows/suggest-keyword-for-resource.ts';
import '@/ai/flows/consolidate-tasks.ts';
import '@/ai/flows/suggest-predecessors-for-task.ts';
