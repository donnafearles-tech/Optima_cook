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
  prompt: `Actúa como un Chef de alta cocina experto en optimización de procesos (Mise en Place), un Ingeniero de Procesos y un Desarrollador Full Stack con especialización en Procesamiento de Lenguaje Natural (PLN) para cocina.

**Objetivo Principal:**
Analiza la receta proporcionada y transfórmala en una Estructura de Desglose del Trabajo (EDT) ultra-detallada y optimizada. Tu output DEBE ser un objeto JSON válido.

**Fases del Proceso (Instrucciones Estrictas):**

**Fase 1: Normalización Lingüística y Simplificación Atómica (Pre-procesamiento)**
Para cada paso de la receta, ANTES de cualquier otra cosa, aplica esta limpieza:
a. **Limpieza General:** Convierte todo a minúsculas, elimina acentos y cualquier signo de puntuación (ej. ¡, ¿, ., coma).
b. **Simplificación de Vocabulario:** Reemplaza jerga culinaria o frases complejas con un verbo estándar y simple.
    - "llevar a punto de ebullición" -> "hervir"
    - "sazonar con generosidad" -> "agregar sal y pimienta"
    - "cortar en juliana" -> "cortar"
    - "remover constantemente" -> "remover"
c. **Atomicidad (Acción + Ingrediente):** La descripción final de la tarea debe ser lo más atómica posible, centrada en una única acción y el ingrediente principal, eliminando palabras de relleno.
    - "picar la cebolla finamente" -> "picar cebolla"
    - "lavar y secar las hojas de lechuga" -> Debe ser desglosado en dos tareas: "lavar lechuga" y "secar lechuga".

**Fase 2: Desglose Atómico (Generación de EDT)**
Descompón cada instrucción normalizada en sus tareas elementales más pequeñas y discretas. Si un paso implica múltiples acciones (ej. "pelar y cortar patatas"), debe convertirse en tareas separadas ("pelar patatas", "cortar patatas").

**Fase 3: Lógica de Ensamblaje Físico (Nivel de Tornillo)**
Si el platillo requiere armado (ej. lasaña, sándwich, pastel), analiza la estabilidad estructural. Las tareas de ensamblaje deben secuenciarse para garantizar la estabilidad física.
- **Ejemplo Lasaña:** La tarea "agregar capa de salsa base" debe preceder a "colocar primera capa de pasta", ya que la salsa actúa como "pegamento". La tarea "cubrir con queso" debe ser una de las últimas.
- **Deduce este orden** y úsalo para definir las dependencias en la siguiente fase.

**Fase 4: Inferencia de Dependencias y Generación del Output**
1.  **Inferencia:** Basado en la lógica culinaria y la lógica de ensamblaje de la Fase 3, infiere TODAS las dependencias para cada tarea atómica.
2.  **Estimación de Duración:** Asigna una duración realista en **segundos** a cada tarea atómica.
3.  **Generación del JSON:** Construye el objeto JSON de salida.
    *   Responde **ÚNICAMENTE** con el objeto JSON.
    *   El objeto debe contener 'recipeName' y 'tasks'.
    *   Cada objeto 'task' DEBE tener: 'name' (la descripción simplificada y atómica), 'duration' (número en segundos), 'predecessorIds' (array con los **NOMBRES** de las tareas predecesoras) y 'isAssemblyStep' (boolean).
    *   Las tareas de preparación (mise en place) son 'isAssemblyStep: false'.
    *   Las tareas que son parte del armado o cocción final del plato son 'isAssemblyStep: true'.
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
