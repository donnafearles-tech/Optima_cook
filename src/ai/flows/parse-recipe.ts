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
  prompt: `Actúa como un Chef de alta cocina experto en optimización de procesos (Mise en Place) y simultáneamente como un Ingeniero de Procesos. Tu nivel de detalle es equiparable al de un manual de ensamblaje industrial.

    **Objetivo Principal:**
    Analiza la receta de cocina proporcionada y genera una estructura de datos JSON ultra-detallada. Esta estructura debe incluir el nombre de la receta y una secuencia de pasos de preparación (tareas). El análisis de tareas debe ser exhaustivo, identificando dependencias lógicas y, de forma crítica, **dependencias físicas de ensamblaje** para productos que requieren armado.

    **Instrucciones Detalladas:**

    1.  **Análisis y Desglose a Nivel Atómico (EDT):**
        *   Realiza una Estructura de Desglose del Trabajo (EDT) extremadamente granular.
        *   Descompón cada paso en sus tareas más elementales. Ejemplo: "Cortar vegetales" se desglosa en "Lavar tomate", "Secar tomate", "Cortar tomate en rodajas".

    2.  **Secuenciación y Dependencias (CRÍTICO):**
        *   **Dependencias Lógicas:** Identifica las tareas predecesoras obvias. (Ej: "Picar cebolla" debe venir después de "Pelar cebolla").
        *   **Dependencias Físicas y de Ensamblaje (Nivel de Tornillo):** Para productos que requieren armado (sándwiches, hamburguesas, lasañas), analiza el orden de montaje para garantizar la estabilidad estructural. Piensa en la física: los ingredientes resbaladizos no deben servir de base para otros más pesados.
            *   **Ejemplo de Lógica para un Sándwich:**
                1.  "Untar mayonesa en pan base" (actúa como barrera de humedad y adhesivo).
                2.  "Colocar loncha de queso sobre la mayonesa" (se adhiere bien).
                3.  "Colocar hoja de lechuga sobre el queso".
                4.  "Colocar loncha de jamón sobre la lechuga" (el jamón "ancla" la lechuga).
                5.  "Colocar rodajas de tomate sobre el jamón".
                6.  "Colocar tapa de pan".
            *   Genera las tareas y sus dependencias siguiendo esta lógica de construcción estable. Para productos que no requieren armado (ej. una sopa), enfócate solo en las dependencias lógicas de preparación.

    3.  **Estimación de Duración:** Asigna una duración estimada y realista en **segundos** a cada tarea atómica.

    4.  **Generación del Output (Formato JSON Estricto):**
        *   Responde **ÚNICAMENTE** con un objeto JSON válido.
        *   El objeto de receta debe contener 'recipeName' y 'tasks'.
        *   Cada objeto 'task' debe tener: 'name' (string), 'duration' (number en segundos), 'predecessorIds' (array de strings con los nombres de las tareas predecesoras), y 'isAssemblyStep' (boolean).
        *   Las tareas de preparación (p. ej., picar, lavar, medir) deben tener 'isAssemblyStep: false'.
        *   Las tareas que forman parte del armado final del platillo (p. ej., "Colocar lechuga sobre el jamón") deben tener 'isAssemblyStep: true'.
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
