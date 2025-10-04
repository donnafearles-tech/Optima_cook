'use server';

/**
 * @fileOverview Un agente de IA para analizar recetas, actuando como un Chef Ejecutivo y un Ingeniero de Procesos.
 *
 * - parseRecipe - Una función que analiza una receta para generar una estructura de tareas ultra-detallada, incluyendo lógica de ensamblaje físico.
 */

import {ai} from '@/ai/genkit';
import {
  ParseRecipeInputSchema,
  ParseRecipeOutputSchema,
  type ParseRecipeInput,
  type ParseRecipeOutput,
} from '@/lib/types';

const parseRecipePrompt = ai.definePrompt({
  name: 'parseRecipePrompt',
  input: {schema: ParseRecipeInputSchema},
  output: {schema: ParseRecipeOutputSchema},
  prompt: `Actúa como un Chef de alta cocina experto en optimización de procesos (Mise en Place) y simultáneamente como un Ingeniero de Procesos.

    **Objetivo Principal:**
    Analiza la receta de cocina proporcionada y genera una estructura de datos JSON. Tu objetivo es generar una lista de tareas de alto nivel, consolidando micro-pasos. La lista final de tareas debe tener un MÁXIMO de 10 pasos.

    **Instrucciones Detalladas:**

    1.  **Análisis y Agrupación (NO Desglose Atómico):**
        *   En lugar de desglosar cada acción al mínimo, agrupa las tareas relacionadas en pasos lógicos más grandes.
        *   Ejemplo: "Lavar tomate", "Secar tomate", "Cortar tomate en rodajas" deben agruparse en una sola tarea: "Preparar tomates".
        *   **CRÍTICO: El número total de tareas generadas no debe exceder 10.**

    2.  **Secuenciación y Dependencias:**
        *   Identifica las dependencias lógicas entre estas tareas de alto nivel. (Ej: "Cocinar la salsa" debe venir después de "Preparar los vegetales para la salsa").
        *   Para productos que requieren armado (sándwiches, lasañas), considera el orden de montaje al definir las tareas. (Ej: "Montar las capas de la lasaña").

    3.  **Estimación de Duración:** Asigna una duración estimada y realista en **segundos** a cada tarea agrupada.

    4.  **Generación del Output (Formato JSON Estricto):**
        *   Responde **ÚNICAMENTE** con un objeto JSON válido.
        *   El objeto de receta debe contener 'recipeName' y 'tasks'.
        *   Cada objeto 'task' debe tener: 'name' (string), 'duration' (number en segundos), 'predecessorIds' (array de strings con los nombres de las tareas predecesoras), y 'isAssemblyStep' (boolean).
        *   Las tareas de preparación (p. ej., preparar ingredientes) deben tener 'isAssemblyStep: false'.
        *   Las tareas que forman parte del cocinado o armado final del platillo (p. ej., "Hornear la lasaña") deben tener 'isAssemblyStep: true'.
        *   Si una tarea no tiene dependencias, su 'predecessorIds' debe ser un array vacío [].

      **Entrada de la Receta:**
      {{#if recipeText}}
      Texto de la Receta:
      {{{recipeText}}}
      {{/if}}
      
      {{#if ingredients}}
      Lista de Ingredientes:
      {{#each ingredients}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
      {{/if}}
      `,
});

const parseRecipeFlow = ai.defineFlow(
  {
    name: 'parseRecipeFlow',
    inputSchema: ParseRecipeInputSchema,
    outputSchema: ParseRecipeOutputSchema,
  },
  async input => {
    const {output} = await parseRecipePrompt(input);
    return output!;
  }
);

export async function parseRecipe(
  input: ParseRecipeInput
): Promise<ParseRecipeOutput> {
  return await parseRecipeFlow(input);
}
