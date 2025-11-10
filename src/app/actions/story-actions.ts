'use server';

import {
  generateStoryFlow,
  type GenerateStoryInput,
  type GenerateStoryOutput,
} from '@/ai/flows/generate-story';

/**
 * Server Action para generar una historia.
 * Esta función es la que se llama desde los componentes de cliente.
 * @param input El objeto de entrada que contiene el prompt para la historia.
 * @returns Una promesa que se resuelve con el objeto de salida que contiene la historia.
 */
export async function generateStory(
  input: GenerateStoryInput
): Promise<GenerateStoryOutput> {
  const flow = await generateStoryFlow;
  return await flow(input);
}
