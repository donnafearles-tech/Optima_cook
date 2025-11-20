'use server';

import {
  generateStoryFlow,
  type GenerateStoryInput,
  type GenerateStoryOutput,
} from '@/ai/flows/generate-story';

export async function generateStory(
  input: GenerateStoryInput
): Promise<GenerateStoryOutput> {
  const { generateStoryFlow } = await import('@/ai/flows/generate-story');
  return await generateStoryFlow(input);
}
