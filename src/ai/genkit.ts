
'use server';
import {ai} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Se eliminó la importación de '@genkit-ai/google-genai/internal' y la función 'getGoogleAuth'
// ya que el manejo de credenciales está ahora integrado en el plugin.
//
// Para el desarrollo local, asegúrate de haber ejecutado:
// gcloud auth application-default login
//
// El plugin 'googleAI' buscará automáticamente estas credenciales.
ai.registerPlugin('google-genai', googleAI());

export {ai};
