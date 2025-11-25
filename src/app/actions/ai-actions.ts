import 'server-only';
import { parseRecipeFlow } from '@/ai/flows/parse-recipe';
import { GenerateRecipeInput, ParseRecipeInput, TaskCreationInput } from '@/lib/types';
import { generateRecipeFlow } from '@/ai/flows/generate-recipe';
import { consolidateTasksFlow } from '@/ai/flows/consolidate-tasks';
import { extractTextFromFileFlow } from '@/ai/flows/extract-text-from-file';
import { suggestTaskDependenciesFlow } from '@/ai/flows/suggest-task-dependencies';
import { suggestPredecessorsForTaskFlow } from '@/ai/flows/suggest-predecesors-for-task';
import { suggestResourceForTaskFlow } from '@/ai/flows/suggest-resource-for-task';
import { suggestKeywordForResourceFlow } from '@/ai/flows/suggest-keyword-for-resource';
import { generateStoryFlow } from '@/ai/flows/generate-story';

// ====================================================================================================
// FUNCIÓN MODIFICADA: parseRecipe
// Se ha mejorado el manejo de errores para diagnosticar fallas de autenticación/cuota de Vertex AI.
// ====================================================================================================
export async function parseRecipe(input: ParseRecipeInput) {
  try {
    return await parseRecipeFlow(input);
  } catch (error: any) {
    console.error('Error Crítico de Vertex AI al analizar receta:', error);
    
    // --- LÓGICA DE DIAGNÓSTICO DETALLADO ---
    let userMessage = "Error en el análisis de receta. Causa Desconocida.";
    
    if (error && error.message) {
      // 1. Buscamos errores comunes de Vertex AI (API errors)
      if (error.message.includes('permission denied') || error.message.includes('Permission denied')) {
        userMessage = '⚠️ ERROR DE AUTENTICACIÓN (IAM): La Cuenta de Servicio no tiene el rol de "Vertex AI User" o "Acceso a Secretos" en GCP.';
      } else if (error.message.includes('quota exceeded') || error.message.includes('rate limit')) {
        userMessage = '⚠️ LÍMITE DE CUOTA: La cuota de tokens/minuto para Gemini 2.5 Flash en la región us-central1 ha sido excedida.';
      } else if (error.message.includes('could not find region') || error.message.includes('invalid argument')) {
        userMessage = '⚠️ ERROR DE REGIÓN: El modelo no está disponible en la región "us-central1" o el ID del proyecto es incorrecto.';
      } else {
        // Para cualquier otro error de la API, mostramos el mensaje directo del servidor de Google
        userMessage = `Falla de la IA: ${error.message}`;
      }
    } else {
        // En caso de que el error sea un objeto simple o null
        userMessage = "Falla de la IA: El servidor no proporcionó un mensaje de error claro. Revise los logs de Cloud Run.";
    }
    
    // 2. IMPORTANTE: Lanzar un error con el mensaje detallado para que el frontend lo muestre.
    throw new Error(userMessage);
  }
}

// ====================================================================================================
// Las demás funciones se modifican para usar la misma lógica robusta de diagnóstico.
// ====================================================================================================

function handleAIError(error: any, defaultMessage: string): Error {
  console.error(`Error en flujo de IA (${defaultMessage}):`, error);
  
  let userMessage = defaultMessage;
  
  if (error && error.message) {
    if (error.message.includes('permission denied') || error.message.includes('quota exceeded')) {
        // Para evitar repetición, solo lanzamos el error con el mensaje de la API real.
        // El frontend o un componente superior puede formatearlo.
        userMessage = `Falla de la IA: ${error.message}`;
    }
  }
  return new Error(userMessage);
}


export async function generateRecipe(input: GenerateRecipeInput) {
  try {
    return await generateRecipeFlow(input);
  } catch (error) {
    throw handleAIError(error, "No se pudo generar la receta.");
  }
}

export async function consolidateTasks(input: TaskCreationInput) {
  try {
    return await consolidateTasksFlow(input);
  } catch (error) {
    throw handleAIError(error, "No se pudieron consolidar las tareas.");
  }
}

export async function extractTextFromFile(input: { filePath: string }) {
  try {
    return await extractTextFromFileFlow(input);
  } catch (error) {
    throw handleAIError(error, "No se pudo extraer el texto del archivo.");
  }
}

export async function suggestTaskDependencies(input: { projectId: string; taskId: string; currentDependencies: string[] }) {
  try {
    return await suggestTaskDependenciesFlow(input);
  } catch (error) {
    throw handleAIError(error, "No se pudieron sugerir las dependencias.");
  }
}

export async function suggestPredecessorsForTask(input: { projectId: string; taskId: string; currentPredecessors: string[] }) {
  try {
    return await suggestPredecessorsForTaskFlow(input);
  } catch (error) {
    throw handleAIError(error, "No se pudieron sugerir los predecesores.");
  }
}

export async function suggestResourceForTask(input: { projectId: string; taskId: string; currentResources: string[] }) {
  try {
    return await suggestResourceForTaskFlow(input);
  } catch (error) {
    throw handleAIError(error, "No se pudieron sugerir los recursos.");
  }
}

export async function suggestKeywordForResource(input: { resourceId: string }) {
  try {
    return await suggestKeywordForResourceFlow(input);
  } catch (error) {
    throw handleAIError(error, "No se pudo sugerir la palabra clave.");
  }
}

export async function generateStory(input: { projectId: string }) {
  try {
    return await generateStoryFlow(input);
  } catch (error) {
    throw handleAIError(error, "No se pudo generar la historia.");
  }
}