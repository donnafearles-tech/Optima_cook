/**
 * @fileOverview Un agente de IA para sugerir dependencias de tareas.
 */

import {ai} from '@/ai/genkit';
import {
  SuggestTaskDependenciesInputSchema,
  SuggestTaskDependenciesOutputSchema,
} from '@/lib/types';
import { vertexAI } from '@genkit-ai/vertexai';

const suggestTaskDependenciesPrompt = (async () => {
    return (await ai).definePrompt({
      name: 'suggestTaskDependenciesPrompt',
      input: {schema: SuggestTaskDependenciesInputSchema},
      output: {schema: SuggestTaskDependenciesOutputSchema},
      model: vertexAI.model('gemini-2.5-flash'),
      prompt: `Actúas como un Chef Ejecutivo experto en optimización de procesos (Mise en Place). Tu objetivo es analizar una lista de tareas de cocina y establecer las dependencias lógicas correctas (predecesores) para cada una.

**REGLAS FUNDAMENTALES DE SECUENCIA (MANUAL DEL CHEF):**
Utiliza estas reglas como fuente de verdad absoluta.

1.  **Secuencia de Preparación Obligatoria:**
    *   La acción de **Lavar** o **Pelar** un ingrediente SIEMPRE precede a la acción de **Cortar** o **Picar** ese mismo ingrediente.
    *   La acción de **Cortar** o **Picar** un ingrediente SIEMPRE precede a la acción de **Cocinarlo** (sofreír, hornear, freír).
    *   Ejemplo: "Lavar zanahorias" -> "Picar zanahorias" -> "Sofreír zanahorias".

2.  **Secuencia de Ensamblaje Obligatoria (Sándwiches, etc.):**
    *   La **Base** (ej. "Tostar pan") es lo primero.
    *   Luego viene la **Barrera/Adhesivo** (ej. "Untar mayonesa").
    *   Luego los **Ingredientes Sólidos/Húmedos** (ej. "Añadir jamón", "Poner tomate").
    *   Finalmente los **Ingredientes Ligeros/Sensibles** (ej. "Añadir lechuga").
    *   Ejemplo: "Tostar pan" -> "Untar mayonesa" -> "Añadir jamón" -> "Añadir lechuga".

3.  **Reglas de Equipos:**
    *   La tarea **"Precalentar horno"** o **"Precalentar sartén"** debe ser predecesora de cualquier tarea que use ese equipo (ej. "Hornear pavo", "Freír pollo").

**Análisis de la Petición:**
A continuación se te proporciona el nombre de un proyecto y una lista de tareas. Basado en el manual anterior, genera un grafo de dependencias.

Nombre de la Receta: {{{recipeName}}}
Tareas: {{#each taskList}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

**Formato de Salida Obligatorio:**
La salida debe ser un objeto JSON que contenga una clave 'dependencies', que es una lista.
Cada elemento de la lista debe ser un objeto con dos claves: 'taskName' (el nombre de la tarea)
y 'predecessorNames' (una lista de nombres de tareas que son sus predecesoras).

Si una tarea no tiene dependencias lógicas según el manual, su 'predecessorNames' debe ser una lista vacía.
No incluyas la tarea en sus propias dependencias.

Responde ÚNICAMENTE con JSON válido. No incluyas ninguna explicación u otro texto.
Aquí está el JSON:
    `,
    });
})();

export const suggestTaskDependenciesFlow = (async () => {
    return (await ai).defineFlow(
      {
        name: 'suggestTaskDependenciesFlow',
        inputSchema: SuggestTaskDependenciesInputSchema,
        outputSchema: SuggestTaskDependenciesOutputSchema,
      },
      async input => {
        const prompt = await suggestTaskDependenciesPrompt;
        const {output} = await prompt(input);
        return output!;
      }
    );
})();
