'use server';
/**
 * @fileOverview A flow for extracting text from various file types.
 * - extractTextFromFile - A function that handles text extraction from files.
 */
import { ai } from '@/ai/genkit';
import {
  ExtractTextFromFileInputSchema,
  ExtractTextFromFileOutputSchema,
  type ExtractTextFromFileInput,
  type ExtractTextFromFileOutput,
} from '@/lib/types';
import * as z from 'zod';
import pdf from 'pdf-parse';
import xlsx from 'xlsx';
import mammoth from 'mammoth';

async function extractText(
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === 'application/pdf') {
    const data = await pdf(fileBuffer);
    return data.text;
  } else if (
    mimeType === 'application/vnd.ms-excel' ||
    mimeType ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_text(worksheet);
  } else if (
    mimeType ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const { value } = await mammoth.extractRawText({ buffer: fileBuffer });
    return value;
  } else if (mimeType.startsWith('image/')) {
     const {text} = await ai.generate({
        prompt: [{media: {url: `data:${mimeType};base64,${fileBuffer.toString('base64')}`}}, {text: 'Extract the text from this image.'}],
     });
     return text;
  } else {
    return fileBuffer.toString('utf-8');
  }
}

const extractTextFromFileFlow = ai.defineFlow(
  {
    name: 'extractTextFromFileFlow',
    inputSchema: ExtractTextFromFileInputSchema,
    outputSchema: ExtractTextFromFileOutputSchema,
  },
  async ({ fileDataUri }) => {
    const [header, base64Data] = fileDataUri.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] ?? '';
    const fileBuffer = Buffer.from(base64Data, 'base64');

    const text = await extractText(fileBuffer, mimeType);

    return { text };
  }
);

export async function extractTextFromFile(
  input: ExtractTextFromFileInput
): Promise<ExtractTextFromFileOutput> {
  return await extractTextFromFileFlow(input);
}
