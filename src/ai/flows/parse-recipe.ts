'use server';

/**
 * @fileOverview Un agente de IA para analizar recetas.
 *
 * - parseRecipe - Una función que analiza una receta a partir de texto y/o ingredientes.
 */

import {ai} from '@/ai/genkit';
import {
  ParseRecipeInputSchema,
  ParseRecipeOutputSchema,
  type ParseRecipeInput,
  type ParseRecipeOutput,
} from '@/lib/types';

const parseRecipeFlow = ai.defineFlow(
  {
    name: 'parseRecipeFlow',
    inputSchema: ParseRecipeInputSchema,
    outputSchema: ParseRecipeOutputSchema,
  },
  async input => {
    const prompt = ai.definePrompt({
      name: 'parseRecipePrompt',
      input: {schema: ParseRecipeInputSchema},
      output: {schema: ParseRecipeOutputSchema},
      prompt: `Eres un Chef Ejecutivo experto en optimización de procesos de cocina. Tu tarea es analizar una receta y/o una lista de ingredientes para generar una secuencia de tareas lógicas y eficientes, incluyendo preparación y ensamblaje.

      **Instrucciones:**
      1.  **Analiza la entrada**: Recibirás el texto de una receta y/o una lista de ingredientes.
      2.  **Genera Tareas de Preparación**: A partir de los ingredientes, deduce tareas de preparación básicas (ej. "picar cebolla", "rebanar jitomate").
      3.  **Genera Tareas de Ensamblaje (Lógica de Chef)**: Si solo se dan ingredientes, o si los pasos no están claros, deduce la secuencia de ensamblaje más lógica y estable. Piensa como un chef: ¿qué va primero para crear una base estable? ¿Qué actúa como barrera de humedad?
          *   **Ejemplo de Sándwich (Ingredientes: pan, mayonesa, jamón, lechuga):**
              1.  "Untar mayonesa en pan (base)" -> La mayonesa es barrera de humedad.
              2.  "Colocar jamón sobre la mayonesa" -> El jamón es estable y se adhiere bien.
              3.  "Añadir lechuga sobre el jamón" -> La lechuga es menos estable, va encima de la base.
              4.  "Colocar tapa de pan" -> Cierre final.
      4.  **Integra Pasos Explícitos**: Si se provee el texto de la receta, úsalo como guía principal, pero enriquécelo con las tareas de preparación y ensamblaje que hayas deducido.
      5.  **Estima Duraciones**: Asigna una duración razonable en **segundos** para cada tarea.
      6.  **Genera Dependencias**: Crea un mapa de dependencias lógicas. La tarea "Colocar jamón" depende de "Untar mayonesa". Una cocción depende de tener los ingredientes picados.
      
      **Entrada:**
      {{#if recipeText}}
      Texto de la Receta:
      {{{recipeText}}}
      {{/if}}
      
      {{#if ingredients}}
      Lista de Ingredientes:
      {{#each ingredients}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
      {{/if}}

      **Salida Requerida:**
      Responde **ÚNICAMENTE** con un objeto JSON válido que contenga "recipeName", "tasks" (con "name" y "duration" en segundos), y "dependencies" (un objeto donde la clave es el nombre de la tarea y el valor es un array de sus predecesoras).
      `,
    });

    const {output} = await prompt(input);
    return output!;
  }
);

export async function parseRecipe(
  input: ParseRecipeInput
): Promise<ParseRecipeOutput> {
  return await parseRecipeFlow(input);
}