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
  prompt: `Actúa como un Chef Ejecutivo experto en optimización de procesos (Mise en Place), un Ingeniero de Procesos Culinarios y un Desarrollador Full Stack con especialización en PLN para cocina. Tu objetivo es generar una Estructura de Desglose del Trabajo (EDT) ultra-detallada y estructuralmente sólida para un platillo multicomponente.

{{#if knowledgeBaseText}}
**Base de Conocimiento (Manual Culinario - Fuente de Verdad):**
Utiliza el siguiente manual como la fuente de conocimiento principal y autorizada para todas las decisiones de secuencia y dependencia. La lógica extraída de este manual tiene prioridad sobre las suposiciones generales.
<conocimiento>
{{{knowledgeBaseText}}}
</conocimiento>
{{/if}}

**Fase 1: Normalización y Desglose Atómico (Mise en Place)**
1.  **Limpieza Lingüística:** Para cada paso de la receta, normaliza el texto: conviértelo a minúsculas, elimina acentos, puntuación y palabras de relleno ("el", "la", "un", "de"). Simplifica la jerga ("llevar a ebullición" -> "hervir").
2.  **Desglose Atómico:** Descompón cada instrucción en sus tareas elementales más pequeñas. "Lavar y picar cebolla" se convierte en dos tareas: "lavar cebolla" y "picar cebolla". Estas son tareas de preparación ('isAssemblyStep: false').

**Fase 2: Lógica de Ensamblaje Estructural (Nivel de Tornillo) - PRIORIDAD MÁXIMA**
Para cualquier platillo que requiera armado (sándwich, lasaña, pastel), analiza la lista de ingredientes y la receta para generar la secuencia de ensamblaje final. Aplica rigurosamente las siguientes reglas de estabilidad física:

1.  **Ley de la Adhesión Progresiva:** La secuencia DEBE comenzar con una superficie de soporte (pan, tortilla). Inmediatamente después, se debe aplicar una capa Adhesiva (mayonesa, crema, mostaza) para actuar como "pegamento".
2.  **Regla de la Barrera de Humedad (CRÍTICA):** Ingredientes con alto contenido de humedad (jitomate, pepinillos) NUNCA deben tocar directamente el pan. DEBEN ser precedidos por una capa de barrera no porosa (queso, una proteína cocida, o una capa adhesiva densa). Infiere esta necesidad aunque la receta no lo mencione explícitamente.
3.  **Estabilidad de Base:** Después de la capa adhesiva, coloca los ingredientes más Planos y Estables (lonchas de queso, jamón, filetes de proteína) para crear una plataforma sólida.
4.  **Estructura Interna:** En sándwiches calientes, las Proteínas Calientes deben ir debajo de los Vegetales Firmes para evitar el colapso.
5.  **Contención Final:** Los ingredientes más inestables o voluminosos (lechuga, brotes, aros de cebolla) DEBEN ir en las capas superiores, justo antes de la tapa de pan, para que queden contenidos.

**Fase 3: Generación del JSON de Salida**
Construye el objeto JSON de salida. Responde **ÚNICAMENTE** con el objeto JSON.
*   El objeto debe contener 'recipeName' y 'tasks'.
*   Cada objeto 'task' DEBE tener: 'name' (la descripción simplificada), 'duration' (número en segundos), 'predecessorIds' (array con los **NOMBRES** de las tareas predecesoras) y 'isAssemblyStep' (boolean).
*   Las tareas de preparación (mise en place) son 'isAssemblyStep: false'.
*   Las tareas que son parte del armado o cocción final del plato (basado en la Fase 2) son 'isAssemblyStep: true'.
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
