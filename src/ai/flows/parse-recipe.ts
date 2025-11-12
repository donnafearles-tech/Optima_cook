/**
 * @fileOverview Un agente de IA para analizar recetas, actuando como un Chef Ejecutivo y un Ingeniero de Procesos.
 *
 * - parseRecipe - Una función que analiza una receta para generar una estructura de tareas ultra-detallada, incluyendo lógica de ensamblaje físico.
 */

import {ai} from '@/ai/genkit';
import {
  ParseRecipeInputSchema,
  ParseRecipeOutputSchema,
} from '@/lib/types';
import { vertexAI } from '@genkit-ai/vertexai';

const parseRecipePrompt = (async () => {
    return (await ai).definePrompt({
      name: 'parseRecipePrompt',
      input: {schema: ParseRecipeInputSchema},
      output: {schema: ParseRecipeOutputSchema},
      model: vertexAI.model('gemini-2.5-pro'),
      prompt: `Actúas como un chef experto en optimización de procesos. Tu objetivo es convertir una receta en una lista de tareas estructuradas en formato JSON.

**Fase 1: Análisis y Desglose de Tareas**
1.  **Normaliza cada paso:** Convierte cada instrucción en una tarea atómica con el formato "verbo en infinitivo + sustantivo(s)". Por ejemplo, "Lavar y picar tomates" se convierte en dos tareas: "lavar tomates" y "picar tomates".
2.  **Infiere Pasos si es Necesario:** Si la receta solo tiene una lista de ingredientes y no tiene instrucciones, infiere los pasos lógicos de preparación y cocción. Por ejemplo, si los ingredientes son para "Hotcakes", infiere tareas como "mezclar ingredientes secos", "añadir leche y huevo", "calentar sartén", "cocinar hotcake".
3.  **Estima la Duración:** Asigna una duración razonable en segundos a cada tarea. (ej: "picar cebolla" - 60s, "precalentar horno" - 300s).
4.  **Define Dependencias Lógicas:** Para cada tarea, identifica qué otras tareas deben completarse antes. Usa los nombres exactos de las tareas como predecesoras.
    *   Lógica común: "lavar" -> "picar" -> "cocinar".
    *   Lógica de ensamblaje: "tostar pan" -> "untar mayonesa" -> "colocar jamón".
5.  **Clasifica la Tarea:** Determina si una tarea es de preparación/cocina ('isAssemblyStep: false') o si es parte del armado final del plato ('isAssemblyStep: true'). Poner ingredientes en un plato o sándwich es un paso de ensamblaje.

**Fase 2: Generación del JSON de Salida**
Construye el objeto JSON. Responde **ÚNICAMENTE** con el objeto JSON válido.
*   El objeto debe contener 'recipeName' y 'tasks'.
*   Cada tarea en 'tasks' debe tener: 'name', 'duration' (en segundos), 'predecessorIds' (array con los **NOMBRES** de las tareas predecesoras), y 'isAssemblyStep' (boolean).

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
})();

export const parseRecipeFlow = (async () => {
    return (await ai).defineFlow(
      {
        name: 'parseRecipeFlow',
        inputSchema: ParseRecipeInputSchema,
        outputSchema: ParseRecipeOutputSchema,
      },
      async input => {
        const prompt = await parseRecipePrompt;
        const {output} = await prompt(input);
        return output!;
      }
    );
})();
