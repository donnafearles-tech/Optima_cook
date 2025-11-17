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
import { vertexAI } from '@genkit-ai/vertexai';

const parseRecipePrompt = ai.definePrompt({
      name: 'parseRecipePrompt',
      input: {schema: ParseRecipeInputSchema},
      output: {schema: ParseRecipeOutputSchema},
      model: vertexAI.model({
        model: 'gemini-1.5-pro',
        endpoint: 'us-central1-aiplatform.googleapis.com',
      }),
      prompt: `Actúas como un chef experto en optimización de procesos. Tu objetivo es convertir una receta en una lista de tareas estructuradas en formato JSON.

**Fase 1: Análisis y Desglose de Tareas**
1.  **Normaliza cada paso:** Convierte cada instrucción en una tarea atómica con el formato "verbo en infinitivo + sustantivo(s)". Por ejemplo, "Lavar y picar tomates" se convierte en dos tareas: "lavar tomates" y "picar tomates".
2.  **Identifica Pre-calentamientos:** Si una tarea requiere un horno, sartén o cualquier equipo que necesite calentarse, asegúrate de que exista una tarea predecesora como "precalentar horno".
3.  **Infiere Tiempos:** Basado en la acción (picar, hornear, freír), asigna una duración razonable en segundos. Si la receta especifica un tiempo, úsalo.
4.  **REGLA DE NOMENCLATURA (MUY IMPORTANTE):** El nombre de cada tarea DEBE seguir un formato estricto: "verbo en infinitivo + sustantivo(s)". Esto es para optimizarlo para la lógica de dependencias nativa.
    *   **CORRECTO:** "lavar tomates", "picar cebolla", "untar mayonesa", "colocar jamón".
    *   **INCORRECTO:** "Ahora lavamos los tomates", "El siguiente paso es picar la cebolla", "Tomates lavados".


**Fase 2: Lógica de Dependencias**
Analiza la secuencia de pasos y establece las dependencias lógicas.
*   "picar cebolla" debe ser predecesor de "sofreír cebolla".
*   "preparar masa" debe ser predecesor de "hornear pan".
*   "precalentar horno" es predecesor de "hornear pan".

**Fase 3: Lógica de Ensamblaje Estructural (Nivel de Tornillo) - PRIORIDAD MÁXIMA**
Para cualquier platillo que requiera armado (sándwich, lasaña, pastel), analiza la lista de ingredientes y la receta para generar la secuencia de ensamblaje final.
1.  **Crea la Base:** La primera tarea de ensamblaje es siempre la base (ej. "tostar pan", "colocar base de pasta").
2.  **Aplica Barreras de Humedad:** La siguiente tarea debe ser aplicar una barrera para proteger la base de ingredientes húmedos (ej. "untar mayonesa en pan", "colocar capa de queso").
3.  **Añade Ingredientes por Estabilidad:** Continúa con los ingredientes más pesados o estructurales primero (ej. "colocar jamón"), y los más ligeros o delicados al final (ej. "añadir lechuga").
4.  **Marca las Tareas de Ensamblaje:** Todas las tareas identificadas en esta fase deben tener la propiedad \`isAssemblyStep: true\`. El resto (mise en place) debe tener \`isAssemblyStep: false\`.


**Fase 4: Generación del JSON de Salida**
Construye el objeto JSON de salida. Responde **ÚNICAMENTE** con el objeto JSON.
*   El objeto debe contener 'recipeName' y 'tasks'.
*   Cada objeto 'task' DEBE tener: 'name' (la descripción simplificada y normalizada), 'duration' (número en segundos), 'predecessorIds' (array con los **NOMBRES** de las tareas predecesoras) y 'isAssemblyStep' (boolean).
*   Si una tarea no tiene dependencias, 'predecessorIds' debe ser \`[]\`.

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

export const parseRecipeFlow = ai.defineFlow(
      {
        name: 'parseRecipeFlow',
        inputSchema: ParseRecipeInputSchema,
        outputSchema: ParseRecipeOutputSchema,
      },
      async (input) => {
        if (!input.recipeText && (!input.ingredients || input.ingredients.length === 0)) {
            throw new Error("Se debe proporcionar un texto de receta o una lista de ingredientes.");
        }
        const {output} = await parseRecipePrompt(input);
        return output!;
      }
    );
