'use client';
import {genkit} from 'genkit';
import {vertexAI} from '@genkit-ai/vertexai';
import * as sa from '../../sa.json';

const serviceAccount = {
  client_email: sa.client_email,
  private_key: sa.private_key,
};

export const ai = genkit({
  plugins: [
    vertexAI({
      projectId: 'studio-99491860-5533f',
      location: 'us-central1',
      serviceAccount,
    }),
  ],
  model: 'vertexai/gemini-1.5-flash-001',
});
